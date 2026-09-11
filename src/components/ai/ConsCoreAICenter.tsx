import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  RefreshCw,
  User,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionProposal?: {
    id: string;
    title: string;
    description: string;
    status: 'PENDIENTE' | 'APROBADA' | 'MODIFICADA' | 'CANCELADA';
  };
}

const QUICK_PROMPTS = [
  '¿Cómo vamos hoy con las ventas y la meta del mes?',
  '¿Qué productos de aislamiento térmico tienen inventario crítico?',
  '¿Qué cotizaciones están pendientes de seguimiento?',
  '¿Cuánto tenemos de cartera vencida y cuáles son los clientes con saldo atrasado?',
  '¿Qué órdenes de compra deberíamos emitir para la próxima semana?',
  '¿Cuál es el margen operativo promedio por categoría de aislamiento?',
];

export const ConsCoreAICenter: React.FC = () => {
  const { customers, products, quotes, orders, warehouses, suppliers, metrics, addAuditLog, addNotification } = useERP();
  const { currentUser, currentRole } = useAuth();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-01',
      sender: 'ai',
      text: `Hola **${currentUser?.name || 'Usuario'}** (${currentUser?.role || currentRole || 'ADMINISTRADOR'}). Soy **CONSCORE AI**, tu copiloto empresarial inteligente para la comercialización de productos de aislamiento térmico.\n\nEstoy conectado en tiempo real con los módulos de **Ventas, Cotizaciones, Pedidos, Almacenes, Compras y Finanzas**. ¿En qué puedo apoyarte hoy?`,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Register AI query audit (Section 54 of prompt)
    addAuditLog({
      action: 'CONSULTA_IA_CORE',
      module: 'IA',
      details: `Usuario ${currentUser.name} (${currentRole}) consultó a CONSCORE AI: "${query.slice(0, 100)}..."`,
    });

    try {
      // Build real-time ERP context snapshot
      const contextData = {
        metrics,
        totalCustomers: customers.length,
        totalProducts: products.length,
        criticalProducts: products
          .filter((p) => p.availableStock <= p.minStock)
          .map((p) => ({ code: p.code, name: p.name, stock: p.stock, available: p.availableStock, min: p.minStock, unit: p.unit })),
        pendingQuotes: quotes
          .filter((q) => ['ENVIADA', 'EN NEGOCIACIÓN'].includes(q.status))
          .map((q) => ({ folio: q.folio, customer: q.customerName, total: q.total, seller: q.sellerName, status: q.status })),
        activeOrders: orders.map((o) => ({ folio: o.folio, customer: o.customerName, total: o.total, status: o.status, promisedDate: o.promisedDate })),
        overdueCustomers: customers.filter((c) => c.currentBalance > 0),
        warehouses: warehouses.map((w) => ({ name: w.name, occupancy: w.currentOccupancyPct })),
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-4).map((m) => ({ sender: m.sender, text: m.text })),
          contextData,
          userRole: currentRole,
          userName: currentUser.name,
        }),
      });

      const data = await response.json();
      const reply = data.reply || 'No fue posible obtener respuesta del servicio de IA.';

      // Check if action proposal is generated
      let proposal = undefined;
      if (query.toLowerCase().includes('comprar') || query.toLowerCase().includes('inventario') || query.toLowerCase().includes('agotarse')) {
        proposal = {
          id: `PROP-${Date.now().toString(36).toUpperCase()}`,
          title: 'Generar Solicitud de Compra por 200 tramos de Preformado Fibra de Vidrio 2" x 1"',
          description: 'Proveedor: Owens Corning México · Entrega estimada: 7 días · Monto aprox: $17,700 MXN',
          status: 'PENDIENTE' as const,
        };
      } else if (query.toLowerCase().includes('cotizacion') || query.toLowerCase().includes('seguimiento')) {
        proposal = {
          id: `PROP-${Date.now().toString(36).toUpperCase()}`,
          title: 'Programar llamada de seguimiento con Termoaislantes del Norte para COT-1042',
          description: 'Responsable: Arq. Mariana Ruiz · Prioridad: Alta · Cierre potencial: $143,782 MXN',
          status: 'PENDIENTE' as const,
        };
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        actionProposal: proposal,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'ai',
        text: '⚠️ No fue posible procesar la consulta en este momento. Por favor verifica los datos e intenta nuevamente.',
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionStatus = (msgId: string, status: 'APROBADA' | 'CANCELADA') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.actionProposal) {
          const updated = { ...m.actionProposal, status };
          addAuditLog({
            action: `IA_ACCION_${status}`,
            module: 'IA',
            recordId: updated.id,
            details: `Acción propuesta por IA "${updated.title}" marcada como ${status} por ${currentUser.name}.`,
          });
          addNotification({
            title: `Propuesta de IA ${status === 'APROBADA' ? 'Autorizada' : 'Descartada'}`,
            message: updated.title,
            type: status === 'APROBADA' ? 'EXITO' : 'INFO',
            module: 'IA',
          });
          return { ...m, actionProposal: updated };
        }
        return m;
      })
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* AI Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 font-black text-slate-900 shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">CONSCORE AI COPILOT</h2>
              <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-400/30">
                ERP Neuronal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Datos transaccionales en tiempo real · Permisos por rol: <span className="text-yellow-300 font-semibold">{currentRole}</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-[11px]">Modo Seguro & Auditoría</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            <Sparkles className="h-3 w-3 text-yellow-500" /> Consultas rápidas:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-900 transition-colors shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-yellow-400 font-bold shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Action proposal box if present */}
              {msg.actionProposal && (
                <div className="mt-3 rounded-lg bg-slate-900 border-l-4 border-yellow-400 p-3 text-white">
                  <div className="flex items-center justify-between text-xs font-bold text-yellow-400">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Sparkles className="h-3 w-3 text-yellow-400" />
                      Acción Propuesta por Copiloto IA
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        msg.actionProposal.status === 'APROBADA'
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                          : msg.actionProposal.status === 'CANCELADA'
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                      }`}
                    >
                      {msg.actionProposal.status}
                    </span>
                  </div>

                  <div className="mt-1.5 text-xs font-bold text-white">
                    {msg.actionProposal.title}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-300">
                    {msg.actionProposal.description}
                  </p>

                  {msg.actionProposal.status === 'PENDIENTE' && (
                    <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleActionStatus(msg.id, 'APROBADA')}
                        className="flex items-center gap-1 rounded bg-yellow-400 px-2.5 py-1 text-xs font-bold text-slate-900 hover:bg-yellow-300 shadow-xs"
                      >
                        <CheckCircle className="h-3 w-3" /> Aprobar Ejecución
                      </button>
                      <button
                        onClick={() => handleActionStatus(msg.id, 'CANCELADA')}
                        className="flex items-center gap-1 rounded border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                      >
                        <XCircle className="h-3 w-3" /> Descartar
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div
                className={`mt-1.5 text-[10px] text-right ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-yellow-400">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start items-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-yellow-400 animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-xl rounded-bl-none border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-xs flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              Analizando base de datos en tiempo real y generando diagnóstico...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Pregúntale a CONSCORE AI sobre ventas, stock de aislamiento, cotizaciones, pedidos o finanzas..."
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>CONSCORE AI no realiza operaciones financieras ni modificaciones destructivas sin tu autorización.</span>
          <span className="font-mono text-slate-500">Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
};
