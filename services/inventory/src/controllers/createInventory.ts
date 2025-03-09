import prisma from "@/prisma";
import { InventoryCreateDTOSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const createInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate the request body
    const parsedBody = InventoryCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    // create a new inventory record
    const inventory = await prisma.inventory.create({
      data: {
        ...parsedBody.data,
        histories: {
          create: {
            actionType: "IN",
            quantityChanged: parsedBody.data.quantity,
            lastQuantity: 0,
            newQuantity: parsedBody.data.quantity,
          },
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    res.status(201).json(inventory);
  } catch (error) {
    next(error);
  }
};

export default createInventory;
