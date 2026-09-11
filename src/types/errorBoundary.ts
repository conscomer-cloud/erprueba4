/**
 * Tipos compartidos de los error boundaries.
 *
 * Ocho componentes declaraban `React.Component<ErrorBoundaryProps,
 * ErrorBoundaryState>` sin que esos tipos existieran en ningún lado. Se
 * centralizan aquí en vez de repetirlos por archivo.
 */

import React from 'react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Mensaje alternativo cuando el módulo falla. */
  fallbackMessage?: string;
  onReset?: () => void;
  /** El simulador financiero llama a esto desde su pantalla de error. */
  onRetry?: () => void;
  /** Encabezado del bloque de error, cuando la vista lo personaliza. */
  title?: string;
}

export interface ErrorBoundaryState {
  hasError?: boolean;
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
  /** Varias vistas guardan solo el texto del error, no el objeto. */
  errorMessage?: string;
}
