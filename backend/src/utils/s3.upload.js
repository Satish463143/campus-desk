const { Upload } = require('@aws-sdk/lib-storage');

function publicUrl({ bucket, key }) {
  // Adjust if you use a CDN or a different endpoint
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Upload a buffer/stream to S3 (multipart for large files).
 */
async function uploadToS3({ s3, Bucket, Key, Body, ContentType, CacheControl }) {
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket,
      Key,
      Body,
      ContentType,
      CacheControl,
    },
    queueSize: 4,
    partSize: 5 * 1024 * 1024, // 5MB
    leavePartsOnError: false,
  });

  const result = await uploader.done();
  return {
    bucket: Bucket,
    key: Key,
    etag: result?.ETag || null,
    url: publicUrl({ bucket: Bucket, key: Key }),
  };
}

module.exports = { uploadToS3, publicUrl };
