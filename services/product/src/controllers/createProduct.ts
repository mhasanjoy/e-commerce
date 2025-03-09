import { INVENTORY_URL } from "@/config";
import prisma from "@/prisma";
import { ProductCreateDTOSchema } from "@/schemas";
import axios from "axios";
import { NextFunction, Request, Response } from "express";

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate the request body
    const parsedBody = ProductCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    // check if product with the same sku already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: parsedBody.data.sku },
    });
    if (existingProduct) {
      res
        .status(400)
        .json({ error: "Product with the same SKU already exists" });
      return;
    }

    // create product
    const product = await prisma.product.create({ data: parsedBody.data });
    console.log("Product created successfully", product.id);

    // create inventory record for the product
    const { data: inventory } = await axios.post(
      `${INVENTORY_URL}/inventories`,
      { productId: product.id, sku: product.sku },
      {
        headers: {
          origin: "http://localhost:8081",
        },
      }
    );
    console.log("Inventory created successfully", inventory.id);

    // update product and store inventory id
    await prisma.product.update({
      where: { id: product.id },
      data: { inventoryId: inventory.id },
    });

    res.status(201).json({ ...product, inventoryId: inventory.id });
  } catch (error) {
    next(error);
  }
};

export default createProduct;
