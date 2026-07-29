import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

import { users, reset_users } from "../db/db.ts";
import { type CustomRequest } from "../libs/types.ts";
import { authenticateToken } from "../middlewares/authenMiddleware.ts";

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  const user = users.find(
    (item) => item.username === username && item.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }

  const jwtSecret = process.env.JWT_SECRET || "this_is_my_secret";
  const token = jwt.sign(
    {
      username: user.username,
      studentId: user.studentId,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "30m" }
  );

  user.tokens = user.tokens ? [...user.tokens, token] : [token];

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
  });
});

router.post(
  "/logout",
  authenticateToken,
  (req: CustomRequest, res: Response) => {
    const user = users.find((item) => item.username === req.user?.username);
    if (user?.tokens && req.token) {
      user.tokens = user.tokens.filter((token) => token !== req.token);
    }

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
);

router.post("/reset", (req: Request, res: Response) => {
  reset_users();
  return res.status(200).json({
    success: true,
    message: "User database has been reset",
  });
});

export default router;
