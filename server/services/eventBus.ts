import type { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  userId: string;
  role: string;
  isAuthorized: () => boolean;
}

export class EventBus {
  private clients: SSEClient[] = [];

  public addClient(client: SSEClient) {
    if (!this.validateClient(client)) return;
    this.clients.push(client);
    this.sendToClient(client, 'connected', { clientId: client.id });
  }

  public removeClient(clientId: string) {
    this.clients = this.clients.filter(c => c.id !== clientId);
  }

  private validateClient(client: SSEClient): boolean {
    if (client.userId && client.role && client.isAuthorized()) return true;
    this.removeClient(client.id);
    client.res.end();
    return false;
  }

  public broadcast(event: string, _data: unknown) {
    // Invalidate cached views. Fetch records through the authenticated API,
    // which applies permissions and ownership; never broadcast business records.
    [...this.clients].forEach(client => this.sendToClient(client, event, { changed: true }));
  }

  public sendToClient(client: SSEClient, event: string, data: unknown) {
    if (!this.validateClient(client)) return;
    try {
      client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      this.removeClient(client.id);
      client.res.end();
    }
  }

  public notifyRole(role: string, event: string, _data: unknown) {
    [...this.clients]
      .filter(c => c.role === role || c.role === 'ADMINISTRADOR')
      .forEach(c => this.sendToClient(c, event, { changed: true }));
  }
}

export const eventBus = new EventBus();
