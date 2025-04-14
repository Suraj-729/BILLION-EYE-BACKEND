// const { Client } = require("minio");

// // MinIO Client Configuration
// const minioClient = new Minio.Client({
//   endPoint: process.env.MINIO_ENDPOINT,
//   port: parseInt(process.env.MINIO_PORT),
//   useSSL: process.env.MINIO_USE_SSL === "true",
//   accessKey: process.env.MINIO_ACCESS_KEY,
//   secretKey: process.env.MINIO_SECRET_KEY,
// });

// // Function to Upload Image to MinIO
// const uploadImageToS3 = async (file, bucketName, objectName) => {
//   try {
//     await minioClient.putObject(
//       bucketName,
//       objectName,
//       file.buffer,
//       file.size,
//       {
//         "Content-Type": file.mimetype,
//       }
//     );
//     console.log("✅ Image uploaded successfully:", objectName);
//     return objectName;
//   } catch (error) {
//     console.error("❌ MinIO Upload Error:", error);
//     throw error;
//   }
// };

// // Function to Get a Presigned URL (to access the file)
// const getFileUrl = async (bucketName, objectName) => {
//   try {
//     const url = await minioClient.presignedUrl(
//       "GET",
//       bucketName,
//       objectName,
//       24 * 60 * 60
//     );
//     console.log("🟢 Presigned URL:", url);
//     return url;
//   } catch (error) {
//     console.error("❌ MinIO URL Generation Error:", error);
//     throw error;
//   }
// };
// const getObject = minioClient.getObject;
// const statObject = minioClient.statObject;
// // ✅ Properly export the functions
// module.exports = { uploadImageToS3, getFileUrl, getObject, statObject };

// const AWS = require("aws-sdk");
// require("aws-sdk/lib/maintenance_mode_message").suppress = true;

// // Initialize S3 client
// const s3 = new AWS.S3({
//   accessKeyId: process.env.MINIO_ACCESS_KEY,
//   secretAccessKey: process.env.MINIO_SECRET_KEY,
//   endpoint: new AWS.Endpoint(process.env.MINIO_ENDPOINT), // e.g., http://localhost:9000
//   s3ForcePathStyle: true, // Required for MinIO
//   signatureVersion: 'v4',
// });

// const uploadImageToS3 = (fileData, bucketName, objectName) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const params = {
//         Bucket: bucketName,
//         Key: objectName,
//         Body: fileData.buffer,
//         ContentType: fileData.mimetype,
//       };
//       if (fileData.encoding) {
//         params.ContentEncoding = fileData.encoding;
//       }

//       await s3.putObject(params).promise();
//       resolve({ status: true, message: "File uploaded to MinIO successfully." });

//     } catch (err) {
//       console.error("Upload error:", err);
//       resolve({ status: false, message: "Failed to upload file!" });
//     }
//   });
// };

// const getObject = (key) => {
//   return new Promise(async (resolve, reject) => {
//     const params = {
//       Bucket: process.env.MINIO_BUCKET_NAME,
//       Key: key,
//     };

//     s3.getObject(params, (err, data) => {
//       if (err) {
//         console.error("GetObject error:", err);
//         resolve("File Not Found!");
//       } else {
//         resolve(data.Body);
//       }
//     });
//   });
// };

// module.exports = { uploadImageToS3, getObject };
const Minio = require("minio");
require("dotenv").config();

// Initialize MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Function to Upload Image to MinIO
const uploadImageToS3 = async (fileData, bucketName, objectName) => {
  try {
    await minioClient.putObject(
      bucketName,
      objectName,
      fileData.buffer,
      fileData.size,
      {
        "Content-Type": fileData.mimetype,
      }
    );
    console.log("✅ File uploaded to MinIO successfully.");
    return { status: true, message: "File uploaded successfully." };
  } catch (err) {
    console.error("❌ MinIO Upload Error:", err);
    return { status: false, message: "Failed to upload file!" };
  }
};

// Function to Retrieve Object from MinIO
const getObject = async (bucketName, key) => {
  try {
    const stream = await minioClient.getObject(bucketName, key);
    //  No need to handle the stream here.  Return it to the controller.
    return stream;
  } catch (err) {
    console.error("❌ GetObject error:", err);
    return null; // Important: Return null for the controller to handle 404
  }
};

// Function to Generate Presigned URL
const getFileUrl = async (bucketName, objectName) => {
  try {
    const url = await minioClient.presignedUrl("GET", bucketName, objectName, 24 * 60 * 60);
    return url;
  } catch (error) {
    console.error("❌ URL Generation Error:", error);
    return null;
  }
};

module.exports = { uploadImageToS3, getObject, getFileUrl };
