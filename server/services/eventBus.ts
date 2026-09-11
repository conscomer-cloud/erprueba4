/**
 * @license
 * CONSCORE ERP IA - Real-Time Server-Sent Events (SSE) Bus
 */

import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  role?: string;
}

class EventBus {
  private clients: SSEClient[] = [];

  public addClient(client: SSEClient) {
    this.clients.push(client);
    console.log(`[SSE] Cliente conectado: ${client.id}. Total activos: ${this.clients.length}`);

    // Send initial handshake
    this.sendToClient(client, 'connected', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
      message: 'Conexión en tiempo real establecida con CONSCORE Core',
    });
  }

  public removeClient(clientId: string) {
    this.clients = this.clients.filter(c => c.id !== clientId);
    console.log(`[SSE] Cliente desconectado: ${clientId}. Total activos: ${this.clients.length}`);
  }

  public broadcast(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(client => {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error(`[SSE] Error enviando a cliente ${client.id}:`, err);
      }
    });
  }

  public sendToClient(client: SSEClient, event: string, data: any) {
    try {
      client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error(`[SSE] Error en sendToClient ${client.id}:`, err);
    }
  }

  public notifyRole(role: string, event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients
      .filter(c => !c.role || c.role === role || c.role === 'ADMINISTRADOR')
      .forEach(c => {
        try {
          c.res.write(payload);
        } catch (e) {}
      });
  }
}

export const eventBus = new EventBus();
