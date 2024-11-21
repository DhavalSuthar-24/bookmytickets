


import { enqueueTicketRequest,startProcessing } from "../services/ticketProcessor.js";
import { prisma } from "../index.js";
import { errorHandler } from "../utils/middlewares.js";


export const ticketBook = async (req, res, next) => {
  const { eventId, selectedTickets, amount, transactionId } = req.body;

  try {
    const { id: userId } = req.user;

    const result = await prisma.$transaction(async (prisma) => {
 
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
      if (!event) {
        throw errorHandler(404, "Event not found");
      }


      const tickets = await prisma.ticket.findMany({
        where: {
          id: { in: selectedTickets },
          eventId,
          status: 'UNSOLD', 
        },
      });

      if (tickets.length !== selectedTickets.length) {
        throw errorHandler(400, "Some selected tickets are not available or invalid.");
      }


      const payment = await prisma.payment.create({
        data: {
          userId,
          eventId,
          amount,
          transactionId,
          paymentStatus: 'PENDING',}
      });

   
      const ticketRequests = tickets.map((ticket) => ({
        userId,
        eventId,
        ticketId: ticket.id, 
        paymentId: payment.id, 
      }));

      for (const request of ticketRequests) {
        await enqueueTicketRequest(request); 
      }

      return payment;
    });


    if (!processingStarted) {
      processingStarted = true;
      startProcessing();
    }

    res.status(200).json({
      message: "Ticket booking request received. Please wait for confirmation.",
      payment: result,
    });
  } catch (error) {
    console.error("Error booking ticket:", error);
    next(errorHandler(500, "Error booking ticket"));
  }
};




export const scanTicket = async (req, res, next) => {
  const { qrCode } = req.body;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: { event: true, ticketType: true },
    });

    if (!ticket) {
      return next(errorHandler(404, "Ticket not found"));
    }

    if (ticket.isUsed) {
      return res.status(400).json({ message: "Ticket has already been used" });
    }


    await prisma.ticket.update({
      where: { qrCode },
      data: { isUsed: true },
    });

    res.status(200).json({ message: "Ticket scanned successfully", ticket });
  } catch (error) {
    console.error("Error scanning ticket:", error);
    next(errorHandler(500, "Error scanning ticket"));
  }
};


export const cancelTicket = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { id: userId } = req.user; 


    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket || ticket.userId !== userId) {
      return next(errorHandler(404, "Ticket not found or not owned by the user"));
    }


    if (ticket.isUsed) {
      return next(errorHandler(400, "Ticket has already been used and cannot be canceled"));
    }


    await prisma.ticket.delete({
      where: { id },
    });

    res.status(200).json({ message: "Ticket canceled successfully" });
  } catch (error) {
    console.error("Error canceling ticket:", error);
    next(errorHandler(500, "Error canceling ticket"));
  }
};


export const getTicketDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: true,
        ticketType: true,
        user: true,
      },
    });

    if (!ticket) {
      return next(errorHandler(404, "Ticket not found"));
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    next(errorHandler(500, "Error fetching ticket details"));
  }
};


export const getUserTickets = async (req, res, next) => {
  try {
    const { id: userId } = req.user; 

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: {
        event: true,
        ticketType: true,
      },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    next(errorHandler(500, "Error fetching user tickets"));
  }
};
