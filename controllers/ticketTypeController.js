import { prisma } from "../index.js";
import { errorHandler } from "../utils/middlewares.js";


export const createTicketType = async (req, res, next) => {
  const { name, price, eventId } = req.body;

  if (!name || !price || !eventId) {
    return next(errorHandler(400, "All fields (name, price, eventId) are required"));
  }

  try {
    // Find the event
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return next(errorHandler(404, "Event not found"));
    }

    // Create the new ticket type
    const ticketType = await prisma.ticketType.create({
      data: {
        name,
        price,
        eventId,
      },
    });

    // Automatically create tickets for this ticket type in the UNSOLD status
    const totalTickets = event.totalCapacity; // Assuming totalCapacity is the number of tickets to create
    const ticketPromises = [];

    // Generate tickets with unique seat numbers
    for (let i = 1; i <= totalTickets; i++) {
      ticketPromises.push(
        prisma.ticket.create({
          data: {
            ticketTypeId: ticketType.id, // Associate the ticket with the created ticket type
            eventId, // Associate the ticket with the event
            status: 'UNSOLD', // Initially set the ticket status to UNSOLD
            qrCode: generateQRCode(i), // Generate QR code
            seatNumber: `Seat-${i}`, // Assign a unique seat number
          },
        })
      );
    }

    // Wait for all ticket creations to finish
    await Promise.all(ticketPromises);

    // Respond with the created ticket type and a success message
    res.status(201).json({
      message: "Ticket type created successfully and tickets generated in UNSOLD status with seat numbers",
      ticketType,
    });
  } catch (error) {
    console.error("Error creating ticket type and tickets:", error);
    next(errorHandler(500, "Error creating ticket type and tickets"));
  }
};

// Helper function to generate a QR code
const generateQRCode = (seatNumber) => {
  const baseUrl = "https://example.com/verify-ticket"; // Replace with your actual base URL
  return `${baseUrl}?seatNumber=${seatNumber}&ticketId=${Math.random().toString(36).substr(2, 9)}`; // Example QR code format
};


// Get all ticket types for a specific event
export const getTicketTypesByEvent = async (req, res, next) => {
  const { id: eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return next(errorHandler(404, "Event not found"));
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
    });
    res.status(200).json(ticketTypes);
  } catch (error) {
    console.error("Error fetching ticket types:", error);
    next(errorHandler(500, "Error fetching ticket types"));
  }
};

// Update a specific ticket type
export const updateTicketType = async (req, res, next) => {
  const { id } = req.params;
  const { name, price } = req.body;

  // Validate required fields
  if (!name || !price) {
    return next(errorHandler(400, "Name and price are required"));
  }

  try {
    const ticketType = await prisma.ticketType.update({
      where: { id },
      data: {
        name,
        price,
      },
    });
    res.status(200).json(ticketType);
  } catch (error) {
    console.error("Error updating ticket type:", error);
    if (error.code === "P2025") {
      next(errorHandler(404, "Ticket type not found"));
    } else {
      next(errorHandler(500, "Error updating ticket type"));
    }
  }
};

// Delete a specific ticket type
export const deleteTicketType = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check if the ticket type exists
    const ticketType = await prisma.ticketType.findUnique({
      where: { id },
    });

    if (!ticketType) {
      return next(errorHandler(404, "Ticket type not found"));
    }

    // Ensure no tickets are sold for this type before deletion
    const ticketsForThisType = await prisma.ticket.count({
      where: { ticketTypeId: id },
    });

    if (ticketsForThisType > 0) {
      return next(errorHandler(400, "Cannot delete ticket type, tickets have been sold"));
    }

    await prisma.ticketType.delete({
      where: { id },
    });
    res.status(204).json({ message: "Ticket type deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket type:", error);
    next(errorHandler(500, "Error deleting ticket type"));
  }
};

// Get details of a specific ticket type
export const getTicketTypeDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id },
    });

    if (!ticketType) {
      return next(errorHandler(404, "Ticket type not found"));
    }

    res.status(200).json(ticketType);
  } catch (error) {
    console.error("Error fetching ticket type details:", error);
    next(errorHandler(500, "Error fetching ticket type details"));
  }
};
