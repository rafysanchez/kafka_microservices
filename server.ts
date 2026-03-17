import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { producer, connectKafka, disconnectKafka, isReady as isOrderReady } from "./src/order-service/config/kafka.ts";
import { connectCatalog, disconnectCatalog, isReady as isCatalogReady } from "./src/catalog-service/config/kafka.ts";
import { connectNotification, disconnectNotification, isReady as isNotificationReady } from "./src/notification-service/config/kafka.ts";

const serviceLogs: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- HEALTH & READINESS PROBES ---
  app.get("/health/ready", (req, res) => {
    const services = {
      order: isOrderReady,
      catalog: isCatalogReady,
      notification: isNotificationReady
    };
    const allReady = Object.values(services).every(v => v);
    
    if (allReady) {
      return res.status(200).json({ status: "ready", services });
    }
    res.status(503).json({ status: "not ready", services });
  });

  app.get("/api/status", (req, res) => {
    res.json({ 
      status: {
        order: isOrderReady ? "connected" : "disconnected",
        catalog: isCatalogReady ? "connected" : "disconnected",
        notification: isNotificationReady ? "connected" : "disconnected"
      }, 
      logs: serviceLogs.slice(-20) 
    });
  });

  app.post("/api/orders", async (req, res) => {
    if (!isOrderReady) return res.status(503).json({ error: "Order Service not ready" });
    
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
      res.status(500).json({ error: "Failed to place order" });
    }
  });

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

  const server = app.listen(PORT, "0.0.0.0", async () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    
    // Initialize All Services with Advanced Retry
    try {
      await connectKafka();
      
      await connectCatalog((payload, offset, partition) => {
        serviceLogs.push({
          service: "Catalog",
          event: "Stock Update",
          orderId: payload.id,
          offset,
          partition,
          timestamp: new Date().toISOString()
        });
      });

      await connectNotification((payload, offset, partition) => {
        serviceLogs.push({
          service: "Notification",
          event: "Email Sent",
          orderId: payload.id,
          offset,
          partition,
          timestamp: new Date().toISOString()
        });
      });

    } catch (err) {
      console.error("[Critical] Service initialization failed.");
    }
  });

  // --- GRACEFUL SHUTDOWN ---
  const shutdown = async (signal: string) => {
    console.log(`\n[Shutdown] Received ${signal}. Closing resources...`);
    server.close();
    await disconnectKafka();
    await disconnectCatalog();
    await disconnectNotification();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
