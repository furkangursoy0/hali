const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const sharp = require('sharp');
const crypto = require('crypto');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const DB_CONNECT_RETRIES = 5;
const DB_CONNECT_RETRY_MS = 5000;
let dbConnected = false;

// --- DYNAMIC MASK VARIABLES ---
const FLOOR_MASK_TOP_RATIO_MIN = Number(process.env.FLOOR_MASK_TOP_RATIO_MIN || 0.55);
const FLOOR_MASK_TOP_RATIO_MAX = Number(process.env.FLOOR_MASK_TOP_RATIO_MAX || 0.60);
const FLOOR_MASK_BOTTOM_MARGIN_RATIO = Number(process.env.FLOOR_MASK_BOTTOM_MARGIN_RATIO || 0.05);
const FLOOR_MASK_WIDTH_RATIO_MIN = Number(process.env.FLOOR_MASK_WIDTH_RATIO_MIN || 0.65);
const FLOOR_MASK_WIDTH_RATIO_MAX = Number(process.env.FLOOR_MASK_WIDTH_RATIO_MAX || 0.75);

const RUG_MAX_WIDTH_RATIO = Number(process.env.RUG_MAX_WIDTH_RATIO || 0.90);
const RUG_MAX_HEIGHT_RATIO = Number(process.env.RUG_MAX_HEIGHT_RATIO || 0.85);
const RUG_TOUCH_MARGIN_RATIO = Number(process.env.RUG_TOUCH_MARGIN_RATIO || 0.02);
const EDGE_CONTRAST_THRESHOLD = Number(process.env.EDGE_CONTRAST_THRESHOLD || 0.5);

const INNER_EDIT_ALPHA = Number(process.env.INNER_EDIT_ALPHA ?? 0);

const OPENAI_ENABLE_SHADOW_PASS = process.env.OPENAI_ENABLE_SHADOW_PASS === 'true';
const OPENAI_ENABLE_EDGE_POLISH = process.env.OPENAI_ENABLE_EDGE_POLISH === 'true';
const OPENAI_ENABLE_CANDIDATE_SCORING = process.env.OPENAI_ENABLE_CANDIDATE_SCORING === 'true';

const OPENAI_IMAGE_QUALITY_PREVIEW = process.env.OPENAI_IMAGE_QUALITY_PREVIEW || 'low';
const OPENAI_IMAGE_QUALITY_NORMAL = process.env.OPENAI_IMAGE_QUALITY_NORMAL || 'low';
const OPENAI_RENDER_VARIANTS_PREVIEW = Number(process.env.OPENAI_RENDER_VARIANTS_PREVIEW || 1);
const OPENAI_RENDER_VARIANTS_NORMAL = Number(process.env.OPENAI_RENDER_VARIANTS_NORMAL || 1);

const ROOM_PREP_CACHE_MAX = 50;

function resolveImageSize() {
    return '1024x1024';
}

function resolveImageQuality(mode) {
    return mode === 'preview' ? 'low' : 'high';
}

const DEFAULT_CREDIT_AMOUNT = 5;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const roomPreparationCache = new Map();

function createGradientFloorMasks(width, height) {
    const apiMask = Buffer.alloc(width * height * 4);
    const scoreMask = Buffer.alloc(width * height * 4);

    const targetTopRatio = FLOOR_MASK_TOP_RATIO_MIN + Math.random() * (FLOOR_MASK_TOP_RATIO_MAX - FLOOR_MASK_TOP_RATIO_MIN);
    const targetWidthRatio = FLOOR_MASK_WIDTH_RATIO_MIN + Math.random() * (FLOOR_MASK_WIDTH_RATIO_MAX - FLOOR_MASK_WIDTH_RATIO_MIN);

    let yGate = Math.floor(height * targetTopRatio);
    if (yGate < height * 0.4) yGate = Math.floor(height * 0.4);

    const bottomMargin = Math.floor(height * FLOOR_MASK_BOTTOM_MARGIN_RATIO);
    const effectiveTargetWidth = targetWidthRatio * width;
    const xLeft = Math.floor((width - effectiveTargetWidth) / 2);
    const xRight = xLeft + Math.floor(effectiveTargetWidth);
    const blendPx = 14;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const idx = (y * width + x) * 4;
            let aApi = 0;
            let aScore = 0;

            if (y > yGate && y < height - bottomMargin && x > xLeft && x < xRight) {
                const dLeft = x - xLeft;
                const dRight = xRight - x;
                const dTop = y - yGate;
                const dBottom = height - 1 - bottomMargin - y;
                const edgeDistance = Math.min(dLeft, dRight, dTop, dBottom);

                if (edgeDistance <= blendPx) {
                    // At boundary (edgeDistance=0): alpha=255 (preserve, seamlessly continues outside)
                    // At blendPx inside (edgeDistance=blendPx): alpha=0 (fully editable)
                    const blendT = Math.max(0, Math.min(1, edgeDistance / Math.max(1, blendPx)));
                    aApi = Math.round(255 * (1 - blendT));
                    aScore = Math.round(255 * blendT);
                } else {
                    // Center of floor: fully editable (INNER_EDIT_ALPHA from env, default 0)
                    aApi = INNER_EDIT_ALPHA;
                    aScore = 255;
                }
            } else {
                aApi = 255;
                aScore = 0;
            }

            apiMask[idx] = 0; apiMask[idx + 1] = 0; apiMask[idx + 2] = 0; apiMask[idx + 3] = aApi;
            scoreMask[idx] = 0; scoreMask[idx + 1] = 0; scoreMask[idx + 2] = 0; scoreMask[idx + 3] = aScore;
        }
    }
    return { apiMask, scoreMask };
}

async function prepareRoomImage(buffer) {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const roomHash = hashSum.digest('hex');

    if (roomPreparationCache.has(roomHash)) {
        return roomPreparationCache.get(roomHash);
    }

    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    const preparedBuffer = await image.resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    const preparedMeta = await sharp(preparedBuffer).metadata();
    const preparedWidth = Number(preparedMeta.width || 1024);
    const preparedHeight = Number(preparedMeta.height || 1024);
    const { apiMask, scoreMask } = createGradientFloorMasks(preparedWidth, preparedHeight);
    const [maskBuffer, scoreMaskBuffer] = await Promise.all([
        sharp(apiMask, { raw: { width: preparedWidth, height: preparedHeight, channels: 4 } }).png().toBuffer(),
        sharp(scoreMask, { raw: { width: preparedWidth, height: preparedHeight, channels: 4 } }).png().toBuffer(),
    ]);

    const prepared = { preparedBuffer, maskBuffer, scoreMaskBuffer, width, height };
    roomPreparationCache.set(roomHash, prepared);

    if (roomPreparationCache.size > ROOM_PREP_CACHE_MAX) {
        const firstKey = roomPreparationCache.keys().next().value;
        if (firstKey) roomPreparationCache.delete(firstKey);
    }

    return prepared;
}

async function prepareCarpetImage(buffer) {
    return sharp(buffer).rotate().resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
}

function pickOpenAiSize(originalWidth, originalHeight) {
    return '1024x1024';
}

async function scoreCandidate(candidateBase64, roomBuffer, maskBuffer) {
    const roomMeta = await sharp(roomBuffer).metadata();
    const targetWidth = Number(roomMeta.width || 1024);
    const targetHeight = Number(roomMeta.height || 1024);
    const [roomRaw, candidateRaw, maskRaw] = await Promise.all([
        sharp(roomBuffer).ensureAlpha().raw().toBuffer(),
        sharp(Buffer.from(candidateBase64, 'base64')).resize(targetWidth, targetHeight, { fit: 'cover' }).ensureAlpha().raw().toBuffer(),
        sharp(maskBuffer).resize(targetWidth, targetHeight, { fit: 'fill' }).ensureAlpha().raw().toBuffer(),
    ]);

    let outsideDiff = 0, insideDiff = 0, outsideCount = 0, insideCount = 0;
    let edgeContrastSum = 0, edgeCount = 0, changedCount = 0, insideMaskCount = 0;
    let minX = targetWidth, maxX = -1, minY = targetHeight, maxY = -1;
    const step = 4 * 4;

    for (let i = 0; i < roomRaw.length; i += step) {
        const pixelIndex = i / 4;
        const x = pixelIndex % targetWidth;
        const y = Math.floor(pixelIndex / targetWidth);
        const maskValue = maskRaw[i];
        const dr = Math.abs(roomRaw[i] - candidateRaw[i]);
        const dg = Math.abs(roomRaw[i + 1] - candidateRaw[i + 1]);
        const db = Math.abs(roomRaw[i + 2] - candidateRaw[i + 2]);
        const d = (dr + dg + db) / 3;

        if (maskValue > 120) {
            insideMaskCount += 1; insideDiff += d; insideCount += 1;
        } else {
            outsideDiff += d; outsideCount += 1;
        }

        if (maskValue > 120 && d > 18) {
            edgeContrastSum += d; edgeCount += 1; changedCount += 1;
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
    }

    const outsideMean = outsideCount > 0 ? outsideDiff / outsideCount : 0;
    const insideMean = insideCount > 0 ? insideDiff / insideCount : 0;
    const edgeContrast = edgeCount > 0 ? edgeContrastSum / edgeCount : 0;

    if (edgeContrast < EDGE_CONTRAST_THRESHOLD || changedCount === 0 || maxX <= minX || maxY <= minY) {
        return { score: Number.POSITIVE_INFINITY, rugAreaRatio: 1 };
    }

    const bboxWidthRatio = (maxX - minX + 1) / targetWidth;
    const bboxHeightRatio = (maxY - minY + 1) / targetHeight;
    const touchMarginX = Math.round(targetWidth * RUG_TOUCH_MARGIN_RATIO);
    const touchMarginY = Math.round(targetHeight * RUG_TOUCH_MARGIN_RATIO);
    const touchesFrame = minX <= touchMarginX || maxX >= targetWidth - 1 - touchMarginX || minY <= touchMarginY || maxY >= targetHeight - 1 - touchMarginY;

    let geometryPenalty = 0;
    if (touchesFrame) geometryPenalty += 180;
    if (bboxWidthRatio > RUG_MAX_WIDTH_RATIO) geometryPenalty += (bboxWidthRatio - RUG_MAX_WIDTH_RATIO) * 900;
    if (bboxHeightRatio > RUG_MAX_HEIGHT_RATIO) geometryPenalty += (bboxHeightRatio - RUG_MAX_HEIGHT_RATIO) * 900;

    const changedMaskRatio = insideMaskCount > 0 ? changedCount / insideMaskCount : 1;
    const rugAreaRatio = Math.max(((maxX - minX + 1) * (maxY - minY + 1)) / Math.max(1, targetWidth * targetHeight), changedMaskRatio);
    const lowInsidePenalty = insideMean < 8 ? 18 : 0;

    return { score: outsideMean * 2.2 + lowInsidePenalty - insideMean * 0.2 + geometryPenalty, rugAreaRatio };
}

async function pickBestCandidateBase64(candidateList, roomBuffer, maskBuffer) {
    if (!Array.isArray(candidateList) || candidateList.length === 0) return null;
    if (candidateList.length === 1) {
        const singleMetrics = await scoreCandidate(candidateList[0], roomBuffer, maskBuffer);
        return { base64: candidateList[0], metrics: singleMetrics };
    }

    let best = candidateList[0], bestScore = Number.POSITIVE_INFINITY, bestMetrics = { score: Number.POSITIVE_INFINITY, rugAreaRatio: 1 };

    for (const candidate of candidateList) {
        try {
            const metrics = await scoreCandidate(candidate, roomBuffer, maskBuffer);
            if (metrics.score < bestScore) {
                bestScore = metrics.score; bestMetrics = metrics; best = candidate;
            }
        } catch { }
    }
    return { base64: best, metrics: bestMetrics };
}

async function applyEdgePolish(base64Image, roomBuffer, maskBuffer) {
    const roomMeta = await sharp(roomBuffer).metadata();
    const width = Number(roomMeta.width || 1024);
    const height = Number(roomMeta.height || 1024);
    const [candidateRaw, roomRaw, scoreMaskRaw] = await Promise.all([
        sharp(Buffer.from(base64Image, 'base64')).resize(width, height, { fit: 'cover' }).ensureAlpha().raw().toBuffer(),
        sharp(roomBuffer).ensureAlpha().raw().toBuffer(),
        sharp(maskBuffer).resize(width, height, { fit: 'fill' }).ensureAlpha().raw().toBuffer(),
    ]);

    const pixelCount = width * height;
    const changed = new Uint8Array(pixelCount);

    for (let p = 0; p < pixelCount; p += 1) {
        const i = p * 4;
        if (scoreMaskRaw[i] < 120) continue;
        const d = (Math.abs(candidateRaw[i] - roomRaw[i]) + Math.abs(candidateRaw[i + 1] - roomRaw[i + 1]) + Math.abs(candidateRaw[i + 2] - roomRaw[i + 2])) / 3;
        changed[p] = d > 18 ? 1 : 0;
    }

    const edge = new Uint8Array(pixelCount);

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const p = y * width + x;
            if (!changed[p]) continue;
            if (!changed[p - 1] || !changed[p + 1] || !changed[p - width] || !changed[p + width]) { edge[p] = 1; }
        }
    }

    const out = Buffer.from(candidateRaw);

    for (let p = 0; p < pixelCount; p += 1) {
        if (!edge[p]) continue;
        const i = p * 4;
        out[i] = Math.max(0, Math.round(out[i] * 0.95));
        out[i + 1] = Math.max(0, Math.round(out[i + 1] * 0.95));
        out[i + 2] = Math.max(0, Math.round(out[i + 2] * 0.95));
    }

    const blurred = await sharp(out, { raw: { width, height, channels: 4 } }).blur(1.2).raw().toBuffer();

    for (let p = 0; p < pixelCount; p += 1) {
        if (!edge[p]) continue;
        const i = p * 4;
        out[i] = Math.round(out[i] * 0.75 + blurred[i] * 0.25);
        out[i + 1] = Math.round(out[i + 1] * 0.75 + blurred[i + 1] * 0.25);
        out[i + 2] = Math.round(out[i + 2] * 0.75 + blurred[i + 2] * 0.25);
    }

    const polished = await sharp(out, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
    return polished.toString('base64');
}

function buildRenderFormData({ roomBuffer, carpetBuffer, prompt, n, size, quality, maskBuffer }) {
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('image[]', roomBuffer, { filename: 'room.jpg', contentType: 'image/jpeg' });
    if (carpetBuffer) formData.append('image[]', carpetBuffer, { filename: 'carpet.png', contentType: 'image/png' });
    if (maskBuffer) formData.append('mask', maskBuffer, { filename: 'floor-mask.png', contentType: 'image/png' });
    formData.append('prompt', prompt);
    formData.append('n', String(Math.max(1, n || 1)));
    formData.append('size', size);
    formData.append('quality', quality);
    return formData;
}

async function callOpenAiEdit(formData) {
    return axios.post('https://api.openai.com/v1/images/edits', formData, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, ...formData.getHeaders() },
        timeout: 120000,
    });
}

const rateStore = new Map();
app.use((req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const maxReq = 60;

    const current = rateStore.get(ip);
    if (!current || now > current.resetAt) {
        rateStore.set(ip, { count: 1, resetAt: now + windowMs });
        return next();
    }

    if (current.count >= maxReq) {
        return res.status(429).json({ error: 'Rate limit exceeded. Try again in 1 minute.' });
    }

    current.count += 1;
    return next();
});

const PROMPTS = {
    preview: `Task: Perform scene-consistent inpainting to insert the exact rug from image-2 onto the floor of image-1. Preserve room structure: - Do not change walls, furniture, windows, or camera angle. - Do not move or redesign any objects. Preserve rug identity: - Use the exact rug image as texture source. - Do not reinterpret or redesign the pattern. - Pattern geometry must remain identical. Photorealistic placement: - Place the rug flat on the floor plane. - Match room perspective and vanishing lines. - The rug must be larger at the bottom edge (closer to camera) and narrower at the far edge. - The rug must follow the same vanishing point as the floor lines. - Keep the entire rug fully visible; do not crop or cut any rug edge. - Leave a visible floor margin around the rug on all sides. - Rug footprint should stay moderate (not wall-to-wall, not filling most of the room). - The rug must NOT cover the entire floor. - The rug must be clearly smaller than the room floor. - Do not extend the rug to the walls. - Use the provided floor mask and perspective as fixed. - Only adapt scale and perspective, not design. - Ensure correct real-world scale. Blending & Lighting: - Rug must inherit floor lighting, shadows, color temperature. - Floor texture must subtly affect rug edges. - Remove any mask edges, no white borders, no overlay look. - Apply minimal global luminance adjustment only if strictly necessary. - The rug texture and pattern must be treated as a photographic cutout, not re-generated. Restrictions: - No comparison. - No side-by-side. - No A/B. - Always single final render. Output: - Single realistic image.`,
    normal: `Task: Perform scene-consistent inpainting to insert the exact rug from image-2 onto the floor of image-1. Preserve room structure: - Do not change walls, furniture, windows, or camera angle. - Do not move or redesign any objects. Preserve rug identity: - Use the exact rug image as texture source. - Do not reinterpret or redesign the pattern. - Pattern geometry must remain identical. Photorealistic placement: - Place the rug flat on the floor plane. - Match room perspective and vanishing lines. - The rug must be larger at the bottom edge (closer to camera) and narrower at the far edge. - The rug must follow the same vanishing point as the floor lines. - Keep the entire rug fully visible; do not crop or cut any rug edge. - Leave a visible floor margin around the rug on all sides. - Rug footprint should stay moderate (not wall-to-wall, not filling most of the room). - The rug must NOT cover the entire floor. - The rug must be clearly smaller than the room floor. - Do not extend the rug to the walls. - Use the provided floor mask and perspective as fixed. - Only adapt scale and perspective, not design. - Ensure correct real-world scale. Blending & Lighting: - Rug must inherit floor lighting, shadows, color temperature. - Floor texture must subtly affect rug edges. - Remove any mask edges, no white borders, no overlay look. - Apply minimal global luminance adjustment only if strictly necessary. - The rug texture and pattern must be treated as a photographic cutout, not re-generated. Restrictions: - No comparison. - No side-by-side. - No A/B. - Always single final render. Output: - Single realistic image.`,
};

const SHADOW_PASS_PROMPT = `Add soft, realistic contact shadows under the rug edges. Shadows must be subtle, diffuse, and darker near the contact points. Do not change the rug shape, rug colors, room geometry, furniture, or camera angle. Photorealistic interior photography, no stylization.`;

function getPasswordPolicyError(password) {
    if (!password || password.length < 1) return 'Şifre boş olamaz.';
    return null;
}

function sanitizeUsername(input) {
    return String(input || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9._-]/g, '');
}

function deriveUsernameFromEmail(email) {
    const local = String(email || '').split('@')[0] || '';
    return sanitizeUsername(local);
}

function normalizeIdentity({ email, username }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedUsername = sanitizeUsername(username);

    if (normalizedEmail.includes('@')) {
        return {
            email: normalizedEmail,
            username: deriveUsernameFromEmail(normalizedEmail),
            from: 'email',
        };
    }

    if (normalizedUsername) {
        return {
            email: `${normalizedUsername}@haliai.local`,
            username: normalizedUsername,
            from: 'username',
        };
    }

    return {
        email: '',
        username: '',
        from: 'none',
    };
}

function signToken(user) {
    if (!JWT_SECRET) throw new Error('JWT secret is not configured.');
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

async function resolveUserFromRequest(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    if (!JWT_SECRET) return null;

    const token = authHeader.slice(7);
    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return user;
}

async function requireAuth(req, res, next) {
    const user = await resolveUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}

function getDayStartUtc() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function normalizeUsagePayload(userId, credit) {
    const dailyRenderAgg = await prisma.creditLog.aggregate({
        _sum: { delta: true },
        where: {
            userId,
            reason: 'render',
            createdAt: { gte: getDayStartUtc() },
        },
    });

    const renderDelta = Number(dailyRenderAgg?._sum?.delta || 0);
    const used = renderDelta < 0 ? Math.abs(renderDelta) : 0;
    const safeCredit = Math.max(0, Number(credit || 0));

    return {
        limit: safeCredit + used,
        used,
        remaining: safeCredit,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
}

async function ensureBootstrapAdmin() {
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const adminFullName = (process.env.ADMIN_FULL_NAME || 'Admin').trim();

    if (!adminEmail || !adminPassword) {
        console.warn('ADMIN_EMAIL/ADMIN_PASSWORD is missing. Bootstrap admin was skipped.');
        return;
    }

    const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (exists) return;

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
        data: {
            fullName: adminFullName,
            email: adminEmail,
            passwordHash,
            role: 'ADMIN',
            credit: 999,
        },
    });

    console.log(`Bootstrap admin created: ${adminEmail}`);
}

app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'hali-backend', dbConnected });
});

app.get('/health/db', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, db: true });
    } catch {
        res.status(500).json({ ok: false, db: false });
    }
});

app.get('/', (_req, res) => {
    res.json({ ok: true, service: 'hali-backend' });
});

app.post('/auth/login', async (req, res) => {
    try {
        if (!JWT_SECRET) {
            return res.status(500).json({ error: 'JWT secret is not configured.' });
        }

        const identifier = String(req.body?.username || req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '');

        if (!identifier || !password) {
            return res.status(400).json({ error: 'username/email and password are required.' });
        }

        const identity = normalizeIdentity({ email: identifier, username: identifier });
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identity.email },
                    ...(identifier.includes('@') ? [] : [{ email: identifier }]),
                ],
            },
        });
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı adı/e-posta veya şifre hatalı.' });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Kullanıcı adı/e-posta veya şifre hatalı.' });
        }

        const token = signToken(user);
        return res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                username: deriveUsernameFromEmail(user.email),
                role: user.role,
                credit: user.credit,
            },
        });
    } catch (error) {
        console.error('/auth/login error:', error);
        return res.status(500).json({ error: 'Login failed.' });
    }
});

app.get('/auth/me', requireAuth, async (req, res) => {
    return res.json({
        id: req.user.id,
        fullName: req.user.fullName,
        email: req.user.email,
        username: deriveUsernameFromEmail(req.user.email),
        role: req.user.role,
        credit: req.user.credit,
    });
});

app.post('/contact', async (req, res) => {
    try {
        const name = String(req.body?.name || '').trim();
        const surname = String(req.body?.surname || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        const phone = String(req.body?.phone || '').trim();

        if (!name || !surname || !email || !phone) {
            return res.status(400).json({ error: 'name, surname, email and phone are required.' });
        }
        if (!email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email.' });
        }

        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) {
            return res.status(400).json({ error: 'Invalid phone.' });
        }

        const lead = await prisma.contactLead.create({
            data: {
                name,
                surname,
                email,
                phone,
            },
        });

        return res.status(201).json({ ok: true, id: lead.id });
    } catch (error) {
        console.error('/contact error:', error);
        return res.status(500).json({ error: 'Failed to save contact request.' });
    }
});

app.get('/api/usage', requireAuth, async (req, res) => {
    try {
        const payload = await normalizeUsagePayload(req.user.id, req.user.credit);
        return res.json(payload);
    } catch (error) {
        console.error('/api/usage error:', error);
        return res.status(500).json({ error: 'Failed to fetch usage.' });
    }
});

app.post('/api/usage/consume', requireAuth, async (req, res) => {
    try {
        const amount = Math.max(1, Math.floor(Number(req.body?.amount || 1)));

        const updateResult = await prisma.user.updateMany({
            where: {
                id: req.user.id,
                credit: { gte: amount },
            },
            data: {
                credit: { decrement: amount },
            },
        });

        if (updateResult.count === 0) {
            return res.status(429).json({ code: 'LIMIT_REACHED', error: 'Daily limit reached.' });
        }

        const updatedUser = await prisma.user.findUnique({ where: { id: req.user.id } });
        await prisma.creditLog.create({
            data: {
                userId: req.user.id,
                delta: -amount,
                reason: String(req.body?.type || 'render'),
            },
        });

        const payload = await normalizeUsagePayload(req.user.id, updatedUser.credit);
        return res.json(payload);
    } catch (error) {
        console.error('/api/usage/consume error:', error);
        return res.status(500).json({ error: 'Failed to consume usage.' });
    }
});

app.get('/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
    try {
        const [users, renders] = await Promise.all([
            prisma.user.count(),
            prisma.renderJob.count(),
        ]);
        const totalCreditsAgg = await prisma.user.aggregate({ _sum: { credit: true } });

        res.json({
            users,
            renders,
            totalCredits: totalCreditsAgg._sum.credit || 0,
        });
    } catch (error) {
        console.error('/admin/overview error:', error);
        res.status(500).json({ error: 'Failed to fetch overview.' });
    }
});

app.get('/admin/users', requireAuth, requireAdmin, async (_req, res) => {
    try {
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(
            users.map((u) => ({
                id: u.id,
                fullName: u.fullName,
                email: u.email,
                username: deriveUsernameFromEmail(u.email),
                role: u.role,
                credit: u.credit,
                createdAt: u.createdAt,
            }))
        );
    } catch (error) {
        console.error('/admin/users error:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

app.post('/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const fullName = String(req.body?.fullName || '').trim();
        const rawEmail = String(req.body?.email || '').trim().toLowerCase();
        const rawUsername = String(req.body?.username || '').trim();
        const identity = normalizeIdentity({ email: rawEmail, username: rawUsername });
        const password = String(req.body?.password || '');
        const role = req.body?.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
        const credit = Math.max(0, Math.floor(Number(req.body?.credit || 0)));

        if (!fullName || !identity.email || !password) {
            return res.status(400).json({ error: 'fullName, username/email, password are required.' });
        }

        const passwordError = getPasswordPolicyError(password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const created = await prisma.user.create({
            data: { fullName, email: identity.email, passwordHash, role, credit },
        });

        return res.status(201).json({
            id: created.id,
            fullName: created.fullName,
            email: created.email,
            username: deriveUsernameFromEmail(created.email),
            role: created.role,
            credit: created.credit,
            createdAt: created.createdAt,
        });
    } catch (error) {
        if (error?.code === 'P2002') {
            return res.status(400).json({ error: 'Username/email already exists.' });
        }
        console.error('/admin/users POST error:', error);
        return res.status(500).json({ error: 'Failed to create user.' });
    }
});

app.patch('/admin/users/:id/password', requireAuth, requireAdmin, async (req, res) => {
    try {
        const userId = String(req.params.id);
        const password = String(req.body?.password || '');
        const passwordError = getPasswordPolicyError(password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        res.json({ id: updated.id, ok: true });
    } catch (error) {
        console.error('/admin/users/:id/password error:', error);
        res.status(500).json({ error: 'Failed to update password.' });
    }
});

app.patch('/admin/users/:id/credit', requireAuth, requireAdmin, async (req, res) => {
    try {
        const userId = String(req.params.id);
        const credit = Math.max(0, Math.floor(Number(req.body?.credit || 0)));

        const prev = await prisma.user.findUnique({ where: { id: userId } });
        if (!prev) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const delta = credit - prev.credit;

        const updated = await prisma.$transaction(async (tx) => {
            const nextUser = await tx.user.update({
                where: { id: userId },
                data: { credit },
            });

            if (delta !== 0) {
                await tx.creditLog.create({
                    data: {
                        userId,
                        delta,
                        reason: 'admin_adjust',
                    },
                });
            }

            return nextUser;
        });

        res.json({ id: updated.id, credit: updated.credit });
    } catch (error) {
        console.error('/admin/users/:id/credit error:', error);
        res.status(500).json({ error: 'Failed to update credit.' });
    }
});

app.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const userId = String(req.params.id);

        const target = await prisma.user.findUnique({ where: { id: userId } });
        if (!target) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (target.role === 'ADMIN') {
            const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Last admin cannot be deleted.' });
            }
        }

        await prisma.user.delete({ where: { id: userId } });
        res.json({ ok: true });
    } catch (error) {
        console.error('/admin/users/:id DELETE error:', error);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

app.get('/admin/renders', requireAuth, requireAdmin, async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
        const renders = await prisma.renderJob.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });
        res.json(renders);
    } catch (error) {
        console.error('/admin/renders error:', error);
        res.status(500).json({ error: 'Failed to fetch renders.' });
    }
});

app.post(
    '/api/render',
    requireAuth,
    upload.fields([
        { name: 'roomImage', maxCount: 1 },
        { name: 'carpetImage', maxCount: 1 },
    ]),
    async (req, res) => {
        let renderJobId = null;

        try {
            if (!OPENAI_API_KEY) {
                return res.status(500).json({ error: 'Server key is not configured.' });
            }

            const roomFile = req.files?.roomImage?.[0];
            const carpetFile = req.files?.carpetImage?.[0];
            const mode = req.body?.mode === 'preview' ? 'preview' : 'normal';

            if (!roomFile || !carpetFile) {
                return res.status(400).json({ error: 'roomImage and carpetImage are required.' });
            }

            const { preparedBuffer, maskBuffer, scoreMaskBuffer, width, height } = await prepareRoomImage(roomFile.buffer);
            const preparedCarpetBuffer = await prepareCarpetImage(carpetFile.buffer);
            const renderSize = pickOpenAiSize(width, height);
            const renderQuality = mode === 'preview' ? OPENAI_IMAGE_QUALITY_PREVIEW : OPENAI_IMAGE_QUALITY_NORMAL;

            const job = await prisma.renderJob.create({
                data: {
                    userId: req.user.id,
                    mode,
                    status: 'processing',
                },
            });
            renderJobId = job.id;

            let firstPassResponse;
            const formData = buildRenderFormData({
                roomBuffer: preparedBuffer,
                carpetBuffer: preparedCarpetBuffer,
                prompt: PROMPTS[mode],
                n: mode === 'preview' ? OPENAI_RENDER_VARIANTS_PREVIEW : OPENAI_RENDER_VARIANTS_NORMAL,
                size: renderSize,
                quality: renderQuality,
                maskBuffer,
            });

            try {
                firstPassResponse = await callOpenAiEdit(formData);
            } catch (e) {
                if (String(e?.response?.data?.error?.message).toLowerCase().includes('mask')) {
                    console.warn('Mask rejection, retrying without mask...');
                    firstPassResponse = await callOpenAiEdit(buildRenderFormData({
                        roomBuffer: preparedBuffer,
                        carpetBuffer: preparedCarpetBuffer,
                        prompt: PROMPTS[mode],
                        n: 1,
                        size: renderSize,
                        quality: renderQuality,
                        maskBuffer: null,
                    }));
                } else {
                    throw e;
                }
            }

            const consume = await prisma.user.updateMany({
                where: {
                    id: req.user.id,
                    credit: { gte: 1 },
                },
                data: {
                    credit: { decrement: 1 },
                },
            });

            if (consume.count === 0) {
                if (renderJobId) {
                    await prisma.renderJob.update({
                        where: { id: renderJobId },
                        data: { status: 'failed', error: 'LIMIT_REACHED' },
                    });
                }
                return res.status(429).json({ code: 'LIMIT_REACHED', error: 'Daily limit reached.' });
            }

            await prisma.$transaction([
                prisma.creditLog.create({
                    data: {
                        userId: req.user.id,
                        delta: -1,
                        reason: 'render',
                    },
                }),
                prisma.renderJob.update({
                    where: { id: renderJobId },
                    data: { status: 'success' },
                }),
            ]);

            const imageList = firstPassResponse?.data?.data || [];
            const base64Candidates = imageList.map((item) => item?.b64_json).filter(Boolean);

            if (base64Candidates.length > 0) {
                let finalBase64 = base64Candidates[0];
                let rugAreaRatio = 0;

                if (base64Candidates.length > 1 && OPENAI_ENABLE_CANDIDATE_SCORING) {
                    const best = await pickBestCandidateBase64(base64Candidates, preparedBuffer, scoreMaskBuffer);
                    if (best) {
                        finalBase64 = best.base64;
                        rugAreaRatio = best.metrics?.rugAreaRatio || 0;
                    }
                } else if (OPENAI_ENABLE_SHADOW_PASS || OPENAI_ENABLE_EDGE_POLISH) {
                    const metrics = await scoreCandidate(finalBase64, preparedBuffer, scoreMaskBuffer);
                    rugAreaRatio = metrics.rugAreaRatio;
                }

                if (OPENAI_ENABLE_SHADOW_PASS && rugAreaRatio <= 0.6) {
                    try {
                        const intermediateJpeg = await sharp(Buffer.from(finalBase64, 'base64')).jpeg({ quality: 92 }).toBuffer();
                        const shadowFormData = buildRenderFormData({
                            roomBuffer: intermediateJpeg,
                            carpetBuffer: null,
                            prompt: SHADOW_PASS_PROMPT,
                            n: 1,
                            size: renderSize,
                            quality: renderQuality,
                            maskBuffer,
                        });
                        const shadowRes = await callOpenAiEdit(shadowFormData);
                        if (shadowRes?.data?.data?.[0]?.b64_json) {
                            finalBase64 = shadowRes.data.data[0].b64_json;
                        }
                    } catch (shadowErr) {
                        console.warn('Shadow pass skipped:', shadowErr.message);
                    }
                }

                if (OPENAI_ENABLE_EDGE_POLISH) {
                    finalBase64 = await applyEdgePolish(finalBase64, preparedBuffer, scoreMaskBuffer);
                }

                return res.json({ b64_json: finalBase64 });
            }
            const urlCandidates = imageList.map((item) => item?.url).filter(Boolean);
            if (urlCandidates.length > 0) {
                return res.json({ imageUrl: urlCandidates[0] });
            }

            return res.status(502).json({ error: 'No usable image output.' });
        } catch (error) {
            const upstream = error?.response?.data?.error?.message || error?.response?.data || error?.message;
            console.error('Render backend error:', upstream);

            if (renderJobId) {
                try {
                    await prisma.renderJob.update({
                        where: { id: renderJobId },
                        data: {
                            status: 'failed',
                            error: typeof upstream === 'string' ? upstream.slice(0, 300) : 'Render failed',
                        },
                    });
                } catch (logError) {
                    console.error('Render job update error:', logError);
                }
            }

            return res.status(500).json({ error: typeof upstream === 'string' ? upstream : 'Render failed.' });
        }
    }
);

async function start() {
    const tryConnectDb = async () => {
        for (let attempt = 1; attempt <= DB_CONNECT_RETRIES; attempt += 1) {
            try {
                await prisma.$connect();
                dbConnected = true;
                console.log(`[db] Connected on attempt ${attempt}/${DB_CONNECT_RETRIES}`);
                await ensureBootstrapAdmin();
                return true;
            } catch (error) {
                dbConnected = false;
                const message = error?.message || String(error);
                console.warn(`[db] Connect failed (${attempt}/${DB_CONNECT_RETRIES}): ${message}`);
                if (attempt < DB_CONNECT_RETRIES) {
                    await new Promise((resolve) => setTimeout(resolve, DB_CONNECT_RETRY_MS));
                }
            }
        }
        return false;
    };

    try {
        await prisma.$connect();
        await ensureBootstrapAdmin();
    } catch (error) {
        console.error('Backend startup setup failed:', error);
    }

    const connectedAtBoot = await tryConnectDb();

    app.listen(PORT, () => {
        console.log(`Backend listening on http://localhost:${PORT}`);
        if (!connectedAtBoot) {
            console.warn('[db] Service started in degraded mode. Retrying DB connect in background.');
            const interval = setInterval(async () => {
                if (dbConnected) {
                    clearInterval(interval);
                    return;
                }
                const connected = await tryConnectDb();
                if (connected) {
                    clearInterval(interval);
                    console.log('[db] Recovered.');
                }
            }, DB_CONNECT_RETRY_MS);
        }
    });
}

process.on('SIGTERM', async () => {
    try {
        await prisma.$disconnect();
    } finally {
        process.exit(0);
    }
});

start();
