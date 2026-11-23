import express from "express";
import { createServer } from "node:http";

export const app = express();
export const httpServer = createServer(app);
