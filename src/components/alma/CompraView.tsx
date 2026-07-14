'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAlmaStore } from './store';
import { formatARS } from './lib';
import { Check, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const UNIDADES = ['uds', 'kg', 'lts', 'grs', 'ml'];

export function CompraView({ onBack }: { onBack: () => void }) {
  const { refreshDashboard } = useAlmaStore();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    proveedor: '',
    insumo: '',
    cantidad: '',
    unidadMedida: 'uds',
    costoUnitario: '',
    observaciones: '',
  });

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
      <div className="max-w-lg mx-auto px-4 pt-8 lg:ml-56 flex flex-col items-center justify-center min-h-[80vh] text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center text-3xl mb-6"
          style={{ boxShadow: '0 0 40px rgba(74, 222, 128, 0.2)' }}
        >
          <Check size={36} strokeWidth={3} className="text-green-400" />
        </motion.div>
        <h2 className="text-2xl font-extrabold text-alma-t1 mb-1">Compra registrada</h2>
        <p className="text-alma-t2 text-sm mb-2">{form.insumo}</p>
        <p className="text-3xl font-black text-green-400 tracking-tighter">{formatARS(total)}</p>
        <div className="mt-8 w-full">
          <Button onClick={() => { setDone(false); setForm({ proveedor: '', insumo: '', cantidad: '', unidadMedida: 'uds', costoUnitario: '', observaciones: '' }); }} className="w-full bg-terra hover:bg-terra-light text-white font-bold rounded-xl h-12">
            Registrar otra compra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 lg:ml-56 pb-24">
      <button onClick={onBack} className="text-alma-t3 text-sm mb-4 flex items-center gap-1 hover:text-alma-t2 transition-smooth">
        <ChevronLeft size={16} /> Volver
      </button>
      <h2 className="text-xl font-extrabold text-alma-t1 mb-6">Registrar compra</h2>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div>
          <Label className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1.5 block">PROVEEDOR</Label>
          <Input
            placeholder="Nombre del proveedor"
            value={form.proveedor}
            onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
            className="bg-alma-surface border-alma-border text-alma-t1 placeholder:text-alma-t3 rounded-xl h-12"
          />
        </div>

        <div>
          <Label className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1.5 block">INSUMO</Label>
          <Input
            placeholder="Ej: Esencia Vainilla"
            value={form.insumo}
            onChange={e => setForm(f => ({ ...f, insumo: e.target.value }))}
            className="bg-alma-surface border-alma-border text-alma-t1 placeholder:text-alma-t3 rounded-xl h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1.5 block">CANTIDAD</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.cantidad}
              onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
              className="bg-alma-surface border-alma-border text-alma-t1 placeholder:text-alma-t3 rounded-xl h-12"
            />
          </div>
          <div>
            <Label className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1.5 block">UNIDAD</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {UNIDADES.map(u => (
                <button
                  key={u}
                  onClick={() => setForm(f => ({ ...f, unidadMedida: u }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-smooth ${
                    form.unidadMedida === u ? 'bg-terra border-terra text-white' : 'bg-alma-surface border-alma-border text-alma-t2'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1.5 block">COSTO UNITARIO ($)</Label>
          <Input
            type="number"
            placeholder="0"
            value={form.costoUnitario}
            onChange={e => setForm(f => ({ ...f, costoUnitario: e.target.value }))}
            className="bg-alma-surface border-alma-border text-terra-light placeholder:text-alma-t3 rounded-xl h-12 font-bold text-lg"
          />
        </div>

        {total > 0 && (
          <Card className="bg-alma-card border-alma-border">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="text-sm text-alma-t2">Total estimado</span>
              <span className="text-xl font-black text-terra-light">{formatARS(total)}</span>
            </CardContent>
          </Card>
        )}

        <div>
          <Label className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1.5 block">NOTAS (opcional)</Label>
          <Input
            placeholder="Observaciones..."
            value={form.observaciones}
            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
            className="bg-alma-surface border-alma-border text-alma-t1 placeholder:text-alma-t3 rounded-xl h-12"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!form.proveedor || !form.insumo || !cantidad || !costoU || submitting}
          className="w-full bg-terra hover:bg-terra-light disabled:bg-alma-border disabled:text-alma-t3 text-white font-bold rounded-xl h-12"
        >
          {submitting ? 'Registrando...' : '✓ Registrar compra'}
        </Button>
      </motion.div>
    </div>
  );
}