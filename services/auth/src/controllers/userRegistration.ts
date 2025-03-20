import { EMAIL_URL, USER_URL } from "@/config";
import prisma from "@/prisma";
import { UserCreateDTOSchema } from "@/schemas";
import axios from "axios";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";

const generateVerificationCode = () => {
  // get current timestamp in milliseconds
  const timestamp = new Date().getTime().toString();

  // generate a random 2-digit number
  const randomNum = Math.floor(10 + Math.random() * 90);

  // combine timestamp and random number and extract last 5 digits
  let code = (timestamp + randomNum).slice(-5);

  return code;
};

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

    // generate verification code
    const code = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });

    // send verification email
    await axios.post(`${EMAIL_URL}/emails/send`, {
      recipient: user.email,
      subject: "Email Verification",
      body: `Your verification code is ${code}`,
      source: "user-registration",
    });

    res.status(201).json({
      message: "User created. Check your email for verification code.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
