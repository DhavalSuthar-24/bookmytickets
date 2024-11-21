import { Router } from "express";

import {
  ticketBook,
  cancelTicket,
  scanTicket,
  getTicketDetails,
  getUserTickets,
} from "../controllers/ticketController.js";
import {
  createTicketType,
  getTicketTypesByEvent,
  updateTicketType,
  deleteTicketType,
} from "../controllers/ticketTypeController.js";

import { verifyAuth, verifyOrganizer, verifyUser } from "../utils/middlewares.js";

const router = Router();

// Ticket routes
router.post("/book-ticket", verifyAuth, verifyUser, ticketBook); // User books a ticket
router.post("/scan-ticket", verifyAuth, verifyOrganizer, scanTicket); // Organizer scans a ticket
router.delete("/cancel-ticket/:id", verifyAuth, verifyUser, cancelTicket); // User cancels their ticket
router.get("/ticket/:id", verifyAuth, getTicketDetails); // Get details of a specific ticket
router.get("/user-tickets", verifyAuth, verifyUser, getUserTickets); // User views their tickets

// Ticket Type routes
router.post("/create-tickettype", verifyAuth, verifyOrganizer, createTicketType); // Organizer creates a ticket type
router.get("/event/:id/tickettypes", getTicketTypesByEvent); // Public route to view ticket types for an event
router.put("/tickettype/:id", verifyAuth, verifyOrganizer, updateTicketType); // Organizer updates a ticket type
router.delete("/tickettype/:id", verifyAuth, verifyOrganizer, deleteTicketType); // Organizer deletes a ticket type

export { router as ticketRoutes };
