import { prisma } from "../index.js";
import { errorHandler } from "../utils/middlewares.js";

// Create a new event
export const createEvent = async (req, res, next) => {
  const { 
    name, description, startTime, endTime, 
    venueId, organizerId, 
    totalCapacity, premiumCapacity, 
    goldCapacity, normalCapacity, 
    allowPremium, allowGold, allowNormal 
  } = req.body;

  try {
    const event = await prisma.event.create({
      data: {
        name,
        description,
        startTime,
        endTime, 
        venueId,
        organizerId,
        totalCapacity,
        premiumCapacity,
        goldCapacity,
        normalCapacity,
        allowPremium,
        allowGold,
        allowNormal,
      },
    });

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    next(errorHandler(500, "Error creating event"));
  }
};


export const getAllEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        venue: true,
        Organizer: true,
      },
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    next(errorHandler(500, "Error fetching events"));
  }
};

export const getEventDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        Organizer: true,
      },
    });

    if (!event) {
      return next(errorHandler(404, "Event not found"));
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event details:", error);
    next(errorHandler(500, "Error fetching event details"));
  }
};

export const updateEvent = async (req, res, next) => {
  const { id } = req.params;
  const { 
    name, description, startTime, endTime, 
    venueId, organizerId, 
    totalCapacity, premiumCapacity, 
    goldCapacity, normalCapacity, 
    allowPremium, allowGold, allowNormal 
  } = req.body;

  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        name,
        description,
        startTime,
        endtime: endTime,
        venueId,
        organizerId,
        totalCapacity,
        premiumCapacity,
        goldCapacity,
        normalCapacity,
        allowPremium,
        allowGold,
        allowNormal,
      },
    });

    res.status(200).json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Error updating event:", error);

    if (error.code === "P2025") {
      return next(errorHandler(404, "Event not found"));
    }

    next(errorHandler(500, "Error updating event"));
  }
};

// Delete a specific event
export const deleteEvent = async (req, res, next) => {
  const { id } = req.params;

  try {
    await prisma.event.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);

    if (error.code === "P2025") {
      return next(errorHandler(404, "Event not found"));
    }

    next(errorHandler(500, "Error deleting event"));
  }
};

// Check ticket availability for an event
export const checkEventAvailability = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Fetch total tickets for the event
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId: id,
        isUsed: false,
      },
    });

    const availableTickets = tickets.length;

    // Fetch event details to get total capacity and individual ticket types
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        totalCapacity: true,
        premiumCapacity: true,
        goldCapacity: true,
        normalCapacity: true,
        tickets: {
          where: { isUsed: false },
        },
      },
    });

    const remainingTickets = {
      total: event.totalCapacity - availableTickets,
      premium: event.premiumCapacity - tickets.filter(ticket => ticket.ticketType.name === 'premium').length,
      gold: event.goldCapacity - tickets.filter(ticket => ticket.ticketType.name === 'gold').length,
      normal: event.normalCapacity - tickets.filter(ticket => ticket.ticketType.name === 'normal').length,
    };

    res.status(200).json({
      eventId: id,
      remainingTickets,
    });
  } catch (error) {
    console.error("Error checking event availability:", error);
    next(errorHandler(500, "Error checking event availability"));
  }
};

// Get all tickets for a specific event
export const getEventTickets = async (req, res, next) => {
  const { id } = req.params;

  try {
    const tickets = await prisma.ticket.findMany({
      where: { eventId: id },
      include: {
        user: true,
        ticketType: true,  // Include ticket type information
      },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets for event:", error);
    next(errorHandler(500, "Error fetching tickets for event"));
  }
};
