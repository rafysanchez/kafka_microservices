import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Package, 
  Mail, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Layers,
  Zap
} from 'lucide-react';

interface ServiceLog {
  service: string;
  event: string;
  orderId: string;
  offset: string;
  partition: number;
  timestamp: string;
}

interface ServiceStatus {
  order: string;
  catalog: string;
  notification: string;
}

export default function App() {
  const [status, setStatus] = useState<ServiceStatus>({ order: 'offline', catalog: 'offline', notification: 'offline' });
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setStatus(data.status);
        setLogs(data.logs);
      } catch (err) {
        console.error("Failed to fetch status", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const placeOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: "Lab User",
          items: ["Kafka Course", "Microservices Book"],
          total: 99.99
        })
      });
      if (res.ok) {
        setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Order failed", err);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ state }: { state: string }) => (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      state === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
    }`}>
      {state}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black fill-current" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Kafka Microservices Lab</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status.order === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              Broker: {status.order === 'connected' ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Architecture Diagram */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-medium">System Architecture</h2>
          </div>
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Order Service */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-blue-400" />
                </div>
                <StatusBadge state={status.order} />
              </div>
              <h3 className="font-semibold mb-1">Order Service</h3>
              <p className="text-xs text-zinc-500 mb-4">Producer: Publishes events to Kafka</p>
              <button 
                onClick={placeOrder}
                disabled={loading}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? "Processing..." : "Place New Order"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Kafka Broker (Center) */}
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 flex items-center justify-center relative">
                <Database className="w-10 h-10 text-emerald-500" />
                {/* Animated Flow Lines */}
                <AnimatePresence>
                  {orderSuccess && (
                    <>
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                        className="absolute inset-0 bg-emerald-500 rounded-full"
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="text-center">
                <p className="text-xs font-mono text-emerald-500 font-bold">TOPIC: order-events</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 italic">Kafka Broker</p>
              </div>
            </div>

            {/* Consumers Column */}
            <div className="space-y-6">
              {/* Catalog Service */}
              <motion.div 
                whileHover={{ x: 4 }}
                className="p-5 rounded-xl bg-zinc-900 border border-white/5 flex items-center gap-4"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold">Catalog Service</h4>
                    <StatusBadge state={status.catalog} />
                  </div>
                  <p className="text-[10px] text-zinc-500">Consumer: Inventory Updates</p>
                </div>
              </motion.div>

              {/* Notification Service */}
              <motion.div 
                whileHover={{ x: 4 }}
                className="p-5 rounded-xl bg-zinc-900 border border-white/5 flex items-center gap-4"
              >
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold">Notification Service</h4>
                    <StatusBadge state={status.notification} />
                  </div>
                  <p className="text-[10px] text-zinc-500">Consumer: Email Alerts</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Real-time Logs */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-medium">Kafka Event Stream</h2>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
              Showing last 20 events
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 p-4 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <div>Service</div>
              <div>Event</div>
              <div>Order ID</div>
              <div>Offset</div>
              <div className="text-right">Time</div>
            </div>
            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
              {logs.length === 0 ? (
                <div className="py-20 text-center text-zinc-600">
                  <p className="text-sm italic">Waiting for events to be published...</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {logs.slice().reverse().map((log, i) => (
                    <motion.div 
                      key={`${log.orderId}-${log.service}-${log.offset}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="grid grid-cols-5 gap-4 p-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${log.service === 'Catalog' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                        <span className="text-xs font-semibold">{log.service}</span>
                      </div>
                      <div className="text-xs text-zinc-400">{log.event}</div>
                      <div className="text-xs font-mono text-emerald-500">{log.orderId}</div>
                      <div className="text-xs font-mono text-zinc-500">
                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded">P:{log.partition}</span>
                        <span className="ml-2">O:{log.offset}</span>
                      </div>
                      <div className="text-[10px] text-zinc-600 text-right">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </section>

        {/* Kafka Concepts Footer */}
        <footer className="mt-20 pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Topics & Partitions
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Topics are categories for messages. Partitions allow Kafka to scale by splitting a topic across multiple brokers.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Producers & Consumers
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Producers push data to topics. Consumers subscribe to topics and process data at their own pace.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Offsets
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              An offset is a unique ID for each message in a partition. It allows consumers to track their progress.
            </p>
          </div>
        </footer>
      </main>

      {/* Success Toast */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 className="w-5 h-5" />
            Order Published to Kafka!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
