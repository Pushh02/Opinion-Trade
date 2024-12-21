import "dotenv/config";
import { createClient } from "redis";
import { Engine } from "./engine";

async function main() {
  const client = createClient({
    socket: {
      host: "localhost",
      port: 6380,
    },
  });
  client.on("error", (err) => console.log("Redis Client Error", err));

  try {
    await client.connect();
    console.log("Engine started");

    while (true) {
      try {
        const result = await client.rPop("request");
        if (result) {
          const payload = JSON.parse(result);
          console.log(payload);
          await Engine.getInstance().processReq(payload)
        }
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log("fatal error", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
