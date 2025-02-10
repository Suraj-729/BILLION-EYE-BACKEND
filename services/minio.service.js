const Minio = require("minio");

// MinIO Client Configuration
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
});

// Function to Upload Image to MinIO
const uploadImageToS3 = async (file, bucketName, objectName) => {
    try {
        await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
            "Content-Type": file.mimetype,
        });
        console.log("✅ Image uploaded successfully:", objectName);
        return objectName;
    } catch (error) {
        console.error("❌ MinIO Upload Error:", error);
        throw error;
    }
};

// Function to Get a Presigned URL (to access the file)
const getFileUrl = async (bucketName, objectName) => {
    try {
        const url = await minioClient.presignedUrl("GET", bucketName, objectName, 24 * 60 * 60);
        console.log("🟢 Presigned URL:", url);
        return url;
    } catch (error) {
        console.error("❌ MinIO URL Generation Error:", error);
        throw error;
    }
};

// ✅ Properly export the functions
module.exports = { uploadImageToS3, getFileUrl };
