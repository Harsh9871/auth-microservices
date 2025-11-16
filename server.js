import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRouter from "./routes/auth.router.js";
import userRouter from "./routes/user.router.js";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();
const prisma = new PrismaClient();
const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors({
  origin: "*",
  methods: "*",
  allowedHeaders: "*",
  credentials: true,
}));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

// Serve the main documentation page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`🚀 Server running at: http://localhost:${PORT}/`);
  console.log("=====================================");
});