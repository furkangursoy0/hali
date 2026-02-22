const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is missing. /api/render will fail until it is set.');
}
if (!JWT_SECRET) {
  console.warn('JWT_SECRET is missing. Auth endpoints will fail until it is set.');
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));

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
  preview: `Remove any existing rug from the room.
Place the provided rug image on the floor in a natural position.
Keep perspective approximate.
Low detail, basic realism.
Fast render, no refinement.`,
  normal: `Remove any existing rug from the room.
Place the provided rug image naturally on the floor, centered in the seating area.
Match the rug perspective to the room.
Blend lighting and color realistically.
Preserve furniture positions and room structure.
Photorealistic result.`,
};

function getPasswordPolicyError(password) {
  if (!password || password.length < 8) return 'Şifre en az 8 karakter olmalı.';
  if (!/[A-Z]/.test(password)) return 'Şifre en az 1 büyük harf içermeli.';
  if (!/[a-z]/.test(password)) return 'Şifre en az 1 küçük harf içermeli.';
  if (!/[0-9]/.test(password)) return 'Şifre en az 1 rakam içermeli.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Şifre en az 1 özel karakter içermeli.';
  return null;
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

function normalizeUsagePayload(credit) {
  return {
    limit: credit,
    used: 0,
    remaining: credit,
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

  const passwordError = getPasswordPolicyError(adminPassword);
  if (passwordError) {
    console.warn(`Bootstrap admin password invalid: ${passwordError}`);
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

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: true });
  } catch {
    res.status(500).json({ ok: false, db: false });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret is not configured.' });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
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
  return res.json(normalizeUsagePayload(req.user.credit));
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

    return res.json(normalizeUsagePayload(updatedUser.credit));
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
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const role = req.body?.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    const credit = Math.max(0, Math.floor(Number(req.body?.credit || 0)));

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email, password are required.' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email.' });
    }

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.user.create({
      data: { fullName, email, passwordHash, role, credit },
    });

    return res.status(201).json({
      id: created.id,
      fullName: created.fullName,
      email: created.email,
      role: created.role,
      credit: created.credit,
      createdAt: created.createdAt,
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists.' });
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

      const job = await prisma.renderJob.create({
        data: {
          userId: req.user.id,
          mode,
          status: 'processing',
        },
      });
      renderJobId = job.id;

      const formData = new FormData();
      formData.append('model', 'gpt-image-1');
      formData.append('image[]', roomFile.buffer, {
        filename: roomFile.originalname || 'room.jpg',
        contentType: roomFile.mimetype || 'image/jpeg',
      });
      formData.append('image[]', carpetFile.buffer, {
        filename: carpetFile.originalname || 'carpet.png',
        contentType: carpetFile.mimetype || 'image/png',
      });
      formData.append('prompt', PROMPTS[mode]);
      formData.append('n', '1');
      formData.append('size', '1024x1024');
      formData.append('quality', mode === 'preview' ? 'low' : 'high');

      const response = await axios.post('https://api.openai.com/v1/images/edits', formData, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        timeout: 120000,
      });

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

      const imageData = response?.data?.data?.[0];
      if (!imageData) {
        return res.status(502).json({ error: 'No image data returned from upstream.' });
      }

      if (imageData.b64_json) {
        return res.json({ b64_json: imageData.b64_json });
      }
      if (imageData.url) {
        return res.json({ imageUrl: imageData.url });
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
  try {
    await prisma.$connect();
    await ensureBootstrapAdmin();

    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Backend startup failed:', error);
    process.exit(1);
  }
}

start();
