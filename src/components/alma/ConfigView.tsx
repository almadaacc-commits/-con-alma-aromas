'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAlmaStore } from './store';
import { formatARS } from './lib';
import { ArrowLeft, Save } from 'lucide-react';

interface Config {
  sahumerio_venta: number; pack8_venta: number; difusor_venta: number;
  sahumerio_costo: number; difusor_costo: number; mo_sahumerio: number; mo_difusor: number;
}

const DEFAULTS: Config = {
  sahumerio_venta: 400, pack8_venta: 2800, difusor_venta: 1200,
  sahumerio_costo: 375, difusor_costo: 320, mo_sahumerio: 175, mo_difusor: 0,
};

export function ConfigView({ onBack }: { onBack: () => void }) {
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => {});
  }, []);

  const update = (key: keyof Config, value: number) => setConfig(c => ({ ...c, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* empty */ }
    setSaving(false);
  };

  const Campo = ({ label, key_ }: { label: string; key_: keyof Config }) => (
    <div className="mb-4">
      <label className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase block mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-noir-t3 font-medium">$</span>
        <Input type="number" value={config[key_]} onChange={e => update(key_, Number(e.target.value))}
          className="pl-8 bg-noir-surface border-noir-border text-gold font-semibold rounded-xl h-11 text-[14px]" />
      </div>
    </div>
  );

  const matSah = config.sahumerio_costo - config.mo_sahumerio;
  const margenMin = ((config.sahumerio_venta - config.sahumerio_costo) / config.sahumerio_venta * 100).toFixed(1);
  const margenPack = (((config.pack8_venta / 8) - config.sahumerio_costo) / (config.pack8_venta / 8) * 100).toFixed(1);
  const margenDif = ((config.difusor_venta - config.difusor_costo) / config.difusor_venta * 100).toFixed(1);

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-28 lg:px-8 lg:pt-12">
      <button onClick={onBack} className="text-noir-t3 text-[12px] mb-6 flex items-center gap-1.5 hover:text-noir-t2 transition-luxury font-light">
        <ArrowLeft size={14} /> Volver
      </button>
      <h2 className="text-xl font-black text-noir-t1 mb-1">Ajustes</h2>
      <p className="text-noir-t3 text-[12px] font-light mb-6">Precios y costos del negocio</p>

      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Precios de venta</p>
      <div className="card-glass rounded-2xl p-5 mb-5">
        <Campo label="Sahumerio suelto" key_="sahumerio_venta" />
        <Campo label="Pack x8" key_="pack8_venta" />
        <Campo label="Difusor auto" key_="difusor_venta" />
      </div>

      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Mano de obra</p>
      <div className="card-glass rounded-2xl p-5 mb-5">
        <Campo label="MO por sahumerio" key_="mo_sahumerio" />
        <div className="mb-4">
          <label className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase block mb-2">MO difusores</label>
          <div className="p-3 bg-noir-surface rounded-xl border border-noir-border">
            <span className="text-[13px] font-semibold text-noir-t3">$0</span>
            <span className="text-[11px] text-noir-t3 ml-2 font-light">Incluido en costo</span>
          </div>
        </div>
      </div>

      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Costo por producto</p>
      <div className="card-glass rounded-2xl p-5 mb-5">
        <Campo label="Costo sahumerio (insumos + pkg + MO)" key_="sahumerio_costo" />
        <Campo label="Costo difusor (insumos + packaging)" key_="difusor_costo" />
      </div>

      <div className="card-glass rounded-2xl p-5 mb-6">
        <p className="text-noir-t3 text-[10px] tracking-[0.2em] font-medium uppercase mb-3">Márgenes calculados</p>
        {[
          { l: 'Material sahumerio', v: formatARS(matSah) },
          { l: 'MO sahumerio', v: formatARS(config.mo_sahumerio) },
          { l: 'Margen minorista', v: `${margenMin}%` },
          { l: 'Margen pack x8 (ud)', v: `${margenPack}%` },
          { l: 'Margen difusor', v: `${margenDif}%` },
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

      <Button onClick={handleSave} disabled={saving}
        className="w-full bg-gold hover:bg-gold-dim text-noir-bg font-semibold rounded-xl h-12 text-sm">
        {saving ? 'Guardando...' : saved ? 'Guardado' : <><Save size={14} className="mr-2" />Guardar cambios</>}
      </Button>
    </div>
  );
}