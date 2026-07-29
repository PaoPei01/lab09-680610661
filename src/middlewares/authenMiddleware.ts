import { type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

import { type CustomRequest, type UserPayload } from "../libs/types.ts";
import { users } from "../db/db.ts";

export const authenticateToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is required",
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token is required",
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "this_is_my_secret";
    const payload = jwt.verify(token, jwtSecret) as UserPayload;
    const user = users.find((item) => item.username === payload.username);

    if (!user || user.role !== payload.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    req.user = payload;
    req.token = token;
    return next();
  } catch {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
