import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
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
