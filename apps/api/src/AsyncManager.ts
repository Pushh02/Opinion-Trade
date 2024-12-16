import { Consumer, Kafka } from "kafkajs";
import { createClient, RedisClientType } from "redis";
import { requestPayload } from "./types";

export class AsyncManager {
  private static instance: AsyncManager;
  private queue: RedisClientType;
  private consumer: Consumer;
  private messageHandler: Map<string, (value: any) => void>;
  private isInitialized: boolean = false;

  private constructor() {
    const kafks = new Kafka({
      clientId: "my-app",
      brokers: ["localhost:9092"],
    });
    this.queue = createClient();
    this.consumer = kafks.consumer({ groupId: "my-app-group" });
    this.messageHandler = new Map();
  }

  private async init() {
    if (this.isInitialized) return;

    try {
      await this.queue.connect();
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: "response",
        fromBeginning: false,
      });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.key || !message.value) return;
          const corelationId = message.key.toString();
          const handler = this.messageHandler.get(corelationId);
          if (handler) {
            try {
              const data = JSON.parse(message.value.toString());
              handler(data);
            } catch (error) {
              console.error(error);
              handler({ error: "no valid data format" });
            } finally {
              this.messageHandler.delete(corelationId);
            }
          }
        },
      });
      this.isInitialized = true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public static async getInstance() {
    if (!AsyncManager.instance) {
      AsyncManager.instance = new AsyncManager();
    }
    return AsyncManager.instance;
  }

  public async sendAndAwait(request: requestPayload) {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
        const correlationId = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);

        const timeOutId = setTimeout(() => {
            if(this.messageHandler.has(correlationId)) {
                this.messageHandler.delete(correlationId);
                reject(new Error("Request timed out"));
            }
        }, 12000);

        
    })
  }
}
