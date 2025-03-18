import { JWT_SECRET } from "@/config";
import prisma from "@/prisma";
import { AccessTokenDTOSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate the request body
    const parsedBody = AccessTokenDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    const decoded = jwt.verify(parsedBody.data.accessToken, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.status(200).json({ message: "Authorized", user });
  } catch (error) {
    next(error);
  }
};

export default verifyToken;
