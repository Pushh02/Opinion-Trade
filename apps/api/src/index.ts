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

app.get("/markets", async (req, res) => {
  try{
    const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
    type: 'get_all_markets',
    })
    res.json(responseFromEngine)
  } catch (err) {
    res.status(500).send(err);
  }
})

app.get("/market/:symbol", async (req, res) => {
  try{
    const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
      type: "get_market",
      payload: {
        marketSymbol: req.params.symbol,
      },
    });
    res.json(responseFromEngine);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/create/category", async (req, res) => {
  const { title, description, icon } = req.body;
  try {
    const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
      type: "create_category",
      payload: {
        token: req.headers.authorization || "",
        title: title as string,
        description: description as string,
        icon: icon as string,
      },
    });
    res.json(responseFromEngine);
  } catch (err) {
    res.status(500).send(err);
  }
})

app.post(
  "/create-market",
  checkToken,
  async (req: AuthenticatedRequest, res) => {
    const { symbol, description, endTime, sourceOfTruth } = req.body;
    try {
      const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
        type: "createMarket",
        payload: {
          token: req.headers.authorization || "",
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
  }
);

app.post("/sell", async (req, res) => {
  const { symbol, quantity, price, stockType } = req.body;
  try {
    const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
      type: "sell",
      payload: {
        token: req.headers.authorization || "",
        symbol,
        quantity,
        price,
        stockType: stockType as "YES" | "NO",
      },
    });
    res.json(responseFromEngine);
  } catch (err) {
    res.send(err);
  }
});

app.post("/delete", async (req, res) => {
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
