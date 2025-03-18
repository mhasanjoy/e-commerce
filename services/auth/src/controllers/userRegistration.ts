import { USER_URL } from "@/config";
import prisma from "@/prisma";
import { UserCreateDTOSchema } from "@/schemas";
import axios from "axios";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";

const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate the request body
    const parsedBody = UserCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    // check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedBody.data.email },
    });
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(parsedBody.data.password, salt);

    // create the auth user
    const user = await prisma.user.create({
      data: {
        ...parsedBody.data,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        verified: true,
      },
    });
    console.log("User created: ");

    // create the user profile by calling the user service
    await axios.post(`${USER_URL}/users`, {
      authUserId: user.id,
      name: user.name,
      email: user.email,
    });

    // TODO: generate verification code
    // TODO: send verification email

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
