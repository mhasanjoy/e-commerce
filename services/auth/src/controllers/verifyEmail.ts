import { EMAIL_URL } from "@/config";
import prisma from "@/prisma";
import { EmailVerificationDTOSchema } from "@/schemas";
import axios from "axios";
import { NextFunction, Request, Response } from "express";

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate the request body
    const parsedBody = EmailVerificationDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    // check if the user with email exists
    const user = await prisma.user.findUnique({
      where: { email: parsedBody.data.email },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // find the verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: { userId: user.id, code: parsedBody.data.code },
    });
    if (!verificationCode) {
      res.status(404).json({ error: "Invalid verification code" });
      return;
    }

    // if the code has expired
    if (verificationCode.expiresAt < new Date()) {
      res.status(400).json({ error: "Verification code expired" });
    }

    // update the status to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        status: "ACTIVE",
      },
    });

    // update verification code status to verified
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    // send success email
    await axios.post(`${EMAIL_URL}/emails/send`, {
      recipient: user.email,
      subject: "Email Verified",
      body: "Your email has been verified successfully",
      source: "verify-email",
    });

    res.status(200).json({ message: "Email verified successfully " });
  } catch (error) {
    next(error);
  }
};

export default verifyEmail;
