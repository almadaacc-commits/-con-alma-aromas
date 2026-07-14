'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAlmaStore } from './store';
import { formatARS } from './lib';
import { ChevronLeft, Save } from 'lucide-react';

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

  const update = (key: keyof Config, value: number) => {
    setConfig(c => ({ ...c, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* empty */ }
    setSaving(false);
  };

  const matSah = config.sahumerio_costo - config.mo_sahumerio;
  const margenMin = ((config.sahumerio_venta - config.sahumerio_costo) / config.sahumerio_venta * 100).toFixed(1);
  const margenPack = (((config.pack8_venta / 8) - config.sahumerio_costo) / (config.pack8_venta / 8) * 100).toFixed(1);
  const margenDif = ((config.difusor_venta - config.difusor_costo) / config.difusor_venta * 100).toFixed(1);

  const Campo = ({ label, key_ }: { label: string; key_: keyof Config }) => (
    <div className="mb-4">
      <Label className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1.5 block">{label}</Label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-alma-t3 font-semibold">$</span>
        <Input
          type="number"
          value={config[key_]}
          onChange={e => update(key_, Number(e.target.value))}
          className="pl-8 bg-alma-surface border-alma-border text-terra-light font-bold rounded-xl h-12"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 lg:ml-56 pb-24">
      <button onClick={onBack} className="text-alma-t3 text-sm mb-4 flex items-center gap-1 hover:text-alma-t2 transition-smooth">
        <ChevronLeft size={16} /> Volver
      </button>
      <h2 className="text-xl font-extrabold text-alma-t1 mb-1">Configuración</h2>
      <p className="text-alma-t2 text-xs mb-6">Actualizá precios cuando cambien los costos</p>

      {/* Precios de venta */}
      <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-3">PRECIOS DE VENTA</p>
      <Card className="bg-alma-card border-alma-border p-4 mb-5">
        <Campo label="Sahumerio suelto" key_="sahumerio_venta" />
        <Campo label="Pack x8 con packaging" key_="pack8_venta" />
        <Campo label="Difusor auto" key_="difusor_venta" />
      </Card>

      {/* MO */}
      <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-3">MANO DE OBRA</p>
      <Card className="bg-alma-card border-alma-border p-4 mb-5">
        <Campo label="MO por sahumerio" key_="mo_sahumerio" />
        <div className="mb-4">
          <Label className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1.5 block">MO DIFUSORES</Label>
          <div className="p-3 bg-alma-surface rounded-xl border border-alma-border">
            <span className="text-sm font-bold text-alma-t3">$0</span>
            <span className="text-[11px] text-alma-t3 ml-2">Incluido en costo</span>
          </div>
        </div>
      </Card>

      {/* Costos */}
      <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-3">COSTO TOTAL POR PRODUCTO</p>
      <Card className="bg-alma-card border-alma-border p-4 mb-5">
        <Campo label="Costo sahumerio (insumos+pkg+MO)" key_="sahumerio_costo" />
        <Campo label="Costo difusor (insumos+packaging)" key_="difusor_costo" />
      </Card>

      {/* Calculated breakdown */}
      <Card className="bg-alma-card border-alma-border p-4 mb-6">
        <p className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-3">DESGLOSE CALCULADO</p>
        {[
          { l: 'Costo material sahumerio', v: formatARS(matSah) },
          { l: 'Mano de obra sahumerio', v: formatARS(config.mo_sahumerio) },
          { l: 'Margen minorista', v: `${margenMin}%` },
          { l: 'Margen pack x8 (por u)', v: `${margenPack}%` },
          { l: 'Margen difusor', v: `${margenDif}%` },
        ].map((r, i, arr) => (
          <div key={r.l}>
            <div className="flex justify-between text-xs py-2">
              <span className="text-alma-t2">{r.l}</span>
              <span className="font-bold text-alma-t1">{r.v}</span>
            </div>
            {i < arr.length - 1 && <div className="h-px bg-alma-border" />}
          </div>
        ))}
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-terra hover:bg-terra-light text-white font-bold rounded-xl h-12"
      >
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : <><Save size={16} className="mr-2" />Guardar cambios</>}
      </Button>
    </div>
  );
}