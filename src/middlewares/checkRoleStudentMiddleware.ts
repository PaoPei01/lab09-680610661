import { type Response, type NextFunction } from "express";
import { type CustomRequest } from "../libs/types.ts";

export const checkRoleStudent = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "STUDENT") {
    return res.status(403).json({
      ok: true,
      message: "Only Student can access this API route",
    });
  }

  return next();
};
