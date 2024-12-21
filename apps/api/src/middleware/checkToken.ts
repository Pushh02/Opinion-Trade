import { NextFunction, Request, Response } from "express";

export interface AuthenticatedRequest extends Request {
    token?: any;
}

export const checkToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;
    if (!token) {
        throw new Error("Access denied. No token provided.");
    }
    token = token.split(" ")[1];
    req.token = token;
    next();
}