import { KafkaManager } from "./kafkaManager";
import { responsePayloadType, User } from "./types/dbTypes";
import bcrypt from "bcrypt";

export class Engine {
  private static instance: Engine;
  private userMap: Map<string, User>;

  private constructor() {
    this.userMap = new Map();
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
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  private async loginReq(request: any) {
    const { corelationId } = request;
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

      const responsePayload = {
        type: responsePayloadType.signup_response,
        payload: {
          success: true,
          user: newUser,
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
}
