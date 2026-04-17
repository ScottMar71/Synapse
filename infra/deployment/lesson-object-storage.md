# Lesson file attachments (object storage)

Lesson supplementary files are stored in **S3-compatible object storage**. Metadata lives in Postgres (`lesson_file_attachments`); bytes live in a **private bucket**. The API does not proxy file bodies: it returns **short-lived presigned URLs** after **tenant-, course-, and enrollment-scoped** authorization.

## Environment variables (API runtime)

| Variable | Required | Description |
|----------|----------|-------------|
| `LMS_OBJECT_STORAGE_BUCKET` | Yes (production) | Bucket name. |
| `LMS_OBJECT_STORAGE_ACCESS_KEY` | Yes (production) | S3 access key id. |
| `LMS_OBJECT_STORAGE_SECRET_KEY` | Yes (production) | S3 secret. |
| `LMS_OBJECT_STORAGE_REGION` | No | Default `us-east-1`; set to your region (e.g. `eu-central-1`). |
| `LMS_OBJECT_STORAGE_ENDPOINT` | Often | Custom endpoint for Supabase Storage or MinIO. |
| `LMS_OBJECT_STORAGE_FORCE_PATH_STYLE` | No | Set `true` for Supabase Storage S3 API. |

If these are unset, `apps/api` local dev uses the platform **noop** adapter (placeholder presigned URLs).

## Supabase Storage (EU)

1. In the Supabase dashboard, create a **private** bucket (for example `lesson-files`).
2. Enable **S3 protocol access** and create **S3 credentials** (project settings → Storage).
3. Set:
   - `LMS_OBJECT_STORAGE_BUCKET` = bucket name
   - `LMS_OBJECT_STORAGE_ENDPOINT` = `https://<project_ref>.supabase.co/storage/v1/s3`
   - `LMS_OBJECT_STORAGE_REGION` = the project region (e.g. `eu-central-1`)
   - `LMS_OBJECT_STORAGE_FORCE_PATH_STYLE` = `true`
   - Access key + secret from the dashboard

Object keys use `tenants/{tenantId}/lesson-files/{attachmentId}`; the API verifies the tenant prefix on download.

## Flow

1. **Staff** `POST .../lessons/{lessonId}/files/upload-init` → creates a row and returns a **presigned PUT** URL + metadata.
2. Client **PUTs** the file to that URL.
3. **Learner or staff** `GET .../lessons/{lessonId}/files` → list metadata.
4. **Learner or staff** `GET .../lessons/{lessonId}/files/{fileId}/download` → **presigned GET** (learners require active enrollment; staff do not).

## Related

- [supabase-eu.md](./supabase-eu.md)
- `packages/platform` `StorageAdapter`
