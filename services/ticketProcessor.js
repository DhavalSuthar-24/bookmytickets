

import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { redisClient, redisPublisher } from './redisClient.js';
import { prisma } from '../index.js'; // Prisma client import
import { notifyClient } from './websocket.js';


const qrCodeDirectory = path.resolve('qr-codes');


export async function enqueueTicketRequest(ticketRequest) {
  try {
    console.log(`[ENQUEUE] Adding ticket request for user ${ticketRequest.userId} to the queue...`);
    await redisClient.rPush('ticketQueue', JSON.stringify(ticketRequest));
    console.log(`[ENQUEUE] Successfully enqueued ticket request for user ${ticketRequest.userId}.`);
  } catch (error) {
    console.error('[ENQUEUE ERROR] Error enqueueing ticket request:', error);
  }
}


export async function dequeueTicketRequest() {
  try {
    console.log('[DEQUEUE] Attempting to dequeue ticket request...');
    const res = await redisClient.lPop('ticketQueue');
    if (res) {
      console.log('[DEQUEUE] Successfully dequeued ticket request.');
      return JSON.parse(res);
    } else {
      console.log('[DEQUEUE] No ticket requests found in the queue.');
      return null;
    }
  } catch (error) {
    console.error('[DEQUEUE ERROR] Error dequeuing ticket request:', error);
    return null;
  }
}


export async function processTicketRequest() {
  const ticketRequest = await dequeueTicketRequest();

  if (ticketRequest) {
    console.log(`[PROCESS] Processing ticket request for userId: ${ticketRequest.userId}`);
    console.log(`[PROCESS] Ticket Request Details:`, ticketRequest);

    try {
      const { eventId, ticketId, userId, paymentId } = ticketRequest;

      await prisma.$transaction(async (prisma) => {

        const event = await prisma.event.findUnique({
          where: { id: eventId },
        });
        if (!event) {
          throw new Error(`[ERROR] Event with ID ${eventId} not found.`);
        }

        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
        });
        if (!ticket || ticket.status !== 'UNSOLD') {
          throw new Error(`[ERROR] Ticket with ID ${ticketId} is not available.`);
        }


        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
        });
        if (!payment || payment.paymentStatus !== 'PENDING') {
          throw new Error(`[ERROR] Invalid payment for Ticket ID ${ticketId}`);
        }


        console.log('[PROCESS] Generating QR code...');
        const qrCodeData = `UserID:${userId},EventID:${eventId},TicketID:${ticketId}`;
        const fileName = `${userId}-${Date.now()}.png`;
        const filePath = path.join(qrCodeDirectory, fileName);

        await fs.mkdir(qrCodeDirectory, { recursive: true });
        await QRCode.toFile(filePath, qrCodeData);
        const qrCodeUrl = `/qr-codes/${fileName}`;


        const updatedTicket = await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            userId,
            status: 'SOLD', 
            qrCode: qrCodeUrl,
          },
        });


        await prisma.payment.update({
          where: { id: paymentId },
          data: { paymentStatus: 'COMPLETED' },
        });

        console.log('[PROCESS] Ticket updated successfully:', updatedTicket);


        await publishTicketBooked(updatedTicket);
      });
    } catch (error) {
      console.error("[PROCESS ERROR] Error processing ticket request:", error);
    }
  }
}





async function publishTicketBooked(ticket) {
  try {
    console.log(`[PUBLISH] Publishing ticketBooked event for userId: ${ticket.userId}`);
    await redisPublisher.publish('ticketBooked', JSON.stringify(ticket));
    notifyClient(ticket.userId, ticket);
  } catch (error) {
    console.error('[PUBLISH ERROR] Error publishing ticketBooked event:', error);
  }
}



export async function startProcessing() {
  console.log('[START] Starting the ticket processing loop...');
  try {
    await processTicketRequest();
    setTimeout(startProcessing, 5000); 
  } catch (error) {
    console.error('[PROCESS LOOP ERROR] Error in processing loop:', error);
  }
}
