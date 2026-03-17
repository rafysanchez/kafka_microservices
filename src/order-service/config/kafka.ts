import { Kafka, Partitioners, Producer } from "kafkajs";

/**
 * ADVANCED KAFKA CONFIGURATION
 * Pattern: Exponential Backoff with Telemetry & Graceful Shutdown
 */

const KAFKA_BROKERS = [process.env.KAFKA_BROKER || 'localhost:9092'];
const MAX_RETRIES = 10;

// Readiness state for Kubernetes/Health probes
export let isReady = false;

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: KAFKA_BROKERS,
  retry: {
    initialRetryTime: 1000, // 1s
    retries: MAX_RETRIES,
    factor: 2, // Exponential factor (1s, 2s, 4s, 8s...)
    multiplier: 1.5,
    maxRetryTime: 30000, // Max 30s
    restartOnFailure: async (error) => {
      console.error(`[Telemetry] Critical Kafka Failure: ${error.message}`);
      return true;
    }
  }
});

export const producer: Producer = kafka.producer({ 
  createPartitioner: Partitioners.LegacyPartitioner 
});

/**
 * Connects to Kafka with structured telemetry logs
 */
export async function connectKafka() {
  console.log("[Telemetry] Initializing Kafka connection sequence...");
  
  try {
    await producer.connect();
    isReady = true;
    console.log("[Telemetry] Kafka Producer connected successfully. Service is READY.");
  } catch (error: any) {
    isReady = false;
    console.error(`[Telemetry] Kafka Connection Failed: ${error.message}`);
    throw error;
  }
}

/**
 * Graceful Shutdown Handler
 */
export async function disconnectKafka() {
  console.log("[Telemetry] Starting graceful shutdown of Kafka producer...");
  isReady = false;
  try {
    await producer.disconnect();
    console.log("[Telemetry] Kafka producer disconnected cleanly.");
  } catch (error: any) {
    console.error(`[Telemetry] Error during Kafka disconnect: ${error.message}`);
  }
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
