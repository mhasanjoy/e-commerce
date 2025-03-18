import prisma from "@/prisma";
import { UserCreateDTOSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate the request body
    const parsedBody = UserCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    // check if the authUserId already exists
    const existingUser = await prisma.user.findUnique({
      where: { authUserId: parsedBody.data.authUserId },
    });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // create a new user
    const user = await prisma.user.create({ data: parsedBody.data });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export default createUser;
