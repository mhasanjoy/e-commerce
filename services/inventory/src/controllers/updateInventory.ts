import prisma from "@/prisma";
import { InventoryUpdateDTOSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // check if the inventory record exists
    const { id } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });
    if (!inventory) {
      res.status(404).json({ error: "Inventory record not found" });
      return;
    }

    // validate the request body
    const parsedBody = InventoryUpdateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    // find the last inventory history
    const lastHistory = await prisma.history.findFirst({
      where: { inventoryId: id },
      orderBy: { createdAt: "desc" },
    });

    // calculate the new quantity
    let newQuantity = inventory.quantity;
    if (parsedBody.data.actionType === "IN") {
      newQuantity += parsedBody.data.quantity;
    } else if (parsedBody.data.actionType === "OUT") {
      newQuantity -= parsedBody.data.quantity;
    } else {
      res.status(400).json({ error: "Invalid action type" });
      return;
    }

    // update the inventory record
    const updatedInventory = await prisma.inventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
        histories: {
          create: {
            actionType: parsedBody.data.actionType,
            quantityChanged: parsedBody.data.quantity,
            lastQuantity: lastHistory?.newQuantity || 0,
            newQuantity,
          },
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    res.status(200).json(updatedInventory);
  } catch (error) {
    next(error);
  }
};

export default updateInventory;
