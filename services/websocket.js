import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });
const userIdToWebSocket = new Map();


export const setupWebSocket = (ws, userId) => {
  console.log(`WebSocket client connected for userId: ${userId}`);
  userIdToWebSocket.set(userId, ws);

  ws.on('close', () => {
    console.log(`WebSocket client disconnected for userId: ${userId}`);
    userIdToWebSocket.delete(userId);
  });

  ws.on('error', (err) => {
    console.error(`Error for WebSocket client ${userId}:`, err);
    userIdToWebSocket.delete(userId);
  });
};

export const notifyClient = (userId, ticket) => {
  const ws = userIdToWebSocket.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(ticket));
    console.log(`Sent ticket to userId: ${userId}`);
  } else {
    console.warn(`WebSocket not available for userId: ${userId}`);
  }
};

export { wss };
