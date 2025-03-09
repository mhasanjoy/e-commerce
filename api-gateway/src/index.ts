import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { configureRoutes } from "./utils";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// security middleware
app.use(helmet());

// rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  handler: (_req: Request, res: Response) => {
    res
      .status(429)
      .json({ error: "Too many requests, please try again later." });
  },
});
app.use("/api", limiter);

// health
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "UP" });
});

// TODO: Auth middleware

// routes
configureRoutes(app);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 8081;

app.listen(port, () => {
  console.log(`API Gateway is running on port ${port}`);
});
