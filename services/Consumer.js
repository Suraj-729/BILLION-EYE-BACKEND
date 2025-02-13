const amqp = require("amqplib");
const { uploadImageToS3, getFileUrl } = require("../services/minio.service");
const Camera = require("../models/camera.model");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq";
const QUEUE_NAME = "publicusers_queue";

function checkRabbitMQConnection(url, callback) {
  amqp.connect(url, function(error, connection) {
    if (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
      setTimeout(() => checkRabbitMQConnection(url, callback), 5000); // Retry after 5 seconds
    } else {
      console.log('Successfully connected to RabbitMQ');
      connection.close();
      callback();
    }
  });
}

async function processMessages() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(" [*] Waiting for messages in", QUEUE_NAME);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const message = JSON.parse(msg.content.toString());

          if (message.type === "image_upload") {
            const {
              file,
              userId,
              latitude,
              longitude,
              timestamp,
              bucketName,
              objectName,
            } = message.data;

            console.log("Processing Image Upload:", file.originalname);

            const fileBuffer = Buffer.from(file.buffer, "base64");

            await uploadImageToS3(
              { buffer: fileBuffer, mimetype: file.mimetype },
              bucketName,
              objectName
            );

            const imageUrl = await getFileUrl(bucketName, objectName);

            const { imageId, incidentId } = await Camera.saveImageData({
              userId,
              latitude,
              longitude,
              timestamp,
              imageUrl,
            });

            console.log("✅ Image successfully uploaded:", imageUrl);
          }

          channel.ack(msg);
        } catch (error) {
          console.error("❌ Error processing message:", error);
        }
      }
    });
  } catch (error) {
    console.error("❌ Consumer error:", error);
  }
}

checkRabbitMQConnection(RABBITMQ_URL, () => {
  processMessages().catch(console.error);
});
