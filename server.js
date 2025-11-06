import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Prisma Auth Microservice running successfully!");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`🚀 Server running at: http://localhost:${PORT}/`);
  console.log("=====================================");
});
