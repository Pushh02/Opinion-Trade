import { BaseController } from "./base.controller";
import { Request, Response } from "express";
import { AsyncManager } from "../AsyncManager";

export class AuthController extends BaseController {
  //for signup
  async signup(req: Request, res: Response) {
    const { username, email, password, role } = req.body;

    try {
      const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
        type: "signup",
        payload: {
          username,
          email,
          password,
          role,
        },
      });
      res.json(responseFromEngine);
    } catch (err) {
      res.send(err);
    }
  }

  //for login
  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    
    try {
      const responseFromEngine = await AsyncManager.getInstance().sendAndAwait({
        type: "login",
        payload: {
          username,
          password,
        },
      });
      res.json(responseFromEngine);
    } catch (err) {
      res.send(err);
    }
  }
}
