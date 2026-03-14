import { randomUUID } from "crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "eu-south-2";
const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || "";
const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "";

let s3Client = null;

function getS3Client() {
    if (!s3Client) {
        s3Client = new S3Client({
            region,
            // Disable default checksums so presigned URLs work with browser PUT (no checksum headers)
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
        });
    }
    return s3Client;
}

/**
 * Generate a presigned URL for uploading a file to S3.
 * Returns mediaId (UUID) and s3Key = media/{mediaId}/{filename} so the same id is used when creating the media record.
 * @param {{ filename: string, contentType: string }} opts
 * @returns {Promise<{ uploadUrl: string, mediaId: string, s3Key: string, cdnUrl?: string }>}
 */
export async function createPresignedUpload({ filename, contentType }) {
    if (!bucket) {
        throw new Error("S3 bucket is not configured (set AWS_S3_BUCKET or S3_BUCKET in .env)");
    }
    const mediaId = randomUUID();
    const s3Key = `media/${mediaId}/${filename}`;
    const client = getS3Client();
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        ContentType: contentType || "application/octet-stream",
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    const cdnUrl = cloudFrontUrl
        ? `https://${cloudFrontUrl.replace(/^https?:\/\//, "")}/${s3Key}`
        : undefined;
    return { uploadUrl, mediaId, s3Key, cdnUrl };
}

/**
 * Delete an object from S3 by key.
 * @param {string} s3Key - Full S3 key (e.g. mediateca/xxx-filename.pdf)
 */
export async function deleteObjectFromS3(s3Key) {
    if (!bucket) {
        throw new Error("S3 bucket is not configured (set AWS_S3_BUCKET or S3_BUCKET in .env)");
    }
    if (!s3Key || typeof s3Key !== "string") {
        throw new Error("s3Key is required");
    }
    const client = getS3Client();
    await client.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: s3Key,
        })
    );
}
