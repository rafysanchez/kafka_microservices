import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { Kafka, Partitioners } from "kafkajs";

// --- KAFKA CONFIGURATION ---
// Kafka is a distributed streaming platform. 
// Concepts:
// - Topic: A category or feed name to which records are published.
// - Producer: An application that publishes messages to a Kafka topic.
// - Consumer: An application that subscribes to topics and processes the feed of published messages.
// - Partition: Topics are divided into partitions for scalability.
// - Offset: A unique identifier for a message within a partition.

const kafka = new Kafka({
  clientId: 'ecommerce-lab',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10 // Robust retry logic for slow broker startup
  }
});

const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
const catalogConsumer = kafka.consumer({ groupId: 'catalog-group' });
const notificationConsumer = kafka.consumer({ groupId: 'notification-group' });

// In-memory state for the lab dashboard
const serviceLogs: any[] = [];
const serviceStatus = {
  order: "disconnected",
  catalog: "disconnected",
  notification: "disconnected"
};

async function initKafka() {
  try {
    console.log("Connecting to Kafka...");
    await producer.connect();
    serviceStatus.order = "connected";
    console.log("Producer connected.");

    await catalogConsumer.connect();
    await catalogConsumer.subscribe({ topic: 'order-events', fromBeginning: true });
    serviceStatus.catalog = "connected";
    console.log("Catalog Consumer connected.");

    await notificationConsumer.connect();
    await notificationConsumer.subscribe({ topic: 'order-events', fromBeginning: true });
    serviceStatus.notification = "connected";
    console.log("Notification Consumer connected.");

    // Start consumers
    await catalogConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = JSON.parse(message.value?.toString() || "{}");
        const log = {
          service: "Catalog",
          event: "Stock Update",
          orderId: payload.id,
          offset: message.offset,
          partition,
          timestamp: new Date().toISOString()
        };
        serviceLogs.push(log);
        console.log(`[Catalog] Processed Order ${payload.id} at Offset ${message.offset}`);
      },
    });

    await notificationConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = JSON.parse(message.value?.toString() || "{}");
        const log = {
          service: "Notification",
          event: "Email Sent",
          orderId: payload.id,
          offset: message.offset,
          partition,
          timestamp: new Date().toISOString()
        };
        serviceLogs.push(log);
        console.log(`[Notification] Processed Order ${payload.id} at Offset ${message.offset}`);
      },
    });

  } catch (error) {
    console.error("Kafka Connection Error:", error);
    // In a real lab, we might want to retry or show "disconnected" in UI
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/status", (req, res) => {
    res.json({ status: serviceStatus, logs: serviceLogs.slice(-20) });
  });

  app.post("/api/orders", async (req, res) => {
    const { customer, items, total } = req.body;
    const order = {
      id: Math.random().toString(36).substr(2, 9),
      customer,
      items,
      total,
      timestamp: new Date().toISOString()
    };

    try {
      await producer.send({
        topic: 'order-events',
        messages: [{ value: JSON.stringify(order) }],
      });
      res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
      console.error("Failed to send message to Kafka:", error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    initKafka();
  });
}

startServer();
