
const { uploadImageToS3, getFileUrl } = require('../services/minio.service');
const  Camera = require('../models/camera.model');



const uploadImage = async (req, res) => {
    try {
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { file } = req;
        const { userId, latitude, longitude, timestamp } = req.body;

        console.log("🟢 Request Body:", req.body);
        console.log("🟢 Uploaded File:", req.file);

        // Define bucket and object name
        const bucketName = process.env.MINIO_BUCKET_NAME;
        const objectName = `user-${userId}-${Date.now()}.png`;

        // Upload image to MinIO
        await uploadImageToS3(file, bucketName, objectName);

        // Get the image URL
        const imageUrl = await getFileUrl(bucketName, objectName);

        // Save image metadata to database
        const { imageId, incidentId } = await Camera.saveImageData({
            userId,
            latitude,
            longitude,
            timestamp,
            imageUrl, // Include the image URL
        });

        res.status(200).json({ imageId, incidentId, imageUrl });
    } catch (error) {
        console.error("❌ Error uploading image:", error);
        res.status(500).json({ error: "Failed to upload image" });
    }
};

module.exports = { uploadImage };
