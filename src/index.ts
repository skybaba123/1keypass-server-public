import "dotenv/config";
import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";

import mongoose from "mongoose";

import authRoutes from "./routes/authentication";
import userRoutes from "./routes/user";
import dataRoutes from "./routes/data";
import passwordGeneratorRoute from "./routes/passwordGenerator";
import feedbackRoutes from "./routes/feedback";
import { validateSubscribeUsers } from "./controllers/user";
import { deleteExpiredData } from "./controllers/data";

import cron from "node-cron";

const app = express();
const port = process.env.PORT || 8080;

app.use(
  cors({
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

app.use(userRoutes);
app.use(authRoutes);
app.use(dataRoutes);
app.use(passwordGeneratorRoute);
app.use(feedbackRoutes);

cron.schedule(
  "0 3 * * *",
  () => {
    validateSubscribeUsers();
    deleteExpiredData();
  },
  { timezone: "Africa/Lagos" }
);

const server = http.createServer(app);

server.listen(port, () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
      console.log(`Server running on http://localhost:${port}/`);
    })
    .catch((error) => {
      console.log(error);
    });
});
