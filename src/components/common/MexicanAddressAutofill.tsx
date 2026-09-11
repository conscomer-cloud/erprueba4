import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface MexicanAddressValue {
  zipCode: string;
  colonia: string;
  municipality: string;
  state: string;
  city: string;
}

interface ZipLookupResult {
  zipCode: string;
  state: string;
  municipality: string;
  city: string;
  settlements: { name: string; type: string }[];
}

interface Props {
  value: Partial<MexicanAddressValue>;
  onChange: (value: Partial<MexicanAddressValue>) => void;
  /** Oscuro para formularios sobre fondo negro (CRM); claro para el resto. */
  variant?: 'dark' | 'light';
  disabled?: boolean;
}

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` });

/**
 * Selector de dirección mexicana con autocompletado por código postal.
 *
 * Al capturar 5 dígitos, consulta el catálogo de SEPOMEX en el servidor
 * (github.com/d3249/mexico_zipcodes) y llena estado y municipio solos; la
 * colonia queda en un selector porque un mismo CP casi siempre cubre varias.
 *
 * El catálogo tiene corte de marzo de 2019: SEPOMEX no publica una API
 * pública más reciente. Si un CP no aparece —zona nueva o reasignada—, los
 * campos de estado y municipio se dejan editables en vez de bloquear la
 * captura: el dato real que trae la persona vale más que un catálogo viejo.
 */
export const MexicanAddressAutofill: React.FC<Props> = ({ value, onChange, variant = 'light', disabled }) => {
  const [estado, setEstado] = useState('cargando');
  const [colonias, setColonias] = useState<{ name: string; type: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const ultimaConsulta = useRef<string>('');

  const zip = value.zipCode || '';

  useEffect(() => {
    if (!/^\d{5}$/.test(zip)) {
      setColonias([]);
      setError(null);
      return;
    }
    if (ultimaConsulta.current === zip) return;
    ultimaConsulta.current = zip;

    let cancelado = false;
    setEstado('cargando');
    setError(null);

    fetch(`/api/geo/zipcode/${zip}`, { headers: auth() })
      .then(async (res) => {
        if (cancelado) return;
        if (!res.ok) {
          setError('Código postal no encontrado en el catálogo. Puedes capturar el resto manualmente.');
          setColonias([]);
          setManual(true);
          setEstado('listo');
          return;
        }
        const data: ZipLookupResult = await res.json();
        setColonias(data.settlements);
        setManual(false);
        onChange({
          ...value,
          state: data.state,
          municipality: data.municipality,
          city: data.city,
          // Si solo hay un asentamiento, se preselecciona; si hay varios, se
          // limpia para que la persona elija el que corresponde.
          colonia: data.settlements.length === 1 ? data.settlements[0].name : '',
        });
        setEstado('listo');
      })
      .catch(() => {
        if (cancelado) return;
        setError('No se pudo consultar el código postal. Revisa tu conexión.');
        setManual(true);
        setEstado('listo');
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip]);

  const oscuro = variant === 'dark';
  const inputCls = oscuro
    ? 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none disabled:opacity-50'
    : 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:bg-slate-50';
  const labelCls = oscuro ? 'mb-1 block text-xs font-semibold text-slate-300' : 'mb-1 block text-xs font-semibold text-slate-600';

  const cargando = /^\d{5}$/.test(zip) && estado === 'cargando';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Código Postal</label>
          <div className="relative">
            <MapPin className={`absolute left-3 top-2.5 h-4 w-4 ${oscuro ? 'text-slate-500' : 'text-slate-400'}`} />
            {cargando ? (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-blue-500" />
            ) : zip.length === 5 && !error ? (
              <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-emerald-500" />
            ) : null}
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="Ej. 42850"
              disabled={disabled}
              value={zip}
              onChange={(e) => {
                const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 5);
                onChange({ ...value, zipCode: soloDigitos });
              }}
              className={`${inputCls} pl-9 pr-9`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Colonia</label>
          {colonias.length > 0 ? (
            <select
              disabled={disabled}
              value={value.colonia || ''}
              onChange={(e) => onChange({ ...value, colonia: e.target.value })}
              className={inputCls}
            >
              <option value="">Selecciona…</option>
              {colonias.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Colonia"
              disabled={disabled || !manual}
              value={value.colonia || ''}
              onChange={(e) => onChange({ ...value, colonia: e.target.value })}
              className={inputCls}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Municipio / Alcaldía</label>
          <input
            type="text"
            placeholder="Se llena con el CP"
            disabled={disabled || !manual}
            value={value.municipality || ''}
            onChange={(e) => onChange({ ...value, municipality: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <input
            type="text"
            placeholder="Se llena con el CP"
            disabled={disabled || !manual}
            value={value.state || ''}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <div className={`flex items-start gap-2 rounded-lg p-2.5 text-[11px] ${oscuro ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
