import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Se usa como clave: al cambiar de módulo se limpia el error anterior. */
  resetKey?: string;
  onGoHome?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Contención de errores de renderizado.
 *
 * Sin esto, una excepción en cualquiera de los módulos desmonta el árbol
 * completo de React y el usuario se queda mirando una pantalla en blanco, sin
 * forma de saber qué pasó ni de volver atrás.
 */
// Nota: el proyecto no tiene @types/react instalado, asi que React.Component
// llega sin tipos genericos y el compilador no reconoce props ni setState.
// Se sigue el mismo patron que EmployeeDirectory hasta que se agreguen los
// tipos oficiales de React (ver informe de auditoria).
// El proyecto no tiene @types/react instalado, asi que React.Component llega
// sin genericos y el compilador no reconoce props ni setState. Se sigue el
// mismo patron que EmployeeDirectory hasta que se agreguen los tipos
// oficiales de React (ver apartado 5.1 de AUDITORIA.md).
export class AppErrorBoundary extends (React.Component as any)<Props, State> {
  props!: Props;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[CONSCORE] Error de renderizado:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className="text-lg font-bold text-slate-900">Este módulo no pudo cargarse</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          El resto del sistema sigue funcionando. Vuelve a intentarlo o regresa al
          dashboard; si se repite, comparte el detalle técnico con soporte.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => this.setState({ error: null })}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reintentar
          </button>
          {this.props.onGoHome && (
            <button
              onClick={() => {
                this.setState({ error: null });
                this.props.onGoHome?.();
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Home className="h-3.5 w-3.5" />
              Ir al dashboard
            </button>
          )}
        </div>

        <details className="mt-6 w-full max-w-lg text-left">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
            Detalle técnico
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            {error.message}
          </pre>
        </details>
      </div>
    );
  }
}
