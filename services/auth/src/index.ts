import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import { userLogin, userRegistration, verifyToken } from "./controllers";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// health
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "UP" });
});

// allowed origins
// app.use((req: Request, res: Response, next: NextFunction) => {
//   const allowedOrigins = ["http://localhost:8081", "http://127.0.0.1:8081"];
//   const origin = req.headers.origin || "";

//   if (allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     next();
//   } else {
//     res.status(403).json({ error: "Forbidden" });
//   }
// });

// routes
app.post("/auth/registration", userRegistration);
app.post("/auth/login", userLogin);
app.post("/auth/verify-token", verifyToken);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 4003;
const serviceName = process.env.SERVICE_NAME || "Auth-Service";

app.listen(port, () => {
  console.log(`${serviceName} is running on port ${port}`);
});
