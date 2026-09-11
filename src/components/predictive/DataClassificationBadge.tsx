/**
 * @license
 * CONSCORE ERP IA - Data Classification Badge Component
 * Strict Data Honesty & Transparent Classification Label
 */

import React from 'react';
import { DataClassification } from '../../types/predictiveOperationsTypes';
import { CheckCircle2, Calculator, TrendingUp, FlaskConical, AlertCircle } from 'lucide-react';

interface DataClassificationBadgeProps {
  classification: DataClassification;
  showIcon?: boolean;
  className?: string;
}

export const DataClassificationBadge: React.FC<DataClassificationBadgeProps> = ({
  classification,
  showIcon = true,
  className = '',
}) => {
  const configMap: Record<
    DataClassification,
    { label: string; bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    REAL: {
      label: 'DATO REAL',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    CALCULATED: {
      label: 'CALCULADO',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: Calculator,
    },
    PROJECTED: {
      label: 'PROYECTADO (IA)',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: TrendingUp,
    },
    SIMULATED: {
      label: 'SIMULADO (SANDBOX)',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: FlaskConical,
    },
    INSUFFICIENT_DATA: {
      label: 'DATOS INSUFICIENTES',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: AlertCircle,
    },
  };

  const config = configMap[classification] || configMap.PROJECTED;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
      title={`Clasificación de datos: ${config.label}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5" />}
      <span className="tracking-wide">{config.label}</span>
    </span>
  );
};
