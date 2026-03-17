import { Kafka, Consumer } from "kafkajs";

const KAFKA_BROKERS = [process.env.KAFKA_BROKER || 'localhost:9092'];
export let isReady = false;

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: KAFKA_BROKERS,
  retry: {
    initialRetryTime: 1000,
    retries: 10,
    factor: 2
  }
});

export const consumer: Consumer = kafka.consumer({ groupId: 'notification-group' });

export async function connectNotification(onMessage: (payload: any, offset: string, partition: number) => void) {
  console.log("[Notification] Initializing connection...");
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order-events', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = JSON.parse(message.value?.toString() || "{}");
        onMessage(payload, message.offset, partition);
      },
    });
    
    isReady = true;
    console.log("[Notification] Connected and consuming.");
  } catch (error: any) {
    isReady = false;
    console.error(`[Notification] Connection Failed: ${error.message}`);
    throw error;
  }
}

export async function disconnectNotification() {
  await consumer.disconnect();
}
