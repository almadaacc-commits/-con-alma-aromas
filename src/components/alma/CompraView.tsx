'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAlmaStore } from './store';
import { formatARS } from './lib';
import { Check, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const UNIDADES = ['uds', 'kg', 'lts', 'grs', 'ml'];

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  highlight?: boolean;
}

function Field({ label, placeholder, value, onChange, type = 'text', highlight = false }: FieldProps) {
  return (
    <div className="mb-5">
      <label className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase block mb-2">
        {label}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`bg-noir-surface border-noir-border placeholder:text-noir-t3/60 rounded-xl h-12 text-[13px] font-light ${
          highlight ? 'text-gold font-semibold text-lg' : 'text-noir-t1'
        }`}
      />
    </div>
  );
}

interface FormState {
  proveedor: string;
  insumo: string;
  cantidad: string;
  unidadMedida: string;
  costoUnitario: string;
  observaciones: string;
}

const FORM_INIT: FormState = {
  proveedor: '', insumo: '', cantidad: '', unidadMedida: 'uds',
  costoUnitario: '', observaciones: '',
};

export function CompraView({ onBack }: { onBack: () => void }) {
  const { refreshDashboard } = useAlmaStore();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_INIT);

  const set = (k: keyof FormState) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const cantidad = parseFloat(form.cantidad) || 0;
  const costoU = parseFloat(form.costoUnitario) || 0;
  const total = cantidad * costoU;

  const handleSubmit = async () => {
    if (!form.proveedor || !form.insumo || !cantidad || !costoU) return;
    setSubmitting(true);
    try {
      await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor: form.proveedor,
          insumo: form.insumo,
          cantidad,
          unidadMedida: form.unidadMedida,
          costoUnitario: costoU,
          total,
          observaciones: form.observaciones || null,
        }),
      });
      refreshDashboard();
      setDone(true);
    } catch { /* empty */ }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto px-5 pt-10 pb-24 lg:px-8 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-16 h-16 rounded-2xl bg-sage/10 border border-sage/25 flex items-center justify-center mb-6 relief"
        >
          <Check size={28} strokeWidth={2.5} className="text-sage" />
        </motion.div>
        <h2 className="text-xl font-black text-noir-t1 mb-1">Compra registrada</h2>
        <p className="text-noir-t2 text-sm font-light mb-1">{form.insumo}</p>
        <p className="text-3xl font-black text-sage tracking-tight mt-2">{formatARS(total)}</p>
        <div className="mt-8 w-full">
          <Button
            onClick={() => { setDone(false); setForm(FORM_INIT); }}
            className="w-full bg-gold hover:bg-gold-dim text-alma-bg font-semibold rounded-xl h-12 text-sm"
          >
            Registrar otra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-28 lg:px-8 lg:pt-12">
      <button
        onClick={onBack}
        className="text-noir-t3 text-[12px] mb-6 flex items-center gap-1.5 hover:text-noir-t2 transition-luxury font-light"
      >
        <ArrowLeft size={14} /> Volver
      </button>
      <h2 className="text-xl font-black text-noir-t1 mb-1">Registrar compra</h2>
      <p className="text-noir-t3 text-[12px] font-light mb-6">Ingresá los datos del insumo</p>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Field label="Proveedor" placeholder="Nombre del proveedor" value={form.proveedor} onChange={set('proveedor')} />
        <Field label="Insumo"    placeholder="Ej: Esencia Vainilla"  value={form.insumo}    onChange={set('insumo')} />

        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Cantidad */}
          <div>
            <label className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase block mb-2">Cantidad</label>
            <Input
              type="number"
              placeholder="0"
              value={form.cantidad}
              onChange={e => set('cantidad')(e.target.value)}
              className="bg-noir-surface border-noir-border text-noir-t1 placeholder:text-noir-t3/60 rounded-xl h-12 text-[13px] font-light"
            />
          </div>

          {/* Unidad */}
          <div>
            <label className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase block mb-2">Unidad</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {UNIDADES.map(u => (
                <button
                  key={u}
                  onClick={() => set('unidadMedida')(u)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border cursor-pointer transition-luxury ${
                    form.unidadMedida === u
                      ? 'bg-gold/10 border-gold/30 text-gold'
                      : 'border-noir-border text-noir-t3'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Costo */}
          <div>
            <label className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase block mb-2">Costo ($)</label>
            <Input
              type="number"
              placeholder="0"
              value={form.costoUnitario}
              onChange={e => set('costoUnitario')(e.target.value)}
              className="bg-noir-surface border-noir-border text-gold placeholder:text-noir-t3/60 rounded-xl h-12 text-[13px] font-semibold"
            />
          </div>
        </div>

        {total > 0 && (
          <div className="card-glass rounded-2xl p-4 flex justify-between items-center mb-5">
            <span className="text-[12px] text-noir-t2 font-light">Total estimado</span>
            <span className="text-xl font-black text-gold-gradient">{formatARS(total)}</span>
          </div>
        )}

        <Field
          label="Notas (opcional)"
          placeholder="Observaciones..."
          value={form.observaciones}
          onChange={set('observaciones')}
        />

        <Button
          onClick={handleSubmit}
          disabled={!form.proveedor || !form.insumo || !cantidad || !costoU || submitting}
          className="w-full bg-gold hover:bg-gold-dim disabled:bg-noir-border disabled:text-noir-t3 text-alma-bg font-semibold rounded-xl h-12 text-sm"
        >
          {submitting ? 'Registrando...' : 'Registrar compra'}
        </Button>
      </motion.div>
    </div>
  );
}
