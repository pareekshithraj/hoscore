import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';

interface Client {
  ws: WebSocket;
  hospitalId: string;
  userId: string;
}

const clients: Client[] = [];

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via query param token
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hoscore-development-secret-key-32chars') as any;
      const client: Client = { ws, hospitalId: decoded.hospitalId, userId: decoded.userId };
      clients.push(client);

      console.log(`🔌 WebSocket connected: user=${decoded.userId} hospital=${decoded.hospitalId}`);

      ws.on('close', () => {
        const idx = clients.indexOf(client);
        if (idx > -1) clients.splice(idx, 1);
        console.log(`🔌 WebSocket disconnected: user=${decoded.userId}`);
      });

      ws.on('error', () => {
        const idx = clients.indexOf(client);
        if (idx > -1) clients.splice(idx, 1);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({ type: 'connected', message: 'Real-time updates active' }));
    } catch (err) {
      ws.close(4002, 'Invalid token');
    }
  });

  console.log('🔌 WebSocket server initialized on /ws');
  return wss;
}

export function broadcastToHospital(hospitalId: string, channel: string, data: any) {
  const message = JSON.stringify({ type: channel, data, timestamp: Date.now() });
  let sent = 0;
  for (const client of clients) {
    if (client.hospitalId === hospitalId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      sent++;
    }
  }
  if (sent > 0) console.log(`🔌 Broadcast [${channel}] to ${sent} clients in hospital ${hospitalId.slice(0, 8)}...`);
}

export function sendToUser(userId: string, channel: string, data: any) {
  const message = JSON.stringify({ type: channel, data, timestamp: Date.now() });
  let sent = 0;
  for (const client of clients) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      sent++;
    }
  }
  if (sent > 0) console.log(`🔌 Sent [${channel}] to user ${userId.slice(0, 8)}...`);
}
