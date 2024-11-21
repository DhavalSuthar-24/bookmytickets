import express from "express";
import { parse } from "url";
import { wss, setupWebSocket } from "./services/websocket.js";
import { processTicketRequest } from "./services/ticketProcessor.js";
import { PrismaClient } from "@prisma/client";

import { ticketRoutes } from "./routes/ticketRoute.js";
import { venueRoutes } from "./routes/venueRoute.js";
import { authRoutes } from "./routes/authroute.js";
import { organizerRoutes } from "./routes/organizerRoute.js";
export const prisma = new PrismaClient();

const app = express();
const port = 3003;

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/auth", organizerRoutes);
app.use("/api", ticketRoutes);
app.use("/api_2", venueRoutes);



app.server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.server.on("upgrade", (request, socket, head) => {
  const parsedUrl = parse(request.url, true);
  const userId = parsedUrl.query.userId;

  if (!userId) {
    socket.destroy();
    console.error("User ID is required for WebSocket connection.");
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    setupWebSocket(ws, userId);
  });
});
