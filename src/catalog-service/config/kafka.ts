import { Kafka, Consumer } from "kafkajs";

const KAFKA_BROKERS = [process.env.KAFKA_BROKER || 'localhost:9092'];
export let isReady = false;

const kafka = new Kafka({
  clientId: 'catalog-service',
  brokers: KAFKA_BROKERS,
  retry: {
    initialRetryTime: 1000,
    retries: 10,
    factor: 2
  }
});

export const consumer: Consumer = kafka.consumer({ groupId: 'catalog-group' });

export async function connectCatalog(onMessage: (payload: any, offset: string, partition: number) => void) {
  console.log("[Catalog] Initializing connection...");
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
    console.log("[Catalog] Connected and consuming.");
  } catch (error: any) {
    isReady = false;
    console.error(`[Catalog] Connection Failed: ${error.message}`);
    throw error;
  }
}

export async function disconnectCatalog() {
  await consumer.disconnect();
}
