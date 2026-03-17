import { Kafka, Partitioners, Producer } from "kafkajs";
import { MockProducer } from "../../infra/mock-kafka";

const KAFKA_BROKERS = [process.env.KAFKA_BROKER || 'localhost:9092'];
export let isReady = false;
export let isMock = false;

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: KAFKA_BROKERS,
  retry: {
    initialRetryTime: 300,
    retries: 2
  }
});

export let producer: any = kafka.producer({ 
  createPartitioner: Partitioners.LegacyPartitioner 
});

export async function connectKafka() {
  console.log("[Order] Attempting Kafka connection...");
  try {
    await (producer as Producer).connect();
    isReady = true;
    isMock = false;
    console.log("[Order] Connected to Real Kafka.");
  } catch (error) {
    console.warn("[Order] Real Kafka unavailable. Switching to Mock Mode...");
    producer = new MockProducer();
    isReady = true;
    isMock = true;
  }
}

export async function disconnectKafka() {
  await producer.disconnect();
}

// Telemetry Event Listeners
producer.on(producer.events.CONNECT, () => {
  console.log("[Telemetry] Event: PRODUCER_CONNECTED");
});

producer.on(producer.events.DISCONNECT, () => {
  console.log("[Telemetry] Event: PRODUCER_DISCONNECTED");
  isReady = false;
});

producer.on(producer.events.REQUEST_TIMEOUT, (e) => {
  console.warn(`[Telemetry] Warning: REQUEST_TIMEOUT to broker ${e.payload.broker}`);
});
