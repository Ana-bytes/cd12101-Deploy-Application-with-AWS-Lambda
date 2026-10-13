
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'

import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client
const s3 = new S3Client({})

const attachmentsBucket = process.env.ATTACHMENTS_BUCKET

// Generate a temporary URL to view a TODO attachment
export async function getAttachmentUrl(attachmentKey) {
  return await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: attachmentsBucket,
      Key: attachmentKey
    }),
    { expiresIn: 300 }
  )
}

// Generate a temporary URL to upload a TODO attachment
export async function getUploadUrl(attachmentKey) {
  return await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: attachmentsBucket,
      Key: attachmentKey
    }),
    { expiresIn: 300 }
  )
}