import express from "express";
import "dotenv/config";
import { authRouter } from "./router/auth.router";
import { AsyncManager } from "./AsyncManager";
import { AuthenticatedRequest, checkToken } from "./middleware/checkToken";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);

app.post("/create-market", checkToken, async(req: AuthenticatedRequest, res) => {
    const { symbol, description, endTime, sourceOfTruth } = req.body;
    try {
        const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
            type: "createMarket",
            payload: {
                token: req.token,
                symbol,
                description,
                endTime,
                sourceOfTruth,
                status: "ACTIVE",
            },
        });
        res.json(responseFromEngine);
    } catch (err) {
        res.status(500).send(err);
    }
})



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
