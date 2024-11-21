import { Router } from "express";
import {
  createVenue,
  getAllVenues,
  getVenueDetails,
  updateVenue,
  deleteVenue,
} from "../controllers/venueController.js";
import {
  createEvent,
  getAllEvents,
  getEventDetails,
  updateEvent,
  deleteEvent,
  checkEventAvailability,
  getEventTickets,
} from "../controllers/eventController.js";

import { verifyAuth, verifyOrganizer, verifyUser } from "../utils/middlewares.js"

const router = Router();


router.get("/venues", getAllVenues); 
router.get("/venue/:id", getVenueDetails);
router.get("/events", getAllEvents);
router.get("/event/:id", getEventDetails); 
router.get("/event/:id/availability", checkEventAvailability);


router.get("/event/:id/tickets", verifyAuth, verifyUser, getEventTickets); // User-only route to view tickets


router.post("/add-venue", verifyAuth, verifyOrganizer, createVenue); // Organizer-only route to create venues
router.post("/create-event", verifyAuth, verifyOrganizer, createEvent); // Organizer-only route to create events
router.put("/venue/:id", verifyAuth, verifyOrganizer, updateVenue); // Organizer-only route to update venues
router.put("/event/:id", verifyAuth, verifyOrganizer, updateEvent); // Organizer-only route to update events
router.delete("/venue/:id", verifyAuth, verifyOrganizer, deleteVenue); // Organizer-only route to delete venues
router.delete("/event/:id", verifyAuth, verifyOrganizer, deleteEvent); // Organizer-only route to delete events

export { router as venueRoutes };
