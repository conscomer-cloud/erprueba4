/**
 * @license
 * CONSCORE ERP IA - Centralized HTTP & SSE API Client
 */

import {
  User,
  Customer,
  Product,
  Quote,
  QuoteVersion,
  Order,
  Warehouse,
  InventoryMovement,
  AuditLog,
  NotificationItem,
  DashboardKPIs,
  Role,
  Permission,
  RolePermissionMapping,
} from '../types/erp';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('conscore_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('conscore_auth_token', token);
    } else {
      localStorage.removeItem('conscore_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('conscore_auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMsg = errorData.error;
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  public async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, email: identifier, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.setToken(null);
  }

  public async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  public async changePassword(payload: {
    current_password?: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ success: boolean; message: string; mustChangePassword?: boolean; user?: User }> {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Permissions & Roles
  public async getRoles(): Promise<Role[]> {
    return this.request<Role[]>('/api/roles');
  }

  public async getPermissions(): Promise<Permission[]> {
    return this.request<Permission[]>('/api/permissions');
  }

  public async getRolePermissions(): Promise<RolePermissionMapping[]> {
    return this.request<RolePermissionMapping[]>('/api/role-permissions');
  }

  public async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  public async createUser(userData: {
    name: string;
    email: string;
    username?: string;
    role: string;
    salesExecutiveId?: string;
    sales_executive_id?: string;
    temporary_password?: string;
    password?: string;
    confirm_password?: string;
    status?: string;
    department?: string;
    territory?: string;
  }): Promise<{ success: boolean; message: string; user: User }> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<{ success: boolean; message: string; user: User }> {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async setUserStatus(id: string, status: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO' | 'SUSPENDIDO'): Promise<{ success: boolean; message: string; status: string }> {
    return this.request(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public async resetUserPassword(id: string, temporary_password?: string): Promise<{ success: boolean; message: string; temporaryPassword?: string; mustChangePassword?: boolean }> {
    return this.request(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ temporary_password }),
    });
  }

  public async deleteUser(id: string): Promise<{ success: boolean; message: string; status?: string }> {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers
  public async getCustomers(search?: string): Promise<Customer[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<Customer[]>(`/api/customers${query}`);
  }

  public async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/api/customers/${id}`);
  }

  public async getCustomer360(id: string): Promise<any> {
    return this.request<any>(`/api/customers/${id}/360`);
  }

  public async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  public async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async patchCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>(`/api/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async deleteCustomer(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  }

  public async checkCustomerDuplicate(query: { phone?: string; email?: string; rfc?: string; tax_id?: string; companyName?: string }): Promise<{
    isDuplicate: boolean;
    isCrossVendor?: boolean;
    message?: string;
    customerId?: string;
    businessName?: string;
  }> {
    return this.request('/api/customers/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  // Products & Inventory
  public async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/api/products');
  }

  public async createProduct(product: Partial<Product>): Promise<Product> {
    return this.request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  public async recordMovement(data: {
    productId: string;
    warehouseId: string;
    type: string;
    quantity: number;
    reason: string;
    referenceFolio?: string;
  }): Promise<{ success: boolean; movement: InventoryMovement; product: Product }> {
    return this.request<{ success: boolean; movement: InventoryMovement; product: Product }>('/api/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getMovements(): Promise<InventoryMovement[]> {
    return this.request<InventoryMovement[]>('/api/inventory/movements');
  }

  // Warehouses
  public async getWarehouses(): Promise<Warehouse[]> {
    return this.request<Warehouse[]>('/api/warehouses');
  }

  // Quotes
  public async getQuotes(): Promise<Quote[]> {
    return this.request<Quote[]>('/api/quotes');
  }

  public async createQuote(quote: Partial<Quote>): Promise<Quote> {
    return this.request<Quote>('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(quote),
    });
  }

  public async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote> {
    return this.request<Quote>(`/api/quotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async getQuoteVersions(quoteId: string): Promise<QuoteVersion[]> {
    return this.request<QuoteVersion[]>(`/api/quotes/${quoteId}/versions`);
  }

  public async convertQuoteToOrder(quoteId: string, payload: { warehouseId: string; notes?: string; deliveryDate?: string }): Promise<{
    success: boolean;
    order: Order;
    quote: Quote;
  }> {
    return this.request<{ success: boolean; order: Order; quote: Quote }>(`/api/quotes/${quoteId}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // OBSERVACIÓN 16: Financial Approval Methods
  public async requestFinancialApproval(quoteId: string, notes?: string): Promise<{ success: boolean; quote: Quote }> {
    return this.request<{ success: boolean; quote: Quote }>(`/api/quotes/${quoteId}/request-financial-approval`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  public async approveFinancialQuote(quoteId: string, notes?: string): Promise<{ success: boolean; quote: Quote }> {
    return this.request<{ success: boolean; quote: Quote }>(`/api/quotes/${quoteId}/approve-financial`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  public async rejectFinancialQuote(quoteId: string, reason: string): Promise<{ success: boolean; quote: Quote }> {
    return this.request<{ success: boolean; quote: Quote }>(`/api/quotes/${quoteId}/reject-financial`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Orders
  public async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders');
  }

  public async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Audit Logs & Notifications
  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/api/audit-logs');
  }

  public async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/api/notifications');
  }

  public async markNotificationRead(id: string): Promise<void> {
    return this.request(`/api/notifications/${id}/read`, { method: 'PATCH' });
  }

  public async markAllNotificationsRead(): Promise<void> {
    return this.request('/api/notifications/read-all', { method: 'POST' });
  }

  // Dashboard KPIs
  public async getDashboardKPIs(): Promise<DashboardKPIs> {
    return this.request<DashboardKPIs>('/api/dashboard/kpis');
  }

  // AI Service
  public async askAI(message: string, history: any[] = []): Promise<{
    reply: string;
    proposals: any[];
    source: string;
  }> {
    return this.request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  }

  // Reset Demo
  public async resetDemo(): Promise<void> {
    return this.request('/api/system/reset-demo', { method: 'POST' });
  }

  // POD (Proof of Delivery)
  public async registerPOD(pod: any): Promise<{ success: boolean; pod: any }> {
    return this.request('/api/pod', {
      method: 'POST',
      body: JSON.stringify(pod),
    });
  }

  public async getPODs(): Promise<any[]> {
    return this.request('/api/pods');
  }

  public async getOrderPOD(orderId: string): Promise<any> {
    return this.request(`/api/orders/${orderId}/pod`);
  }

  // Real-Time SSE Stream Listener
  public subscribeToRealtimeEvents(onEvent: (event: string, data: any) => void): () => void {
    const token = this.getToken() || '';
    const eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

    const eventNames = [
      'connected',
      'user_logged_in',
      'customer_created',
      'customer_updated',
      'product_created',
      'inventory_updated',
      'inventory_reserved',
      'quote_created',
      'order_created',
      'order_updated',
      'pod_registered',
      'system_reset',
    ];

    eventNames.forEach(evtName => {
      eventSource.addEventListener(evtName, (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(evtName, parsed);
        } catch (err) {
          onEvent(evtName, e.data);
        }
      });
    });

    eventSource.onerror = (err) => {
      console.warn('[SSE] EventSource reconectando...', err);
    };

    return () => {
      eventSource.close();
    };
  }
}

export const api = new ApiClient();
