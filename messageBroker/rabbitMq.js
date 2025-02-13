const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
const QUEUE_NAME = 'publicusers_queue';

async function connectRabbitMq(retries = 5, delay = 5000) {
    while (retries > 0) {
        try {
            console.log(`🔄 Attempting to connect to RabbitMQ...`);
            const connection = await amqp.connect(RABBITMQ_URL);
            const channel = await connection.createChannel();
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            console.log("✅ Connected to RabbitMQ");
            return { connection, channel };
        } catch (error) {
            console.error(`❌ RabbitMQ connection failed. Retries left: ${retries - 1}`);
            retries--;
            if (retries === 0) throw error;
            await new Promise((res) => setTimeout(res, delay));
        }
    }
}

async function publishMessage(message) {
    const { channel } = await connectRabbitMq();
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`🟢 Published message: ${JSON.stringify(message)}`);
}

module.exports = { publishMessage };
