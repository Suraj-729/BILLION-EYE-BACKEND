const { uploadImageToS3, getFileUrl } = require('../services/minio.service');

const Camera = require('../models/camera.model');
const amqp = require('amqplib');

const queueName = 'image-Queue';

//Function to Push the data to RabbitMq
const PushToQueue = async (data) => {
   try{
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: true });

        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });    

        console.log("📤 Message pushed to queue:", data);
        
        await channel.close();
        await connection.close();
   } catch (error){
        console.error("❌ Error pushing data to Queue:", error);
   }
}


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
          // Push to RabbitMQ ✅
          await PushToQueue({ userId, latitude, longitude, timestamp, imageUrl });

        res.status(200).json({ imageId, incidentId, imageUrl });
    } catch (error) {
        console.error("❌ Error uploading image:", error);
        res.status(500).json({ error: "Failed to upload image" });
    }
};

// const getImageData = async(req, res) => {
//     try{
//         const { incidentId } = req.params;
//         const image = await Camera.getImageData(incidentId);
//          console.log("🟢 Image Data:", image);
         
//         if(!image){
//             return res.status(404).json({ error: "Image not found" });
//         }

//         res.status(200).json(image);
//     } catch (error){
//         console.error("❌ Error fetching image data:", error);
//         res.status(500).json({ error: "Failed to fetch image data" });
//     }
// }


const getAllincdents =  async (req, res) => {
    
    try{
        // Fetch all incident data from the database
         const incidents = await Camera.getAllImages();

         if(!incidents || incidents.length === 0){
                return res.status(404).json({ error: "No incidents found" });
         }

            res.status(200).json(incidents);

    } catch (error){
        console.error("❌ Error fetching incidents:", error);
        res.status(500).json({ error: "Failed to fetch incidents" });
    }

}

module.exports = { uploadImage , getAllincdents  };

































// // /**
// //  * Uploads an image to MinIO and saves its metadata to the database.
// //  * 
// //  * @param {Object} req - The request object.
// //  * @param {Object} req.file - The uploaded file.
// //  * @param {Object} req.body - The request body.
// //  * @param {string} req.body.userId - The ID of the user uploading the image.
// //  * @param {number} req.body.latitude - The latitude where the image was taken.
// //  * @param {number} req.body.longitude - The longitude where the image was taken.
// //  * @param {string} req.body.timestamp - The timestamp when the image was taken.
// //  * @param {Object} res - The response object.
// //  * @returns {Promise<void>}
// //  */