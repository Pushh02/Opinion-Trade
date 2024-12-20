import express from "express";
import "dotenv/config";
import { authRouter } from "./router/auth.router";
import { AsyncManager } from "./AsyncManager";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);

app.post("/symbol/create/:symbol", (req, res) => {
    
});

app.post("/delete", async(req, res) => {
  try {
    const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
      type: "empty",
      payload: {},
    });
    res.json(responseFromEngine);
  } catch (err) {
    res.send(err);
  }
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
