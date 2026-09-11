import React from 'react';
import { ERPModule } from '../../types/erp';
import { ExecutiveCommandCenter } from '../executive/ExecutiveCommandCenter';

interface ExecutiveDashboardProps {
  onNavigate: (module: ERPModule) => void;
  onSelectCustomer?: (customerId: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigate,
  onSelectCustomer,
}) => {
  return (
    <ExecutiveCommandCenter
      onNavigate={onNavigate}
      onSelectCustomer={onSelectCustomer}
    />
  );
};
