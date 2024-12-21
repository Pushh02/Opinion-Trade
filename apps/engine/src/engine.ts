import { KafkaManager } from "./kafkaManager";
import { responsePayloadType, User } from "./types/dbTypes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";

export class Engine {
  private static instance: Engine;
  private userMap: Map<string, User>;
  private marketMap: Map<string, any>;

  private constructor() {
    this.userMap = new Map();
    this.marketMap = new Map();
  }

  private findUsername(userName: string): User | null {
    for (const user of this.userMap.values()) {
      if (user.username === userName) {
        return user;
      }
    }
    return null;
  }

  private findUserEmail(email: string): User | null {
    for (const user of this.userMap.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  public static getInstance(): Engine {
    if (!Engine.instance) {
      Engine.instance = new Engine();
    }
    return Engine.instance;
  }

  public async processReq(request: any) {
    try {
      switch (request.type) {
        case "login":
          await this.loginReq(request);
          break;
        case "logout":
          // function call
          break;
        case "signup":
          await this.signupReq(request);
          break;
        case "empty":
          await this.emptyReq(request);
          break;
        case "createMarket":
          await this.createMarketReq(request);
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  private async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
      if(!decoded.userId) {
        throw new Error("Invalid token");
      }
      const user = this.userMap.get(decoded.userId);
      if(!user) {
        throw new Error("Invalid token");
      }
      return user;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  private async signupReq(request: any) {
    const { corelationId } = request;
    const { username, email, password, role } = request.payload;

    try {
      if (this.findUserEmail(email)) {
        throw new Error("Email already exists");
      }

      if (this.findUsername(username)) {
        throw new Error("Username already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser: User = {
        id:
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15),
        username: username,
        email: request.payload.email,
        password: hashedPassword,
        role,
        balance: {
          INR: {
            available: 0,
            locked: 0,
          },
        },
      };
      this.userMap.set(newUser.id, newUser);

      //generate token
      const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET!, {
        expiresIn: "2h",
      });

      const responsePayload = {
        type: responsePayloadType.signup_response,
        payload: {
          success: true,
          user: newUser,
          token,
          message: "User created successfully",
        },
      };

      await KafkaManager.getInstance().sendToKafka({
        topic: "response",
        messages: [
          {
            key: corelationId,
            value: JSON.stringify(responsePayload),
          },
        ],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : error;
      const responsePayload = {
        type: responsePayloadType.signup_response,
        payload: {
          success: false,
          message: errorMessage,
        },
      };

      await KafkaManager.getInstance().sendToKafka({
        topic: "response",
        messages: [
          {
            key: corelationId,
            value: JSON.stringify(responsePayload),
          },
        ],
      });
    }
  }

  private async loginReq(request: any) {
    const { corelationId } = request;
    const { username, password } = request.payload;
    console.log(this.userMap);

    try {
      const dbUser = this.findUsername(username);
      if (!dbUser) {
        throw new Error("User not found");
      }

      const passwordMatch = await bcrypt.compare(password, dbUser.password);
      if (!passwordMatch) {
        throw new Error("Invalid password");
      }

      const token = jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET!, {
        expiresIn: "2h",
      });

      const reponsePayload = {
        type: responsePayloadType.login_response,
        payload: {
          success: true,
          message: "User logged in successfully",
          token,
          user: dbUser,
        },
      };

      await KafkaManager.getInstance().sendToKafka({
        topic: "response",
        messages: [
          {
            key: corelationId,
            value: JSON.stringify(reponsePayload),
          },
        ],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : error;
      const reponsePayload = {
        type: responsePayloadType.login_response,
        payload: {
          success: false,
          message: errorMessage,
        },
      };

      await KafkaManager.getInstance().sendToKafka({
        topic: "response",
        messages: [
          {
            key: corelationId,
            value: JSON.stringify(reponsePayload),
          },
        ],
      });
    }
  }

  private async emptyReq(request: any) {
    const { corelationId } = request;
    this.userMap.clear();
    try {
      await KafkaManager.getInstance().sendToKafka({
        topic: "response",
        messages: [
          {
            key: corelationId,
            value: JSON.stringify(this.userMap),
          },
        ],
      });
    } catch (error) {
      console.log(error);
    }
  }

  private async createMarketReq(request: any) {
    const { corelationId } = request;
    try {
      console.log(request);
      const user = await this.verifyToken(request.payload.token);

      if(!user) {
        throw new Error("User not found in database");
      }

      if(user.role !== "ADMIN") {
        throw new Error("Only admin can create market");
      }

      const marketId = uuidv4()
      const market = {
        id: marketId,
        symbol: request.payload.symbol,
        description: request.payload.description,
        endTime: request.payload.endTime,
        sourceOfTruth: request.payload.sourceOfTruth,
        status: request.payload.status,
        createdBy: user.id,
        lastYesPrice: 5,
        lastNoPrice: 5,
        totalVolume: 0,
      };
      this.marketMap.set(marketId, market);

      const responsePayload = {
        type: responsePayloadType.createMarket_response,
        payload: {
          success: true,
          message: "Market created successfully",
          market,
        },
      };

      await KafkaManager.getInstance().sendToKafka({
        topic: "response",
        messages: [
          {
            key: corelationId,
            value: JSON.stringify(responsePayload),
          },
        ],
      });
    } catch (error) {
      console.log(error);
    }
  }

}
