'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAlmaStore } from './store';
import { formatARS } from './lib';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Config {
  sahumerio_venta: number; pack8_venta: number; difusor_venta: number;
  sahumerio_costo: number; difusor_costo: number; mo_sahumerio: number; mo_difusor: number;
}

const DEFAULTS: Config = {
  sahumerio_venta: 400, pack8_venta: 2800, difusor_venta: 1200,
  sahumerio_costo: 375, difusor_costo: 320, mo_sahumerio: 175, mo_difusor: 0,
};

interface CampoProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function Campo({ label, value, onChange }: CampoProps) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value));

  useEffect(() => {
    setRaw(value === 0 ? '' : String(value));
  }, [value]);

  return (
    <div className="mb-4">
      <label className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase block mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-noir-t3 font-medium">$</span>
        <input
          type="number"
          value={raw}
          onChange={e => {
            setRaw(e.target.value);
            onChange(e.target.value === '' ? 0 : Number(e.target.value));
          }}
          onBlur={() => {
            if (raw === '' || raw === '-') { setRaw(''); onChange(0); }
          }}
          className="w-full pl-8 pr-3 bg-white/60 border border-black/[0.08] text-gold font-semibold rounded-xl h-11 text-[14px] outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-luxury"
        />
      </div>
    </div>
  );
}

export function ConfigView({ onBack }: { onBack: () => void }) {
  const { refreshDashboard } = useAlmaStore();
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => {});
  }, []);

  const update = (key: keyof Config, value: number) =>
    setConfig(c => ({ ...c, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(false);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('error');
      refreshDashboard();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
    setSaving(false);
  };

  const matSah = config.sahumerio_costo - config.mo_sahumerio;
  const handleReset = async () => {
    setResetting(true);
    await fetch('/api/reset', { method: 'DELETE' });
    refreshDashboard();
    setResetting(false);
    setResetStep(0);
  };

  const margenMin = config.sahumerio_venta > 0
    ? ((config.sahumerio_venta - config.sahumerio_costo) / config.sahumerio_venta * 100).toFixed(1)
    : '0.0';
  const margenPack = config.pack8_venta > 0
    ? (((config.pack8_venta / 8) - config.sahumerio_costo) / (config.pack8_venta / 8) * 100).toFixed(1)
    : '0.0';
  const margenDif = config.difusor_venta > 0
    ? ((config.difusor_venta - config.difusor_costo) / config.difusor_venta * 100).toFixed(1)
    : '0.0';

  return (
    <>
    {/* ── Modal confirmación reset ── */}
    <AnimatePresence>
      {resetStep > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(245,240,232,0.92)', backdropFilter: 'blur(16px)' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="card-glass-raised rounded-2xl p-6 w-full max-w-xs text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-terra/10 border border-terra/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} strokeWidth={1.5} className="text-terra" />
            </div>
            {resetStep === 1 ? (
              <>
                <p className="text-[15px] font-black text-noir-t1 mb-2">¿Borrar todo?</p>
                <p className="text-[12px] text-noir-t3 font-light mb-5 leading-relaxed">
                  Se van a eliminar todas las ventas, compras, retiros y movimientos de stock. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setResetStep(0)}
                    className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-noir-t2 text-[12px] font-medium cursor-pointer bg-transparent hover:bg-black/[0.03] transition-luxury">
                    Cancelar
                  </button>
                  <button onClick={() => setResetStep(2)}
                    className="flex-1 py-2.5 rounded-xl bg-terra text-white text-[12px] font-semibold cursor-pointer hover:bg-terra-dim transition-luxury border-none">
                    Sí, borrar todo
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-black text-terra mb-2">Última confirmación</p>
                <p className="text-[12px] text-noir-t3 font-light mb-5 leading-relaxed">
                  Confirmá que querés borrar <strong className="text-noir-t1">todos los datos</strong> permanentemente.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setResetStep(0)}
                    className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-noir-t2 text-[12px] font-medium cursor-pointer bg-transparent hover:bg-black/[0.03] transition-luxury">
                    Cancelar
                  </button>
                  <button onClick={handleReset} disabled={resetting}
                    className="flex-1 py-2.5 rounded-xl bg-terra text-white text-[12px] font-bold cursor-pointer hover:bg-terra-dim disabled:opacity-60 transition-luxury border-none">
                    {resetting ? 'Borrando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="max-w-md mx-auto px-5 pt-8 pb-28 lg:px-8 lg:pt-12">
      <button onClick={onBack} className="text-noir-t3 text-[12px] mb-6 flex items-center gap-1.5 hover:text-noir-t2 transition-luxury font-light bg-transparent border-none cursor-pointer">
        <ArrowLeft size={14} /> Volver
      </button>
      <h2 className="text-xl font-black text-noir-t1 mb-1">Ajustes</h2>
      <p className="text-noir-t3 text-[12px] font-light mb-6">Precios y costos del negocio</p>

      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Precios de venta</p>
      <div className="card-glass rounded-2xl p-5 mb-5">
        <Campo label="Sahumerio suelto"  value={config.sahumerio_venta} onChange={v => update('sahumerio_venta', v)} />
        <Campo label="Pack x8"           value={config.pack8_venta}     onChange={v => update('pack8_venta', v)} />
        <Campo label="Difusor auto"      value={config.difusor_venta}   onChange={v => update('difusor_venta', v)} />
      </div>

      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Mano de obra</p>
      <div className="card-glass rounded-2xl p-5 mb-5">
        <Campo label="MO por sahumerio" value={config.mo_sahumerio} onChange={v => update('mo_sahumerio', v)} />
        <div className="mb-4">
          <label className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase block mb-2">MO difusores</label>
          <div className="p-3 bg-black/[0.03] rounded-xl border border-black/[0.06]">
            <span className="text-[13px] font-semibold text-noir-t3">$0</span>
            <span className="text-[11px] text-noir-t3 ml-2 font-light">Incluido en costo</span>
          </div>
        </div>
      </div>

      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Costo por producto</p>
      <div className="card-glass rounded-2xl p-5 mb-5">
        <Campo label="Costo sahumerio (insumos + pkg + MO)" value={config.sahumerio_costo} onChange={v => update('sahumerio_costo', v)} />
        <Campo label="Costo difusor (insumos + packaging)"  value={config.difusor_costo}   onChange={v => update('difusor_costo', v)} />
      </div>

      <div className="card-glass rounded-2xl p-5 mb-6">
        <p className="text-noir-t3 text-[10px] tracking-[0.2em] font-medium uppercase mb-3">Márgenes calculados</p>
        {[
          { l: 'Material sahumerio',   v: formatARS(matSah) },
          { l: 'MO sahumerio',         v: formatARS(config.mo_sahumerio) },
          { l: 'Margen minorista',     v: `${margenMin}%` },
          { l: 'Margen pack x8 (ud)', v: `${margenPack}%` },
          { l: 'Margen difusor',       v: `${margenDif}%` },
        ].map((r, i, arr) => (
          <div key={r.l}>
            <div className="flex justify-between text-[12px] py-2.5">
              <span className="text-noir-t2 font-light">{r.l}</span>
              <span className="font-semibold text-noir-t1">{r.v}</span>
            </div>
            {i < arr.length - 1 && <div className="sep-thin" />}
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gold hover:bg-gold-dim text-white font-semibold rounded-xl h-12 text-sm"
      >
        {saving ? 'Guardando...' : error ? 'Error al guardar' : saved ? 'Guardado' : <><Save size={14} className="mr-2" />Guardar cambios</>}
      </Button>

      {/* ── Zona de peligro ── */}
      <div className="mt-8 pt-6 border-t border-black/[0.06]">
        <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Zona de peligro</p>
        <button
          onClick={() => setResetStep(1)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-terra/25 text-terra hover:bg-terra/5 transition-luxury cursor-pointer bg-transparent"
        >
          <div className="text-left">
            <p className="text-[13px] font-semibold">Borrar todos los datos</p>
            <p className="text-[11px] text-terra/70 font-light mt-0.5">Ventas, compras, retiros y stock</p>
          </div>
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
    </>
  );
}
