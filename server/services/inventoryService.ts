/**
 * @license
 * CONSCORE ERP IA - Inventory & Warehouse Service
 * Regla matemática: AVAILABLE_STOCK = PHYSICAL_STOCK - RESERVED_STOCK
 * Restricción: AVAILABLE_STOCK >= 0 (salvo configuración explícita)
 */

import { db } from '../db/database';
import {
  Product,
  InventoryMovement,
  InventoryMovementType,
  User,
  WarehouseInventory,
} from '../../src/types/erp';
import { eventBus } from './eventBus';

export interface MovementRequest {
  productId: string;
  warehouseId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  referenceType?: 'COTIZACION' | 'PEDIDO' | 'ORDEN_COMPRA' | 'AJUSTE_MANUAL' | 'TRASPASO';
  referenceId?: string;
  referenceFolio?: string;
}

export class InventoryService {
  /**
   * Recalcula y valida el stock disponible de un producto
   */
  public static recalculateProductStock(product: Product): { physical: number; reserved: number; available: number } {
    const physical = Number(product.physical_stock) || 0;
    const reserved = Number(product.reserved_stock) || 0;
    const available = physical - reserved;

    return {
      physical,
      reserved,
      available,
    };
  }

  /**
   * Registra un movimiento atómico de inventario con validaciones estrictas y auditoría
   */
  public static recordMovement(
    req: MovementRequest,
    user: User
  ): { success: boolean; movement?: InventoryMovement; product?: Product; error?: string } {
    const config = db.getCompanyConfig();
    const product = db.getProducts().find(p => p.id === req.productId);
    if (!product) {
      return { success: false, error: `Producto no encontrado (ID: ${req.productId})` };
    }

    const warehouse = db.getWarehouses().find(w => w.id === req.warehouseId);
    if (!warehouse) {
      return { success: false, error: `Almacén no encontrado (ID: ${req.warehouseId})` };
    }

    if (req.quantity <= 0) {
      return { success: false, error: 'La cantidad del movimiento debe ser un número positivo mayor a 0.' };
    }

    // Save previous snapshot for rollback / audit
    const previousPhysical = product.physical_stock;
    const previousReserved = product.reserved_stock;
    const previousAvailable = product.available_stock;

    let newPhysical = previousPhysical;
    let newReserved = previousReserved;

    switch (req.type) {
      case 'ENTRADA':
      case 'DEVOLUCION':
        newPhysical += req.quantity;
        break;

      case 'SALIDA':
        // Check if there is enough available stock
        if (req.quantity > product.available_stock && !config.allow_negative_stock) {
          return {
            success: false,
            error: `Inventario insuficiente para salida. Producto: ${product.name} (${product.code}). Solicitado: ${req.quantity} ${product.unit}, Disponible: ${product.available_stock} ${product.unit}, Faltante: ${req.quantity - product.available_stock} ${product.unit}.`,
          };
        }
        newPhysical -= req.quantity;
        break;

      case 'RESERVA':
        if (req.quantity > product.available_stock && !config.allow_negative_stock) {
          return {
            success: false,
            error: `Inventario insuficiente para reserva. Producto: ${product.name} (${product.code}). Solicitado: ${req.quantity} ${product.unit}, Disponible: ${product.available_stock} ${product.unit}, Faltante: ${req.quantity - product.available_stock} ${product.unit}.`,
          };
        }
        newReserved += req.quantity;
        break;

      case 'LIBERACION_RESERVA':
        newReserved = Math.max(0, newReserved - req.quantity);
        break;

      case 'AJUSTE':
        newPhysical = req.quantity;
        break;

      default:
        return { success: false, error: `Tipo de movimiento no soportado: ${req.type}` };
    }

    const newAvailable = newPhysical - newReserved;

    if (newAvailable < 0 && !config.allow_negative_stock) {
      return {
        success: false,
        error: `Operación rechazada: Resultaría en stock disponible negativo (${newAvailable} ${product.unit}) para el producto ${product.code}.`,
      };
    }

    // Apply mutation
    product.physical_stock = newPhysical;
    product.reserved_stock = newReserved;
    product.available_stock = newAvailable;
    product.updated_at = new Date().toISOString();

    // Update warehouse-specific inventory record
    let whInv = db.getInventory().find(i => i.product_id === product.id && i.warehouse_id === warehouse.id);
    if (!whInv) {
      whInv = {
        id: `INV-${Date.now().toString(36)}`,
        product_id: product.id,
        warehouse_id: warehouse.id,
        warehouse_name: warehouse.name,
        physical_stock: newPhysical,
        reserved_stock: newReserved,
        available_stock: newAvailable,
        location_in_warehouse: 'Ubicación General',
        updated_at: new Date().toISOString(),
      };
      db.getInventory().push(whInv);
    } else {
      if (req.type === 'ENTRADA' || req.type === 'DEVOLUCION') {
        whInv.physical_stock += req.quantity;
      } else if (req.type === 'SALIDA') {
        whInv.physical_stock = Math.max(0, whInv.physical_stock - req.quantity);
      } else if (req.type === 'RESERVA') {
        whInv.reserved_stock += req.quantity;
      } else if (req.type === 'LIBERACION_RESERVA') {
        whInv.reserved_stock = Math.max(0, whInv.reserved_stock - req.quantity);
      } else if (req.type === 'AJUSTE') {
        whInv.physical_stock = req.quantity;
      }
      whInv.available_stock = whInv.physical_stock - whInv.reserved_stock;
      whInv.updated_at = new Date().toISOString();
    }

    // Register movement entity
    const movementId = db.nextMovementNumber();
    const movement: InventoryMovement = {
      id: movementId,
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      warehouse_id: warehouse.id,
      warehouse_name: warehouse.name,
      type: req.type,
      quantity: req.quantity,
      previous_balance: previousAvailable,
      new_balance: newAvailable,
      reason: req.reason,
      reference_type: req.referenceType || 'AJUSTE_MANUAL',
      reference_id: req.referenceId,
      reference_folio: req.referenceFolio,
      created_by: user.id,
      created_by_name: user.name,
      created_at: new Date().toISOString(),
    };

    db.getMovements().unshift(movement);

    // Audit log
    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: 'INVENTARIO',
      action: `MOVIMIENTO_${req.type}`,
      entity_type: 'INVENTORY',
      entity_id: product.code,
      previous_value: `Físico: ${previousPhysical}, Reservado: ${previousReserved}, Disponible: ${previousAvailable}`,
      new_value: `Físico: ${newPhysical}, Reservado: ${newReserved}, Disponible: ${newAvailable} (${req.type} de ${req.quantity} ${product.unit})`,
    });

    db.persist();

    // Broadcast Real-Time event
    eventBus.broadcast('inventory_updated', {
      product,
      movement,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      movement,
      product,
    };
  }
}
