import React, { useState } from 'react';
import {
  Users,
  LayoutDashboard,
  Clock,
  Calendar,
  FileText,
  DollarSign,
  Award,
  GraduationCap,
  Sparkles,
  Bot,
  Layers,
} from 'lucide-react';
import { HRDashboard } from './HRDashboard';
import { EmployeeDirectory } from './EmployeeDirectory';
import { AttendanceTracker } from './AttendanceTracker';
import { VacationsAndAbsences } from './VacationsAndAbsences';
import { EmployeeDocuments } from './EmployeeDocuments';
import { CommissionsAndPayroll } from './CommissionsAndPayroll';
import { PerformanceAndGoals } from './PerformanceAndGoals';
import { TrainingAndSkills } from './TrainingAndSkills';
import { AIHRAdvisor } from './AIHRAdvisor';
import { useAuth } from '../../context/AuthContext';

export interface HRModuleProps {
  initialTab?:
    | 'DASHBOARD'
    | 'EMPLOYEES'
    | 'ATTENDANCE'
    | 'VACATIONS'
    | 'DOCUMENTS'
    | 'COMMISSIONS'
    | 'PERFORMANCE'
    | 'TRAINING'
    | 'AI_ADVISOR';
}

export const HRModule: React.FC<HRModuleProps> = ({ initialTab = 'EMPLOYEES' }) => {
  const { currentUser: user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | 'DASHBOARD'
    | 'EMPLOYEES'
    | 'ATTENDANCE'
    | 'VACATIONS'
    | 'DOCUMENTS'
    | 'COMMISSIONS'
    | 'PERFORMANCE'
    | 'TRAINING'
    | 'AI_ADVISOR'
  >(initialTab);

  const tabs = [
    { id: 'DASHBOARD', label: 'Tablero & KPIs', icon: LayoutDashboard },
    { id: 'EMPLOYEES', label: 'Colaboradores', icon: Users },
    { id: 'ATTENDANCE', label: 'Asistencia & Checador', icon: Clock },
    { id: 'VACATIONS', label: 'Vacaciones & Ausencias', icon: Calendar },
    { id: 'DOCUMENTS', label: 'Expedientes Digitales', icon: FileText },
    { id: 'COMMISSIONS', label: 'Comisiones & Pre-Nómina', icon: DollarSign },
    { id: 'PERFORMANCE', label: 'Desempeño & Metas', icon: Award },
    { id: 'TRAINING', label: 'Capacitación & DC-3', icon: GraduationCap },
    { id: 'AI_ADVISOR', label: 'CONSCORE AI Talent', icon: Bot, highlight: true },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-blue-900 tracking-wider">
              CONSCORE ERP • Fase 6
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Centro Integral de Recursos Humanos & Talento
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Users className="h-7 w-7 text-blue-600" />
            Recursos Humanos, Asistencias & Compensación
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl">
            Gestión completa de colaboradores, checador con geolocalización, cálculo de comisiones ligado a ventas reales, expedientes digitales y asesoría de talento con CONSCORE AI.
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
                isActive
                  ? tab.highlight
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : tab.highlight
                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : tab.highlight ? 'text-amber-700' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'DASHBOARD' && <HRDashboard onNavigateTab={setActiveTab} />}
        {activeTab === 'EMPLOYEES' && <EmployeeDirectory />}
        {activeTab === 'ATTENDANCE' && <AttendanceTracker />}
        {activeTab === 'VACATIONS' && <VacationsAndAbsences />}
        {activeTab === 'DOCUMENTS' && <EmployeeDocuments />}
        {activeTab === 'COMMISSIONS' && <CommissionsAndPayroll />}
        {activeTab === 'PERFORMANCE' && <PerformanceAndGoals />}
        {activeTab === 'TRAINING' && <TrainingAndSkills />}
        {activeTab === 'AI_ADVISOR' && <AIHRAdvisor />}
      </div>
    </div>
  );
};
