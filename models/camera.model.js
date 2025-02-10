const { MongoClient, ObjectId } = require("mongodb");
const Minio = require("minio");

const uri = process.env.DB_CONNECT;
const client = new MongoClient(uri);

const minioClient = new Minio.Client({
  endPoint: "localhost",
  port: 9000,
  useSSL: true,
  accessKey: "admin123",
  secretKey: "admin",
});


async function getImageCollection() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  const db = client.db("billoneyedata");
  return db.collection("images");
}

async function saveImageData(imageData) {
  const collection = await getImageCollection();
  console.log("[saveImageData] Accessed image collection.");

  // ✅ Generate Unique Incident ID

  const incidentId = new ObjectId().toString(); // Generate a unique incidentId

  const newImage = {
    incidentID: incidentId,
    latitude: imageData.latitude,
    longitude: imageData.longitude,
    timestamp: new Date(imageData.timestamp),
    imageUrl: imageData.imageUrl,
  };
  console.log("[saveImageData] Image data:", newImage);

  const result = await collection.insertOne(newImage);
  console.log("[saveImageData] Image data inserted:", {
    imageId: result.insertedId,
    imageUrl: imageData.imageUrl,
    incidentID: incidentId,
  });

  return result.insertedId;
}

module.exports = {
  saveImageData,
};
