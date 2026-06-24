import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const hasR2Config = Boolean(
  process.env.R2_ENDPOINT &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'hoscore';

// Generate a public URL for a file
// Note: You need to enable public access on the R2 bucket or use a custom domain
function getPublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL || process.env.R2_ENDPOINT}/${key}`;
}

// Get a presigned GET URL for a private R2 object
export async function getPresignedUrl(key: string, expiresInSeconds: number = 900): Promise<string> {
  if (!hasR2Config) {
    return getPublicUrl(key);
  }
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
}

// Extract R2 key from a full URL or key string
export function extractKey(urlOrKey: string): string {
  if (!urlOrKey) return '';
  if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
    return urlOrKey; // It's already a key
  }
  
  const endpoint = process.env.R2_ENDPOINT || '';
  const publicUrl = process.env.R2_PUBLIC_URL || '';
  
  let key = urlOrKey;
  if (publicUrl && key.startsWith(publicUrl)) {
    key = key.replace(publicUrl, '');
  } else if (endpoint && key.startsWith(endpoint)) {
    key = key.replace(endpoint, '');
  } else {
    // Search for known folder structures if the custom domains differ
    const folders = ['/images/', '/documents/', '/uploads/'];
    for (const folder of folders) {
      const idx = key.indexOf(folder);
      if (idx !== -1) {
        return key.substring(idx + 1);
      }
    }
  }
  
  if (key.startsWith('/')) {
    key = key.substring(1);
  }
  return key;
}

// Sign a URL or Key string dynamically
export async function signUrl(urlOrKey: string | null | undefined, expiresInSeconds: number = 900): Promise<string | null> {
  if (!urlOrKey) return null;
  const key = extractKey(urlOrKey);
  if (!key) return null;
  try {
    return await getPresignedUrl(key, expiresInSeconds);
  } catch (err) {
    console.error('Failed to sign URL for key:', key, err);
    return urlOrKey; // Fallback to original URL
  }
}

// Sign an array of hospital photo objects
export async function signHospitalPhotos(photos: unknown, expiresInSeconds: number = 900): Promise<any> {
  if (!photos) return null;
  if (Array.isArray(photos)) {
    return Promise.all(
      photos.map(async (photo: any) => {
        if (typeof photo === 'string') {
          return await signUrl(photo, expiresInSeconds);
        } else if (photo && typeof photo === 'object' && photo.url) {
          return {
            ...photo,
            url: await signUrl(photo.url, expiresInSeconds),
          };
        }
        return photo;
      })
    );
  }
  return photos;
}

// Upload a file buffer to R2
export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<{ key: string; url: string; size: number }> {
  const ext = originalName.split('.').pop() || 'bin';
  const uniqueName = `${folder}/${crypto.randomUUID()}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: uniqueName,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return {
    key: uniqueName,
    url: getPublicUrl(uniqueName),
    size: buffer.length,
  };
}

// Delete a file from R2
export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export interface R2UsageSummary {
  bucket: string;
  objectCount: number;
  totalBytes: number;
  isConfigured: boolean;
}

export async function getR2UsageSummary(): Promise<R2UsageSummary> {
  if (!hasR2Config) {
    return {
      bucket: BUCKET,
      objectCount: 0,
      totalBytes: 0,
      isConfigured: false,
    };
  }

  let continuationToken: string | undefined;
  let objectCount = 0;
  let totalBytes = 0;

  do {
    const response = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken: continuationToken,
      })
    );

    for (const item of response.Contents ?? []) {
      objectCount += 1;
      totalBytes += item.Size ?? 0;
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return {
    bucket: BUCKET,
    objectCount,
    totalBytes,
    isConfigured: true,
  };
}

export { r2, BUCKET, hasR2Config };
