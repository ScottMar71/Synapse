import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageAdapter } from "@conductor/platform";

const UPLOAD_EXPIRES_SEC = 15 * 60;
const DOWNLOAD_EXPIRES_SEC = 5 * 60;

export type S3CompatibleStorageConfig = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle: boolean;
};

export function readS3CompatibleStorageConfigFromEnv(): S3CompatibleStorageConfig | null {
  const bucket = process.env.LMS_OBJECT_STORAGE_BUCKET?.trim();
  const accessKeyId = process.env.LMS_OBJECT_STORAGE_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.LMS_OBJECT_STORAGE_SECRET_KEY?.trim();
  const region = process.env.LMS_OBJECT_STORAGE_REGION?.trim() || "us-east-1";
  if (!bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }
  const endpoint = process.env.LMS_OBJECT_STORAGE_ENDPOINT?.trim() || undefined;
  const forcePathStyle = process.env.LMS_OBJECT_STORAGE_FORCE_PATH_STYLE === "true";
  return { region, bucket, accessKeyId, secretAccessKey, endpoint, forcePathStyle };
}

function asciiContentDispositionFilename(name: string): string {
  const ascii = name.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return ascii.length > 0 ? ascii : "download";
}

export function createS3CompatibleStorageAdapter(config: S3CompatibleStorageConfig): StorageAdapter {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });

  return {
    async putObject(input) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: input.key,
          Body: Buffer.from(input.body, "utf8")
        })
      );
    },
    async createPresignedPutObjectUrl(input) {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: input.key,
        ContentType: input.contentType,
        ContentLength: input.contentLength
      });
      const url = await getSignedUrl(client, command, { expiresIn: UPLOAD_EXPIRES_SEC });
      return { url, headers: {} };
    },
    async createPresignedGetObjectUrl(input) {
      const safeName = asciiContentDispositionFilename(input.fileName);
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: input.key,
        ResponseContentType: input.contentType,
        ResponseContentDisposition: `attachment; filename="${safeName}"`
      });
      const url = await getSignedUrl(client, command, { expiresIn: DOWNLOAD_EXPIRES_SEC });
      return { url, expiresInSeconds: DOWNLOAD_EXPIRES_SEC };
    }
  };
}
