export enum responsePayloadType {
    login_response = "login_response",
    signup_response = "signup_response",
    createMarket_response = "createMarket_response",
    getMarketList_response = "getMarketList_response",
    getMarket_response = "getMarket_response",
    createCategory_response = "createCategory_response",
    buy_response = "buy_response",
    sell_response = "sell_response"
}

export type User = {
    id: string,
    username: string,
    email: string,
    password: string,
    role: string
    balance: UserBalance
}

export type UserBalance = {
    stocks: StockBalance,
    INR: {
        available: number,
        locked: number
    }
}

export type StockBalance = {
    [marketSymbol: string]: {
        'YES'?: Position,
        'NO'?: Position
    }
}

export type Position = {
    quantity: number,
    locked: number
}

export enum Side {
    YES = "YES",
    NO = "NO"
}

export type Market = {
    id: string,
    symbol: string,
    description: string,
    endTime: Date,
    sourceOfTruth: string,
    categoryId: string,
    categoryTitle: string,
    status: MarketStatus,
    lastYesPrice: number,
    lastNoPrice: number,
    totalVolume: number,
    resolvedOutcome?: Side
    timestamp: Date,
    createdBy: String
}

export enum OrderStatus {
    PENDING = "PENDING",
    FILLED = "FILLED",
    PARTIALLY_FILLED = "PARTIALLY_FILLED",
    CANCELLED = "CANCELLED"
}

export enum MarketStatus {
    ACTIVE = "ACTIVE",
    CLOSED = "CLOSED"
}

export type Order = {
    id: string,
    side: Side,
    quantity: number,
    marketSymbol: string,
    remainingQuantity: number,
    price: number,
    status: OrderStatus,
    userId: string,
    timeStamp: Date
}

export type Category = {
    id: string,
    title: string,
    icon: string,
    description: string
}