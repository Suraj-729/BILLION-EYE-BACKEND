
const  { MongoClient }= require('mongodb');

async function connectToDb() {
    const uri = process.env.DB_CONNECT;
    try {
        const client = new MongoClient(uri); 
        await client.connect(); 
        console.log('Connected to MongoDB');
        return client; 
      } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        throw err; 
      }
}

module.exports = connectToDb;