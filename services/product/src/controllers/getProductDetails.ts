import { INVENTORY_URL } from "@/config";
import prisma from "@/prisma";
import axios from "axios";
import { NextFunction, Request, Response } from "express";

const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (product.inventoryId === null) {
      const { data: inventory } = await axios.post(
        `${INVENTORY_URL}/inventories`,
        { productId: product.id, sku: product.sku }
      );
      console.log("Inventory created successfully", inventory.id);

      await prisma.product.update({
        where: { id: product.id },
        data: { inventoryId: inventory.id },
      });
      console.log(
        "Product updated successfully with inventory id",
        inventory.id
      );

      res.status(200).json({
        ...product,
        inventoryId: inventory.id,
        stock: inventory.quantity || 0,
        stockStatus: inventory.quantity > 0 ? "In stock" : "Out of stock",
      });
      return;
    }

    // fetch inventory
    const { data: inventory } = await axios.get(
      `${INVENTORY_URL}/inventories/${product.inventoryId}`,
      {
        headers: {
          origin: "http://localhost:8081",
        },
      }
    );

    res.status(200).json({
      ...product,
      stock: inventory.quantity || 0,
      stockStatus: inventory.quantity > 0 ? "In stock" : "Out of stock",
    });
  } catch (error) {
    next(error);
  }
};

export default getProductDetails;
