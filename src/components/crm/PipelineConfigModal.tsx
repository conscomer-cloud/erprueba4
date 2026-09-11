import React, { useState } from 'react';
import { SlidersHorizontal, Plus, Trash2, Check, X, MoveUp, MoveDown, Sparkles } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PipelineStageConfig } from '../../types/erp';

interface PipelineConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipelineConfigModal: React.FC<PipelineConfigModalProps> = ({ isOpen, onClose }) => {
  const { pipelineStages, updatePipelineStages } = useERP();

  const [stages, setStages] = useState<PipelineStageConfig[]>(JSON.parse(JSON.stringify(pipelineStages)));
  const [newStageName, setNewStageName] = useState('');
  const [newStageProb, setNewStageProb] = useState(25);

  if (!isOpen) return null;

  const handleProbabilityChange = (id: string, prob: number) => {
    setStages(stages.map((s) => (s.id === id ? { ...s, probability: prob } : s)));
  };

  const handleNameChange = (id: string, name: string) => {
    setStages(stages.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newStages = [...stages];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newStages.length) return;

    const temp = newStages[index];
    newStages[index] = newStages[targetIdx];
    newStages[targetIdx] = temp;

    // re-assign orders
    newStages.forEach((s, idx) => {
      s.order = idx + 1;
    });

    setStages(newStages);
  };

  const handleDelete = (id: string) => {
    if (stages.length <= 3) {
      alert('El pipeline debe contener al menos 3 etapas.');
      return;
    }
    setStages(stages.filter((s) => s.id !== id));
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newStage: PipelineStageConfig = {
      id: `STAGE-${Date.now()}`,
      name: newStageName.trim(),
      code: newStageName.trim().toUpperCase().replace(/\s+/g, '_'),
      order: stages.length + 1,
      probability: newStageProb,
      color: 'bg-indigo-400',
    };
    setStages([...stages, newStage]);
    setNewStageName('');
    setNewStageProb(25);
  };

  const handleSave = () => {
    updatePipelineStages(stages);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-3xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-slate-950 shadow-md">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configuración del Pipeline Comercial</h3>
              <p className="text-xs text-slate-400">Personaliza las etapas, el orden y las probabilidades de cierre</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 p-6 overflow-y-auto max-h-[70vh]">
          {/* Stages List */}
          <div className="space-y-2">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-xs"
              >
                {/* Order & Re-order */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 w-5">{idx + 1}</span>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="text-slate-500 hover:text-white disabled:opacity-20"
                    >
                      <MoveUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === stages.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="text-slate-500 hover:text-white disabled:opacity-20"
                    >
                      <MoveDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Stage Name */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => handleNameChange(stage.id, e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white focus:border-yellow-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{stage.code}</span>
                </div>

                {/* Probability */}
                <div className="w-32 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={stage.probability}
                    onChange={(e) => handleProbabilityChange(stage.id, parseInt(e.target.value, 10) || 0)}
                    className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-center font-bold text-yellow-400 focus:border-yellow-400 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">% prob.</span>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(stage.id)}
                  title="Eliminar Etapa"
                  className="rounded p-1.5 text-slate-500 hover:bg-red-950/60 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Stage Row */}
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Agregar Nueva Etapa</h5>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Nombre de la etapa (ej. VALIDACIÓN TÉCNICA)..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={newStageProb}
                  onChange={(e) => setNewStageProb(parseInt(e.target.value, 10) || 0)}
                  className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-center font-bold text-yellow-400 focus:border-yellow-400 focus:outline-none"
                />
                <span className="text-xs text-slate-400">% prob.</span>
              </div>
              <button
                type="button"
                onClick={handleAddStage}
                className="flex items-center gap-1.5 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-md"
          >
            <Check className="h-4 w-4" />
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
