import axios from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/env';

export interface PlacementResult {
    imageUrl: string;
    success: boolean;
    error?: string;
    errorCode?: 'RENDER_LIMIT' | 'BILLING' | 'API_KEY' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN';
}

function mapRenderErrorMessage(raw: string): string {
    const msg = (raw || '').toLowerCase();
    if (msg.includes('billing hard limit') || msg.includes('insufficient_quota')) {
        return 'OpenAI kredi limiti dolu. Lütfen billing/kredi durumunu kontrol edin.';
    }
    if (msg.includes('invalid api key') || msg.includes('incorrect api key')) {
        return 'Geçersiz API anahtarı. Backend .env dosyasını kontrol edin.';
    }
    if (msg.includes('rate limit')) {
        return 'Çok fazla istek gönderildi. Biraz bekleyip tekrar deneyin.';
    }
    return raw || 'Bilinmeyen hata';
}

async function uriToBlob(uri: string, mimeType: string): Promise<Blob> {
    if (Platform.OS === 'web') {
        // Web: fetch directly works
        const response = await fetch(uri);
        return response.blob();
    } else {
        // Native: use expo-file-system/legacy to read base64 then convert
        const FileSystem = await import('expo-file-system/legacy');
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        const byteChars = atob(base64);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNums[i] = byteChars.charCodeAt(i);
        }
        return new Blob([new Uint8Array(byteNums)], { type: mimeType });
    }
}

async function saveResultImage(base64: string): Promise<string> {
    if (Platform.OS === 'web') {
        // Web: return data URL directly
        return `data:image/png;base64,${base64}`;
    } else {
        // Native: save to cache
        const FileSystem = await import('expo-file-system/legacy');
        const outputPath = `${FileSystem.cacheDirectory}result_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(outputPath, base64, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return outputPath;
    }
}

export type PlacementMode = 'preview' | 'normal';

export async function placeCarperInRoom(
    roomImageUri: string,
    carpetImageUri: string,
    carpetName: string,
    mode: PlacementMode = 'normal'
): Promise<PlacementResult> {
    try {
        const roomBlob = await uriToBlob(roomImageUri, 'image/jpeg');
        const carpetBlob = await uriToBlob(carpetImageUri, 'image/png');

        const formData = new FormData();
        formData.append('roomImage', roomBlob as any, 'room.jpg');
        formData.append('carpetImage', carpetBlob as any, 'carpet.png');
        formData.append('mode', mode);
        formData.append('carpetName', carpetName);

        const response = await axios.post(
            `${API_BASE_URL}/api/render`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 120000,
            }
        );

        const imageData = response.data;

        if (imageData.b64_json) {
            const savedUri = await saveResultImage(imageData.b64_json);
            return { imageUrl: savedUri, success: true };
        } else if (imageData.imageUrl) {
            return { imageUrl: imageData.imageUrl, success: true };
        }

        throw new Error('No image data in response');
    } catch (error: any) {
        console.error('Render API Error:', error?.response?.data || error.message);
        const status = Number(error?.response?.status || 0);
        const backendCode = String(error?.response?.data?.code || '').toUpperCase();
        const rawError =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.response?.data?.error?.message ||
            error.message ||
            'Bilinmeyen hata';
        const mappedMessage = mapRenderErrorMessage(typeof rawError === 'string' ? rawError : JSON.stringify(rawError));
        let errorCode: PlacementResult['errorCode'] = 'UNKNOWN';
        if (backendCode === 'LIMIT_REACHED' || status === 429) {
            errorCode = 'RENDER_LIMIT';
        } else if (mappedMessage.includes('OpenAI kredi limiti dolu')) {
            errorCode = 'BILLING';
        } else if (mappedMessage.includes('Geçersiz API anahtarı')) {
            errorCode = 'API_KEY';
        } else if (mappedMessage.includes('Çok fazla istek')) {
            errorCode = 'RATE_LIMIT';
        } else if ((error?.message || '').toLowerCase().includes('network')) {
            errorCode = 'NETWORK';
        }
        return {
            imageUrl: '',
            success: false,
            error: mappedMessage,
            errorCode,
        };
    }
}
