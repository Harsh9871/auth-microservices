import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRouter from "./routes/auth.router.js";
import userRouter from "./routes/user.router.js";
dotenv.config();
const prisma = new PrismaClient();
const app = express();

app.use(express.json());


app.use(cors(
  {
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    credentials: true,
  }
));
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.get("/", (req, res) => {
  res.send("🚀 Prisma Auth Microservice running successfully!");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`🚀 Server running at: http://localhost:${PORT}/`);
  console.log("=====================================");
});
