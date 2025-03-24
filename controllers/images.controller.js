const { uploadImageToS3, getFileUrl } = require("../services/minio.service");

const piexif = require("piexifjs");
const Camera = require("../models/camera.model");
const amqp = require("amqplib");

 const queueName = 'image_queue';
 //const queueName = "image-queue";
  const rabbitmqHost = "192.168.192.177";
//Function to Push the data to RabbitMq

const PushToQueue = async (data) => {
  console.log(data);

  try {
      //const connection = await amqp.connect(`amqp://localhost`);
     const connection = await amqp.connect(`amqp://${rabbitmqHost}:5672`);
      const channel = await connection.createChannel();
      await channel.assertQueue(queueName, { durable: false });

      // ✅ Extract EXIF data before sending the message
      const exifData = await extractExifMetadata(data.base64String);
      console.log("📝 EXIF Data to be sent:", exifData);

      // ✅ Attach EXIF data to the message payload
      const messagePayload = {
          ...data,
          exifData,  // ✅ Now properly included
      };

      let response = channel.sendToQueue(
          queueName,
          Buffer.from(JSON.stringify(messagePayload)),
          { persistent: true }
      );

      console.log("📤 Message pushed to queue with EXIF data:", response);

      await channel.close();
      await connection.close();

      return true;
  } catch (error) {
      console.error("❌ Error pushing data to Queue:", error);
  }
};




async function extractExifMetadata(base64String) {
  try {
    // Convert the Base64 string to a binary string
    const binaryString = Buffer.from(base64String, "base64").toString("binary");

    // Extract EXIF data
    const exifObj = piexif.load(binaryString);
    console.log("📝 Parsed EXIF Data:", exifObj);

    return {
      latitude: exifObj.GPS[piexif.GPSIFD.GPSLatitude] || null,
      longitude: exifObj.GPS[piexif.GPSIFD.GPSLongitude] || null,
      timestamp: exifObj.Exif[piexif.ExifIFD.DateTimeOriginal] || null,
      cameraModel: exifObj.Exif[piexif.ExifIFD.Model] || null,
      make: exifObj.Exif[piexif.ExifIFD.Make] || null,
    };
  } catch (error) {
    console.error("[extractExifMetadata] Error extracting EXIF data:", error);
    return {};
  }
}


// 
const uploadImage = async (req, res) => {
  try {
    const { base64String, userId, latitude, longitude, timestamp } = req.body;
    console.log("Image received from the client");

    if (!base64String) {
      return res.status(400).json({ error: "No image data provided" });
    }

    console.log("🟢 Request Body:", req.body);

    // ✅ Extract EXIF data before pushing to RabbitMQ
    const exifData = await extractExifMetadata(Buffer.from(base64String, "base64"));

    // ✅ Format location in GeoJSON format
    const location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)] // Ensure correct order and numeric type
    };

    // ✅ Push image data to RabbitMQ
    const queuePushed = await PushToQueue({
      userId,
      location, // ✅ Ensure location is in the correct format
      timestamp,
      base64String,
      exifData
    });

    if (!queuePushed) {
      return res.status(500).json({ error: "Failed to push image data to queue" });
    }

    // ✅ Save image data, including EXIF, to MongoDB
    const { imageId, incidentId } = await Camera.saveImageData({
      userId,
      location, // ✅ Ensure location is correctly stored
      timestamp,
      base64String,
      exif: exifData,
    });

    res.status(200).json({ imageId, incidentId });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};





const getAllincdents = async (req, res) => {
  try {
    // Fetch all incident data from the database
    const incidents = await Camera.getAllImages();

    if (!incidents || incidents.length === 0) {
      return res.status(404).json({ error: "No incidents found" });
    }

    res.status(200).json(incidents);
  } catch (error) {
    console.error("❌ Error fetching incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
};

module.exports = { uploadImage, getAllincdents , extractExifMetadata}; 





// const uploadImage = async (req, res) => {
//   try {
//       const { base64String, userId, latitude, longitude, timestamp  } = req.body;
//       console.log("Image received from the client");

//       if (!base64String) {
//           return res.status(400).json({ error: "No image data provided" });
//       }

//       console.log("🟢 Request Body:", req.body);

//       // ✅ Extract EXIF data before pushing to RabbitMQ
//       const exifData = extractExifData(base64String);
      
//       // ✅ Push image data to RabbitMQ
//       const queuePushed = await PushToQueue({
//           userId,
//           latitude,
//           longitude,
//           timestamp,
//           base64String,
//           exifData // ✅ Ensure this is passed
//       });

//       if (!queuePushed) {
//           return res.status(500).json({ error: "Failed to push image data to queue" });
//       }

//       // ✅ Save image data, including EXIF, to MongoDB
//       const { imageId, incidentId } = await Camera.saveImageData({
//           userId,
//           latitude,
//           longitude,
//           timestamp,
//           base64String,
//           exif: exifData, // ✅ Ensure this is passed
//       });

//       res.status(200).json({ imageId, incidentId });
//   } catch (error) {
//       console.error("❌ Error uploading image:", error);
//       res.status(500).json({ error: "Failed to upload image" });
//   }
// };


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


// const uploadImage = async (req, res) => {
//     try {
//         // Check if file exists
//         if (!req.file) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }

//         const { file } = req;
//         const { userId, latitude, longitude, timestamp } = req.body;

//         console.log("🟢 Request Body:", req.body);
//         console.log("🟢 Uploaded File:", req.file);

//         // Define bucket and object name
//         const bucketName = process.env.MINIO_BUCKET_NAME;
//         const objectName = `user-${userId}-${Date.now()}.png`;

//         // Upload image to MinIO
//         await uploadImageToS3(file, bucketName, objectName);

//         // Get the image URL
//         const imageUrl = await getFileUrl(bucketName, objectName);

//         // Save image metadata to database
//         const { imageId, incidentId } = await Camera.saveImageData({
//             userId,
//             latitude,
//             longitude,
//             timestamp,
//             imageUrl, // Include the image URL
//         });
//           // Push to RabbitMQ ✅
//           await PushToQueue({ userId, latitude, longitude, timestamp, imageUrl });

//         res.status(200).json({ imageId, incidentId, imageUrl });
//     } catch (error) {
//         console.error("❌ Error uploading image:", error);
//         res.status(500).json({ error: "Failed to upload image" });
//     }
// };

// const uploadImage = async (req, res) => {
//     try {
//         // Check if image data exists in the request body
//         const { base64String, userId, latitude, longitude, timestamp } = req.body;
//         console.log("Image received from the client");

//         if (!base64String) {
//             return res.status(400).json({ error: "No image data provided" });
//         }

//         console.log("🟢 Request Body:", req.body);

//         // Save base64 image data to the database
//         const { imageId, incidentId } = await Camera.saveImageData({
//             userId,
//             latitude,
//             longitude,
//             timestamp,
//             base64String, // Store base64 image data directly
//         });

//         // Push to RabbitMQ ✅
//         await PushToQueue({ userId, latitude, longitude, timestamp, base64String });

//         res.status(200).json({ imageId, incidentId });
//     } catch (error) {
//         console.error("❌ Error uploading image:", error);
//         res.status(500).json({ error: "Failed to upload image" });
//     }
// };




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



// const PushToQueue = async (data) => {
//   console.log(data);

//   try {
//     const connection = await amqp.connect(`amqp://localhost`);
//     //  const connection = await amqp.connect(`amqp://${rabbitmqHost}:5672`);
//     const channel = await connection.createChannel();
//     let assertrespone = await channel.assertQueue(queueName, {
//       durable: false,
//       maxLengthBytes: 30 * 1024 * 1024,
//     });
//     // delete data.base64String;
//     let respone = channel.sendToQueue(
//       queueName,
//       Buffer.from(JSON.stringify(data)),
//       { persistent: true }
//     );

//     console.log(
//       "📤 Message pushed to queue",
//       assertrespone,
//       respone,
//       queueName
//     );

//     await channel.close();

//     await connection.close();

//     return true;
//   } catch (error) {
//     console.error("❌ Error pushing data to Queue:", error);
//   }
// };