import express from "express";
import "dotenv/config";
import { authRouter } from "./router/auth.router";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});