import prisma from "@/prisma";
import { NextFunction, Request, Response } from "express";

const getInventoryDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        histories: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    res.status(200).json(inventory);
  } catch (error) {
    next(error);
  }
};

export default getInventoryDetails;
