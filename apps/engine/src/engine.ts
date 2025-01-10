import { KafkaManager } from "./kafkaManager";
import {
  MarketStatus,
  Order,
  OrderStatus,
  responsePayloadType,
  Side,
  User,
  StockBalance,
  Position,
} from "./types/dbTypes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";

export class Engine {
  private static instance: Engine;
  private userMap: Map<string, User>;
  private marketMap: Map<string, any>;
  private orderBook: Map<string, Order[]>;

  private constructor() {
    this.userMap = new Map();
    this.marketMap = new Map();
    this.orderBook = new Map();
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
        case "get_all_markets":
          await this.handleGetAllMarkets(request);
          break;
        case "get_market":
          await this.handleGetMarket(request);
          break;
        case "updateMarket":
          // function call
          break;
        case "deleteMarket":
          // function call
          break;
        case "getMarket":
          // function call
          break;
        case "getMarketList":
          // function call
          break;
        case "buy":
          // await this.buyReq(request);
          break;
        case "sell":
          await this.sellReq(request);
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
      const jwt_token = token.split(" ")[1];
      const decoded = jwt.verify(
        jwt_token,
        process.env.JWT_SECRET!
      ) as jwt.JwtPayload;
      if (!decoded.userId) {
        throw new Error("Invalid token");
      }
      const user = this.userMap.get(decoded.userId);
      if (!user) {
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
          stocks: {
            TEST: {
              YES: {
                quantity: 4,
                locked: 0,
              },
              NO: {
                quantity: 4,
                locked: 0,
              },
            },
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
      const user = await this.verifyToken(request.payload.token);

      if (!user) {
        throw new Error("User not found in database");
      }

      if (user.role !== "ADMIN") {
        throw new Error("Only admin can create market");
      }

      const marketId = uuidv4();
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
      this.marketMap.set(request.payload.symbol, market);

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

  private async handleGetAllMarkets(request: any) {
    const corelationId = request.corelationId;
    try {
      const responsePayload = {
        type: responsePayloadType.getMarketList_response,
        payload: {
          success: true,
          message: "Markets fetched successfully",
          markets: Array.from(this.marketMap.values()),
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
        type: responsePayloadType.getMarketList_response,
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

  private async handleGetMarket(request: any) {
    const corelationId = request.corelationId;
    try {
      const marketSymbol = request.payload.marketSymbol;

      const market = this.marketMap.get(marketSymbol);
      if (!market) {
        const responsePayload = {
          type: responsePayloadType.getMarket_response,
          payload: {
            success: false,
            message: "Market not found",
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
        return;
      }

      const responsePayload = {
        type: responsePayloadType.getMarket_response,
        payload: {
          success: true,
          message: "Market fetched successfully",
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
      const errorMessage = error instanceof Error ? error.message : error;

      const responsePayload = {
        type: responsePayloadType.getMarket_response,
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

  private async sellReq(request: any) {
    const { corelationId } = request;
    try {
      const {
        symbol,
        quantity,
        price,
        stockType,
        token,
      }: {
        symbol: string;
        quantity: number;
        price: number;
        stockType: Side;
        token: string;
      } = request.payload;
      const user = await this.verifyToken(token);
      if (!user) {
        throw new Error("User not found in database");
      }

      const market = this.marketMap.get(symbol);
      console.log("market", this.marketMap);
      console.log(market);
      if (!market) {
        throw new Error("Market not found in database");
      }

      if (market.status !== MarketStatus.ACTIVE) {
        throw new Error("Market is not active");
      }

      const order: Order = {
        id: uuidv4(),
        side: stockType,
        quantity: request.payload.quantity,
        marketSymbol: market.symbol,
        remainingQuantity: request.payload.quantity,
        price: price,
        status: OrderStatus.PENDING,
        userId: user.id,
        timeStamp: new Date(),
      };
      console.log("order", order);

      if (!user.balance.stocks[symbol][stockType]?.quantity) {
        throw new Error("Insufficient stocks");
      }
      if (user.balance.stocks[symbol][stockType]?.quantity < quantity) {
        throw new Error("Insufficient stocks");
      }

      user.balance.stocks[symbol][stockType].locked += quantity;
      user.balance.stocks[symbol][stockType].quantity -= quantity;
      this.userMap.set(user.id, user);

      const marketOrders = this.orderBook.get(symbol);
      const desiredStockType = stockType === Side.YES ? Side.NO : Side.YES;
      console.log(marketOrders);
      if (marketOrders) {
        const matchingOrders = marketOrders
          .filter(
            (order) =>
              order.side === desiredStockType &&
              order.status !== OrderStatus.FILLED &&
              order.status !== OrderStatus.CANCELLED &&
              order.price <= price &&
              order.id !== order.id
          )
          .sort((a, b) => a.price - b.price);

        if (matchingOrders.length > 0) {
          matchingOrders.forEach((marketOrder) => {
            if (order.remainingQuantity === 0) return;

            if (marketOrder.remainingQuantity > order.remainingQuantity) {
              if (order.remainingQuantity === 0) {
                order.status = OrderStatus.FILLED;
                return;
              }
              //@ts-ignore`
              user.balance.stocks[market.symbol][stockType]?.locked -=
                order.remainingQuantity;
              user.balance.INR.available +=
                order.remainingQuantity * order.price;

              marketOrder.remainingQuantity -= order.remainingQuantity;
              order.remainingQuantity = 0;
              order.status = OrderStatus.FILLED;

              marketOrder.status = OrderStatus.PARTIALLY_FILLED;
            } else {
              if (order.remainingQuantity === 0) {
                order.status = OrderStatus.FILLED;
                return;
              }
              //@ts-ignore
              user.balance.stocks[market.symbol][stockType]?.locked -=
                marketOrder.remainingQuantity;
              user.balance.INR.available +=
                marketOrder.remainingQuantity * order.price;

              order.remainingQuantity -= marketOrder.remainingQuantity;
              marketOrder.remainingQuantity = 0;
              marketOrder.status = OrderStatus.FILLED;

              order.status = OrderStatus.PARTIALLY_FILLED;
            }
          });

          const removedOrders = marketOrders.filter((order) => {
            return order.status !== OrderStatus.FILLED;
          });

          this.userMap.set(user.id, user);

          const desiredPrice = 10 - price;

          if (order.status !== OrderStatus.FILLED) {
            const newOrder: Order = {
              id: uuidv4(),
              side: desiredStockType,
              quantity: order.remainingQuantity,
              marketSymbol: market.symbol,
              remainingQuantity: order.remainingQuantity,
              price: desiredPrice,
              status: OrderStatus.PENDING,
              userId: user.id,
              timeStamp: new Date(),
            };

            marketOrders.push(newOrder);
          }

          const existingOrders = this.orderBook.get(symbol) || [];
          const updatedOrders = existingOrders.map((order) => {
            const matchingMarketOrder = marketOrders.find(
              (marketOrder) => marketOrder.id === order.id
            );
            return matchingMarketOrder || order;
          });

          // Add any new market orders that weren't updates to existing ones
          const newMarketOrders = marketOrders.filter(
            (marketOrder) =>
              !existingOrders.some((order) => order.id === marketOrder.id)
          );

          this.orderBook.set(symbol, [...updatedOrders, ...newMarketOrders]);
        }
      } else {
        const desiredPrice = 10 - price;
        const newOrder: Order = {
          id: uuidv4(),
          side: desiredStockType,
          quantity: order.remainingQuantity,
          marketSymbol: market.symbol,
          remainingQuantity: order.remainingQuantity,
          price: desiredPrice,
          status: OrderStatus.PENDING,
          userId: "COMPANYID_1",
          timeStamp: new Date(),
        };
        const existingOrders = this.orderBook.get(symbol) || [];
        console.log("existing orders", existingOrders);
        this.orderBook.set(symbol, [...existingOrders, newOrder, order]);
      }

      const responsePayload = {
        type: responsePayloadType.sell_response,
        payload: {
          success: true,
          message: "Order placed successfully",
          order,
        },
      };
      console.log("order book", this.orderBook);
      console.log("user balance", user.balance.INR);
      console.log("user balance", user.balance.stocks);

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
