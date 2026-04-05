const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { S3 } = require('../config/env');

const s3Client = new S3Client({
    region: S3.region,
    credentials: {
        accessKeyId: S3.accessKeyId,
        secretAccessKey: S3.secretAccessKey,
    },
    ...(S3.endpoint ? { endpoint: S3.endpoint } : {}),
});

/**
 * Uploads a base64 encoded file to S3
 * @param {string} base64Data - Full data URI or raw base64
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @param {string} fileName - Destination filename
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
async function uploadBase64(base64Data, mimeType, fileName) {
    if (!S3.bucketName || !S3.accessKeyId || !S3.secretAccessKey) {
        console.warn('[Storage] AWS S3 not configured. Skipping upload.');
        return null;
    }

    // Extract raw base64 if it's a data URI
    const base64String = base64Data.includes('base64,') 
        ? base64Data.split('base64,')[1] 
        : base64Data;

    const buffer = Buffer.from(base64String, 'base64');

    const command = new PutObjectCommand({
        Bucket: S3.bucketName,
        Key: `incidents/${fileName}`,
        Body: buffer,
        ContentType: mimeType,
        // In a real production app, you might want to use signed URLs 
        // instead of public-read, but for a demo, public-read is simpler.
        // ACL: 'public-read', 
    });

    try {
        await s3Client.send(command);
        
        // Construct the URL
        const url = S3.endpoint 
            ? `${S3.endpoint}/${S3.bucketName}/incidents/${fileName}`
            : `https://${S3.bucketName}.s3.${S3.region}.amazonaws.com/incidents/${fileName}`;
            
        return url;
    } catch (err) {
        console.error('[Storage] S3 Upload Failed:', err);
        throw new Error('Failed to upload evidence to cloud storage');
    }
}

module.exports = { uploadBase64 };
