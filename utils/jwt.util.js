import jwt from "jsonwebtoken";
import { ENV } from "../config/env.config.js";

export const generateToken = (payload, expiresIn = "1h") => {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};
