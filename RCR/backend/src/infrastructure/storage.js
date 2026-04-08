const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3 } = require('../config/env');
const axios = require('axios');

// 🚨 FIXED: Resilience check for S3 config to prevent "Cannot read properties of undefined"
const s3Client = (S3 && S3.region) ? new S3Client({
    region: S3.region,
    credentials: {
        accessKeyId: S3.accessKeyId,
        secretAccessKey: S3.secretAccessKey,
    },
    ...(S3.endpoint ? { endpoint: S3.endpoint } : {}),
}) : null;

/**
 * Generates a presigned URL for direct client-to-S3 uploads
 */
async function getPresignedUploadUrl(fileName, mimeType) {
    if (!s3Client || !S3.bucketName) {
        console.warn('[Storage] AWS S3 not configured. Cannot generate presigned URL.');
        return null;
    }

    const command = new PutObjectCommand({
        Bucket: S3.bucketName,
        Key: `incidents/${fileName}`,
        ContentType: mimeType,
    });

    try {
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        const fileUrl = S3.endpoint 
            ? `${S3.endpoint}/${S3.bucketName}/incidents/${fileName}`
            : `https://${S3.bucketName}.s3.${S3.region}.amazonaws.com/incidents/${fileName}`;
            
        return { uploadUrl, fileUrl };
    } catch (err) {
        console.error('[Storage] S3 Presigned URL Generation Failed:', err);
        throw new Error('Failed to generate secure upload link');
    }
}

/**
 * Uploads a base64 encoded file to S3
 */
async function uploadBase64(base64Data, mimeType, fileName) {
    if (!s3Client || !S3.bucketName) {
        console.warn('[Storage] AWS S3 not configured. Skipping upload.');
        return null;
    }

    const base64String = base64Data.includes('base64,') 
        ? base64Data.split('base64,')[1] 
        : base64Data;

    const buffer = Buffer.from(base64String, 'base64');

    const command = new PutObjectCommand({
        Bucket: S3.bucketName,
        Key: `incidents/${fileName}`,
        Body: buffer,
        ContentType: mimeType,
    });

    try {
        await s3Client.send(command);
        const url = S3.endpoint 
            ? `${S3.endpoint}/${S3.bucketName}/incidents/${fileName}`
            : `https://${S3.bucketName}.s3.${S3.region}.amazonaws.com/incidents/${fileName}`;
        return url;
    } catch (err) {
        console.error('[Storage] S3 Upload Failed:', err);
        throw new Error('Failed to upload evidence to cloud storage');
    }
}

/**
 * 🚨 NEW: Downloads a file from S3 or URL and returns base64
 */
async function downloadToBase64(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    } catch (err) {
        console.error('[Storage] Download to base64 failed:', err.message);
        throw new Error('Could not retrieve media for processing');
    }
}

module.exports = { uploadBase64, getPresignedUploadUrl, downloadToBase64 };
