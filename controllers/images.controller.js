const { saveImageData } = require('../models/camera.model');

exports.uploadImage = async (req, res) => {
    try {
        const imageData = req.body;
        const imageId = await saveImageData(imageData);
        res.status(201).json({ message: 'Image data saved successfully', imageId });
    } catch (error) {
        console.error('[uploadImage] Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
