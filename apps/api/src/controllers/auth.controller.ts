import { BaseController } from "./base.controller";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import db from "@repo/db";

export class AuthController extends BaseController {
  //for signup
  async signup(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const { name, email, password } = req.body;

      try {
        if (email && password) {
          const checkExistingProfile = await db.user.findFirst({
            where: {
              email,
            },
          });
          if (checkExistingProfile) {
            const token = jwt.sign(
              { profileId: checkExistingProfile.id },
              process.env.JWT_SECRET || "nope"
            );
            res.status(400).json({ access_token: token });
          }
          const hashedPassword = await bcrypt.hash(password, 12);
          const user = await db.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
            },
          });
          // Generate access token
          const accessToken = jwt.sign(
            {
              profileId: user.id,
              exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
            },
            process.env.JWT_SECRET || "nope"
          );

          // Generate refresh token
          const refreshToken = jwt.sign(
            {
              profileId: user.id,
            },
            process.env.REFRESH_TOKEN_SECRET || "refresh-nope",
            { expiresIn: "7d" }
          );

          // Set secure cookie
          res.cookie("Authorization", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
          });

          return res.status(200).json({
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          });
        } else {
          res.status(409).send("fields are empty");
        }
      } catch (err) {
        res.send(err);
      }
    });
  }

  //for login
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const user = await db.user.findFirst({
        where: {
          email,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Generate access token
      const accessToken = jwt.sign(
        {
          profileId: user.id,
          exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
        },
        process.env.JWT_SECRET || "nope"
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        {
          profileId: user.id,
        },
        process.env.REFRESH_TOKEN_SECRET || "refresh-nope",
        { expiresIn: "7d" }
      );

      // Set secure cookie
      res.cookie("Authorization", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      return res.status(200).json({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error("Sign-in error:", error);
      return res.status(500).json({
        message: "An error occurred during sign-in",
        error: error,
      });
    }
  }
}
