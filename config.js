module.exports = {
  SERVER_HOST: process.env.SERVER_HOST || "localhost",
  SERVER_PORT: process.env.SERVER_PORT || 3010,
  MONGO_HOST: process.env.MONGO_HOST || "localhost",
  MONGO_PORT: process.env.MONGO_PORT || 27017,
  dbName: "BillionEyes_V1",
  uri: `mongodb://${process.env.MONGO_HOST || "localhost"}:${process.env.MONGO_PORT || 27017}/`,
};
