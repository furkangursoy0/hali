import { Platform } from 'react-native';
import { STORAGE_MODE, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../constants/env';

export type StorageMode = 'mock' | 'cloudinary-unsigned';

export interface UploadImageOptions {
  folder?: string;
}

export interface UploadImageResult {
  url: string;
  provider: StorageMode;
}

export interface StorageClient {
  uploadImage: (uri: string, options?: UploadImageOptions) => Promise<UploadImageResult>;
}

async function uriToBlob(uri: string, mimeType: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.blob();
  }

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

const mockStorageClient: StorageClient = {
  async uploadImage(uri: string) {
    return {
      url: uri,
      provider: 'mock',
    };
  },
};

const cloudinaryUnsignedClient: StorageClient = {
  async uploadImage(uri: string, options?: UploadImageOptions) {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary env eksik: CLOUDINARY_CLOUD_NAME veya CLOUDINARY_UPLOAD_PRESET.');
    }

    const blob = await uriToBlob(uri, 'image/png');
    const formData = new FormData();
    formData.append('file', blob as any, `hali_${Date.now()}.png`);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloud upload basarisiz (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const secureUrl = data?.secure_url;
    if (!secureUrl) {
      throw new Error('Cloud upload yanitinda secure_url yok.');
    }

    return {
      url: secureUrl,
      provider: 'cloudinary-unsigned',
    };
  },
};

const clients: Record<StorageMode, StorageClient> = {
  mock: mockStorageClient,
  'cloudinary-unsigned': cloudinaryUnsignedClient,
};

export function getStorageClient() {
  return clients[STORAGE_MODE];
}
