
const { MongoClient } = require('mongodb');

const uri = process.env.DB_CONNECT;
const client = new MongoClient(uri);

async function getImageCollection() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    const db = client.db('billoneyedata');
    return db.collection('images');
}

async function saveImageData(imageData) {
    const collection = await getImageCollection();
    console.log('[saveImageData] Accessed image collection.');
    
    const newImage = {
        latitude: imageData.latitude,
        longitude: imageData.longitude,
        timestamp: new Date(imageData.timestamp),
        imageUrl: imageData.imageUrl,
    };
    console.log('[saveImageData] Image data:', newImage);
    
    
    const result = await collection.insertOne(newImage);
    console.log('[saveImageData] Image data inserted:', { imageId: result.insertedId, imageUrl: imageData.imageUrl });
    
    return result.insertedId;
}

module.exports = {
    saveImageData,
};
