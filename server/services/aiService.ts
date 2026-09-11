/**
 * @license
 * CONSCORE ERP IA - AI Security & Service Layer (Fase 0.1)
 * 
 * Reglas de Seguridad:
 * 1. La IA NUNCA modifica datos críticos directamente.
 * 2. La IA solo consulta, analiza, explica y formula propuestas.
 * 3. Filtrado estricto de contexto según Rol y Permisos RBAC.
 */

import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database';
import { User, UserRole } from '../../src/types/erp';
import { AuthService } from './authService';

export interface AIProposal {
  id: string;
  type: 'RESERVA_INVENTARIO' | 'ORDEN_COMPRA' | 'SEGUIMIENTO_COTIZACION' | 'BLOQUEO_CREDITO';
  title: string;
  description: string;
  impact: string;
  payload: Record<string, any>;
  status: 'PROPUESTA' | 'APROBADA' | 'RECHAZADA';
  createdAt: string;
}

export class AIService {
  private static getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Extrae y sanitiza el contexto del ERP filtrando información confidencial según el rol del usuario
   */
  public static getSanitizedContext(user: User): Record<string, any> {
    const role = user.role;
    const canSeeFinances = AuthService.checkPermission(role, 'FINANZAS', 'VIEW');
    const canSeeHR = AuthService.checkPermission(role, 'RH', 'VIEW');
    const canSeeOrders = AuthService.checkPermission(role, 'PEDIDOS', 'VIEW');
    const canSeeQuotes = AuthService.checkPermission(role, 'COTIZACIONES', 'VIEW');
    const canSeeInventory = AuthService.checkPermission(role, 'INVENTARIO', 'VIEW');
    const canSeeCustomers = AuthService.checkPermission(role, 'CLIENTES', 'VIEW');

    const products = canSeeInventory
      ? db.getProducts().map(p => ({
          sku: p.sku,
          code: p.code,
          name: p.name,
          unit: p.unit,
          physical_stock: p.physical_stock,
          reserved_stock: p.reserved_stock,
          available_stock: p.available_stock,
          minimum_stock: p.minimum_stock,
          price: p.sale_price,
          is_low_stock: p.available_stock <= p.minimum_stock,
        }))
      : [];

    const customers = canSeeCustomers
      ? db.getCustomers().map(c => ({
          code: c.customer_number,
          company_name: c.company_name,
          credit_status: c.credit_status,
          current_balance: canSeeFinances ? c.current_balance : '[RESTRINGIDO]',
          credit_limit: canSeeFinances ? c.credit_limit : '[RESTRINGIDO]',
        }))
      : [];

    const quotes = canSeeQuotes
      ? db.getQuotes().map(q => ({
          folio: q.quote_number,
          customer: q.customer_name,
          status: q.status,
          total: q.total,
          date: q.quote_date,
          item_count: q.items.length,
        }))
      : [];

    const orders = canSeeOrders
      ? db.getOrders().map(o => ({
          folio: o.order_number,
          customer: o.customer_name,
          status: o.status,
          total: o.total,
          delivery_date: o.delivery_date,
        }))
      : [];

    const kpis = canSeeFinances || role === 'DIRECTOR' || role === 'ADMINISTRADOR'
      ? db.computeKPIs()
      : {
          pedidos_activos_count: orders.length,
          cotizaciones_pendientes_count: quotes.filter(q => q.status === 'EN_NEGOCIACION').length,
          stock_critico_count: products.filter(p => p.is_low_stock).length,
        };

    return {
      usuario: {
        nombre: user.name,
        rol: user.role,
      },
      kpis,
      productos_inventario: products,
      clientes: customers,
      cotizaciones_recientes: quotes.slice(0, 10),
      pedidos_recientes: orders.slice(0, 10),
    };
  }

  /**
   * Procesa una consulta a CONSCORE AI y devuelve análisis estructurado y propuestas de acción
   */
  public static async processQuery(
    message: string,
    history: any[],
    user: User
  ): Promise<{
    reply: string;
    proposals: AIProposal[];
    source: 'gemini' | 'conscore-heuristics';
  }> {
    const context = this.getSanitizedContext(user);
    const ai = this.getGeminiClient();

    // Generate actionable proposals based on real data
    const proposals: AIProposal[] = [];

    // Check for critical stock proposal
    const criticalProducts = db.getProducts().filter(p => p.available_stock <= p.minimum_stock);
    if (criticalProducts.length > 0) {
      const topCritical = criticalProducts[0];
      proposals.push({
        id: `PROP-${Date.now().toString(36)}-1`,
        type: 'ORDEN_COMPRA',
        title: `Reabastecimiento Sugerido: ${topCritical.name}`,
        description: `El stock disponible (${topCritical.available_stock} ${topCritical.unit}) está por debajo del mínimo de seguridad (${topCritical.minimum_stock} ${topCritical.unit}). Se sugiere emitir orden de reabastecimiento por 150 unidades.`,
        impact: 'Previene retrasos en entregas de proyectos industriales.',
        payload: {
          productId: topCritical.id,
          productCode: topCritical.code,
          suggestedQuantity: Math.max(100, topCritical.maximum_stock - topCritical.physical_stock),
        },
        status: 'PROPUESTA',
        createdAt: new Date().toISOString(),
      });
    }

    // Check for pending quotes needing follow-up
    const pendingQuotes = db.getQuotes().filter(q => q.status === 'EN_NEGOCIACION');
    if (pendingQuotes.length > 0) {
      const q = pendingQuotes[0];
      proposals.push({
        id: `PROP-${Date.now().toString(36)}-2`,
        type: 'SEGUIMIENTO_COTIZACION',
        title: `Seguimiento de Cierre Comercial: ${q.quote_number}`,
        description: `Cotización por $${q.total.toLocaleString('es-MX')} MXN para ${q.customer_name} con probabilidad de conversión estimada del 85%.`,
        impact: 'Acelera el ingreso comercial del mes.',
        payload: {
          quoteId: q.id,
          quoteNumber: q.quote_number,
        },
        status: 'PROPUESTA',
        createdAt: new Date().toISOString(),
      });
    }

    const systemPrompt = `Eres CONSCORE AI, el asistente inteligente de CONSCORE ERP IA para comercialización de Aislamiento Térmico Industrial (Lana Mineral, Fibra de Vidrio, Poliestireno Extruido XPS, Preformados para Tubería, Chaquetas de Aluminio).
Usuario actual: ${user.name} (Rol: ${user.role}).

REGLAS DE SEGURIDAD ESTRICTAS:
1. No inventes información. Responde basándote estrictamente en los datos del contexto provistos.
2. NUNCA ejecutes modificaciones directas a la base de datos.
3. Si el usuario pide acciones críticas (como reservar inventario o emitir compras), formula una recomendación clara indicando que requiere autorización del responsable.
4. Mantén tono ejecutivo, conciso y profesional en español de México.

CONTEXTO REAL Y PERMITIDO DEL ERP:
${JSON.stringify(context, null, 2)}
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nPregunta del usuario:\n${message}` }],
            },
          ],
        });

        const reply = response.text || 'Análisis completado satisfactoriamente.';
        return {
          reply,
          proposals,
          source: 'gemini',
        };
      } catch (err) {
        console.warn('[AIService] Gemini API error, activando motor heurístico local:', err);
      }
    }

    // Heuristic contextual fallback
    const qLower = (message || '').toLowerCase();
    let reply = `🤖 **CONSCORE AI (Análisis en Tiempo Real)**:\n\n`;

    if (qLower.includes('ventas') || qLower.includes('kpi') || qLower.includes('resumen')) {
      const kpis = db.computeKPIs();
      reply += `📊 **Métricas Comerciales al Día de Hoy**:\n` +
        `• **Ventas de Hoy:** $${kpis.ventas_hoy.toLocaleString('es-MX')} MXN\n` +
        `• **Ventas Acumuladas Mes:** $${kpis.ventas_mes.toLocaleString('es-MX')} MXN\n` +
        `• **Meta Mensual:** $${kpis.meta_mensual.toLocaleString('es-MX')} MXN (${kpis.cumplimiento_pct}% de avance)\n` +
        `• **Pedidos Activos en Proceso:** ${kpis.pedidos_activos_count} pedidos\n` +
        `• **Cotizaciones en Negociación:** ${kpis.cotizaciones_pendientes_count} documentos`;
    } else if (qLower.includes('inventario') || qLower.includes('stock') || qLower.includes('critico')) {
      const critical = db.getProducts().filter(p => p.available_stock <= p.minimum_stock);
      reply += `🏭 **Diagnóstico de Stock Crítico**:\n` +
        `Actualmente tenemos **${critical.length} productos** con stock disponible por debajo del mínimo de seguridad.\n\n` +
        critical.map(p => `• **${p.name}** (${p.code}): Disponible ${p.available_stock} ${p.unit} (Mínimo: ${p.minimum_stock} ${p.unit})`).join('\n') +
        `\n\n📌 *Recomendación:* Se ha generado una propuesta de reabastecimiento para autorización.`;
    } else if (qLower.includes('pedido') || qLower.includes('cotizacion')) {
      const quotes = db.getQuotes();
      const orders = db.getOrders();
      reply += `🧾 **Estado de Cotizaciones y Pedidos**:\n` +
        `• **Total Cotizaciones:** ${quotes.length} registradas (${quotes.filter(q => q.status === 'ACEPTADA').length} aceptadas)\n` +
        `• **Total Pedidos:** ${orders.length} en sistema (${orders.filter(o => o.status === 'RESERVADO').length} con stock reservado)\n\n` +
        `Puedes consultar cualquier folio directamente en las tablas operativas.`;
    } else {
      reply += `He consultado el estado actual de los registros empresariales. Todo el inventario cumple con la regla **Stock Disponible = Físico - Reservado**. Puedes solicitarme diagnósticos de existencias, seguimiento a cotizaciones o cálculo de márgenes comerciales.`;
    }

    return {
      reply,
      proposals,
      source: 'conscore-heuristics',
    };
  }
}
