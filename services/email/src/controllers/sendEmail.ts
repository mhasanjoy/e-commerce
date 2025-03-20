import { DEFAULT_SENDER, transporter } from "@/config";
import prisma from "@/prisma";
import { EmailCreateDTOSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate the request body
    const parsedBody = EmailCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    // create email option
    const { sender, recipient, subject, body, source } = parsedBody.data;
    const from = sender || DEFAULT_SENDER;
    const emailOption = {
      from,
      to: recipient,
      subject,
      text: body,
    };

    // send the email
    const { rejected } = await transporter.sendMail(emailOption);
    if (rejected.length > 0) {
      console.log("Email rejected: ", rejected);
      res.status(500).json({ error: "Failed" });
      return;
    }

    await prisma.email.create({
      data: {
        sender: from,
        recipient,
        subject,
        body,
        source,
      },
    });

    res.status(200).json({ message: "Email sent" });
  } catch (error) {
    next(error);
  }
};

export default sendEmail;
