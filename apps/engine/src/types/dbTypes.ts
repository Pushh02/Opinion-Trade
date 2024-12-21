export enum responsePayloadType {
    login_response = "login_response",
    signup_response = "signup_response",
    createMarket_response = "createMarket_response"
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
    INR: {
        available: number,
        locked: number
    }
}