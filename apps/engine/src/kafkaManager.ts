import { Kafka, Message, Producer } from "kafkajs";

interface KafkaMessage {
  topic: string;
  messages: Message[];
}

export class KafkaManager {
  private static instance: KafkaManager;
  private producer: Producer;
  private isInitialized: boolean = false;

  private constructor() {
    const kafks = new Kafka({
      clientId: "app",
      brokers: ["localhost:9092"],
    });
    this.producer = kafks.producer();
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;

    try {
      this.producer.connect();
      this.isInitialized = true;
    } catch (error) {
      console.log(error);
    }
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new KafkaManager();
    }
    return this.instance;
  }

  public async sendToKafka(message: KafkaMessage) {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }
      console.log("Sending message to Kafka", message);
      await this.producer.send({
        topic: message.topic,
        messages: message.messages.map((m) => ({
          key: m.key,
          value:
            typeof m.value === "string" ? m.value : JSON.stringify(m.value),
        })),
      });
    } catch (error) {
      console.log("Failed to send message to Kafka", error);
      throw error;
    }
  }
}
