import { JWT_SECRET } from "@/config";
import prisma from "@/prisma";
import { UserLoginDTOSchema } from "@/schemas";
import { LoginAttempt } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type LoginHistory = {
  userId: string;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  attempt: LoginAttempt;
};

const createLoginHistory = async (info: LoginHistory) => {
  await prisma.loginHistory.create({ data: info });
};

const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.ip || "";
    const userAgent = req.headers["user-agent"] || "";

    // validate the request body
    const parsedBody = UserLoginDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    // check if the user exists
    const user = await prisma.user.findUnique({
      where: { email: parsedBody.data.email },
    });
    if (!user) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    // compare password
    const isMatch = await bcrypt.compare(
      parsedBody.data.password,
      user.password
    );
    if (!isMatch) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    // check if the user is verified
    if (!user.verified) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });
      res.status(400).json({ error: "User not verified" });
      return;
    }

    // check if the account is active
    if (user.status !== "ACTIVE") {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });
      res
        .status(400)
        .json({ error: `Your account is ${user.status.toLowerCase()}` });
      return;
    }

    // generate access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        emil: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    await createLoginHistory({
      userId: user.id,
      ipAddress,
      userAgent,
      attempt: "SUCCESS",
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export default userLogin;
