import { Kafka, Consumer } from "kafkajs";
import { MockConsumer } from "../../infra/mock-kafka";

const KAFKA_BROKERS = [process.env.KAFKA_BROKER || 'localhost:9092'];
export let isReady = false;

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: KAFKA_BROKERS,
  retry: { retries: 2 }
});

export let consumer: any = kafka.consumer({ groupId: 'notification-group' });

export async function connectNotification(onMessage: (payload: any, offset: string, partition: number) => void) {
  try {
    await (consumer as Consumer).connect();
    await consumer.subscribe({ topic: 'order-events', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = JSON.parse(message.value?.toString() || "{}");
        onMessage(payload, message.offset, partition);
      },
    });
    isReady = true;
  } catch (error) {
    console.warn("[Notification] Switching to Mock Consumer...");
    consumer = new MockConsumer();
    await consumer.run({
      eachMessage: async ({ topic, partition, message }: any) => {
        const payload = JSON.parse(message.value?.toString() || "{}");
        onMessage(payload, message.offset, partition);
      },
    });
    isReady = true;
  }
}

export async function disconnectNotification() {
  await consumer.disconnect();
}
