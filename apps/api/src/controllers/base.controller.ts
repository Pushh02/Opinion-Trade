// src/controllers/base.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export class BaseController {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  protected async handleRequest(
    req: Request,
    res: Response,
    operation: () => Promise<any>
  ) {
    try {
      const result = await operation();
      return this.successResponse(res, result);
    } catch (error) {
      return this.errorResponse(res, error);
    }
  }

  protected successResponse(res: Response, data?: any) {
    if (data) {
      // Handle circular references by converting to plain object
      const safeData = JSON.parse(JSON.stringify(data, this.getCircularReplacer()));
      return res.status(200).json(safeData);
    }
    return res.status(200).json({ success: true });
  }

  protected errorResponse(res: Response, error: any) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  private getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  }
}