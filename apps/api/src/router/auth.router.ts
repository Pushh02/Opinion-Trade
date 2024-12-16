import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

const authController = new AuthController();

router.post("/signup", async(req, res) => {
    authController.signup(req, res)
});

router.post("/login", async(req, res) => {
    authController.login(req, res)
});

export { router as authRouter };