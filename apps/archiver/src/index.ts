import { PrismaClient } from "@prisma/client";
import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { responsePayloadType } from "./types";

const main = async () => {
  const prisma = new PrismaClient();
  const kafka = new Kafka({
    clientId: "archiver",
    brokers: ["localhost:9092"],
  });
  const consumer: Consumer = kafka.consumer({ groupId: "archiver-group" });

  await consumer.connect();
  await consumer.subscribe({
    topic: "response",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      if (!message.key || !message.value) return;

      const { type, payload } = JSON.parse(message.value.toString());
      switch (type) {
        case responsePayloadType.signup_response:
          console.log("signup response", payload);
          const { user } = payload;
          if (user) {
            const existingUser = await prisma.user.findUnique({
              where: {
                id: user.id,
              },
            });
            if (existingUser) {
              console.log("user already exists", user.id);
              return;
            }
            await prisma.$transaction(async () => {
              const inrBalance = await prisma.inrBalance.create({
                data: {
                  available: user.balance.INR.available,
                  locked: user.balance.INR.locked,
                },
              });
              await prisma.user.create({
                data: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  password: user.password,
                  role: user.role,
                  userInrBalance: {
                    connect: {
                      id: inrBalance.id,
                    },
                  },
                },
              });
            });
          }
          break;
      }
    },
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
