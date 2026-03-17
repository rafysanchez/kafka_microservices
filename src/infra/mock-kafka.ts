import { EventEmitter } from 'events';

// Simulador de Broker Kafka em Memória
class MockKafkaBroker extends EventEmitter {
  private offsets: Record<string, number> = { 'order-events': 0 };
  private partitions = [0, 1, 2];

  async produce(topic: string, message: any) {
    // Simula latência de rede
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const offset = this.offsets[topic]++;
    const partition = this.partitions[offset % this.partitions.length];
    
    const payload = {
      topic,
      partition,
      offset: offset.toString(),
      value: message
    };

    console.log(`[MockBroker] Published to ${topic} [P:${partition}] @O:${offset}`);
    this.emit('message', payload);
    return [{ topicName: topic, partition, baseOffset: offset.toString() }];
  }
}

export const mockBroker = new MockKafkaBroker();

export class MockProducer {
  async connect() { return true; }
  async disconnect() { return true; }
  async send({ topic, messages }: any) {
    for (const msg of messages) {
      await mockBroker.produce(topic, msg.value);
    }
  }
}

export class MockConsumer {
  private handler: any;

  async connect() { return true; }
  async disconnect() { return true; }
  async subscribe() { return true; }
  async run({ eachMessage }: any) {
    this.handler = eachMessage;
    mockBroker.on('message', async (payload) => {
      // Simula processamento assíncrono
      setTimeout(() => {
        this.handler({
          topic: payload.topic,
          partition: payload.partition,
          message: {
            value: Buffer.from(payload.value),
            offset: payload.offset
          }
        });
      }, 500);
    });
  }
}
