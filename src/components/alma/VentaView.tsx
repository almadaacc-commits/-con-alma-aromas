'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlmaStore } from './store';
import { formatARS, VARIANTES_SAH, VARIANTES_DIF, CANALES } from './lib';
import { Check, ChevronLeft, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Config {
  sahumerio_venta: number; pack8_venta: number; difusor_venta: number;
  sahumerio_costo: number; difusor_costo: number; mo_sahumerio: number; mo_difusor: number;
}

const DEFAULT_CONFIG: Config = {
  sahumerio_venta: 400, pack8_venta: 2800, difusor_venta: 1200,
  sahumerio_costo: 375, difusor_costo: 320, mo_sahumerio: 175, mo_difusor: 0,
};

export function VentaView({ onBack }: { onBack: () => void }) {
  const { refreshDashboard } = useAlmaStore();
  const [step, setStep] = useState(1);
  const [prodKey, setProdKey] = useState<'sah' | 'dif' | null>(null);
  const [variante, setVariante] = useState<string | null>(null);
  const [esPack, setEsPack] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [canal, setCanal] = useState<string | null>(null);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => {});
  }, []);

  const isSah = prodKey === 'sah';
  const precioU = isSah ? (esPack ? config.pack8_venta : config.sahumerio_venta) : config.difusor_venta;
  const costoU = isSah ? config.sahumerio_costo : config.difusor_costo;
  const moU = isSah ? config.mo_sahumerio : 0;
  const total = cantidad * precioU;
  const ganancia = total - cantidad * costoU;
  const moVenta = cantidad * moU;

  const reset = () => {
    setStep(1); setProdKey(null); setVariante(null); setEsPack(false);
    setCantidad(1); setCanal(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto: isSah ? 'sahumerio' : 'difusor',
          tipo: isSah ? (esPack ? 'pack8' : 'suelto') : 'unidad',
          variante,
          cantidad,
          precioUnitario: precioU,
          total,
          costoUnitario: costoU,
          ganancia,
          manoDeObra: moVenta,
          canal,
        }),
      });
      refreshDashboard();
      setStep(5);
    } catch { /* empty */ }
    setSubmitting(false);
  };

  // Success screen
  if (step === 5) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 lg:ml-56 flex flex-col items-center justify-center min-h-[80vh] text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white terra-glow-sm mb-6"
          style={{ background: 'linear-gradient(135deg, #D4521A 0%, #F07040 100%)' }}
        >
          <Check size={36} strokeWidth={3} />
        </motion.div>
        <h2 className="text-2xl font-extrabold text-alma-t1 mb-1">Venta registrada</h2>
        <p className="text-alma-t2 text-sm mb-6">{cantidad} × {variante}</p>
        <Card className="bg-alma-card border-alma-border w-full mb-6">
          <CardContent className="p-4 space-y-3">
            {[
              { l: 'Total cobrado', v: formatARS(total), c: 'text-terra-light' },
              { l: 'Costo materiales', v: formatARS(cantidad * (costoU - moU)), c: 'text-alma-t1' },
              ...(isSah ? [{ l: 'Mano de obra', v: formatARS(moVenta), c: 'text-blue-400' }] : []),
              { l: 'Ganancia empresa', v: formatARS(ganancia), c: 'text-green-400' },
            ].map((r) => (
              <div key={r.l} className="flex justify-between text-sm">
                <span className="text-alma-t2">{r.l}</span>
                <span className={`font-bold ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Button onClick={() => { reset(); onBack(); }} className="w-full bg-terra hover:bg-terra-light text-white font-bold rounded-xl h-12">
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 lg:ml-56 pb-24">
      <button onClick={() => step > 1 ? setStep(step - 1) : onBack()} className="text-alma-t3 text-sm mb-4 flex items-center gap-1 hover:text-alma-t2 transition-smooth">
        <ChevronLeft size={16} /> Volver
      </button>
      <h2 className="text-xl font-extrabold text-alma-t1 mb-4">Registrar venta</h2>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex-1 h-0.5 rounded-full transition-all duration-300" style={{
            background: s <= step ? 'linear-gradient(90deg, #D4521A, #F07040)' : '#2E1E0F',
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 - Product */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-3">¿QUÉ PRODUCTO?</p>
            <div className="space-y-2.5">
              {[
                { k: 'sah' as const, icon: '🌿', nombre: 'Sahumerios', desc: `${VARIANTES_SAH.length} fragancias · ${formatARS(config.sahumerio_venta)}/u` },
                { k: 'dif' as const, icon: '🚗', nombre: 'Difusores auto', desc: `${VARIANTES_DIF.length} fragancias · ${formatARS(config.difusor_venta)}/u` },
              ].map(p => (
                <button
                  key={p.k}
                  onClick={() => { setProdKey(p.k); setStep(2); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-alma-card border border-alma-border hover:border-terra transition-smooth cursor-pointer text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-alma-surface flex items-center justify-center text-2xl shrink-0">{p.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-alma-t1">{p.nombre}</p>
                    <p className="text-xs text-alma-t2 mt-0.5">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2 - Variant */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-3">FRAGANCIA</p>
            {isSah && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setEsPack(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-smooth cursor-pointer ${
                    !esPack ? 'bg-terra border-terra text-white' : 'bg-transparent border-alma-border text-alma-t2'
                  }`}
                >
                  Suelto · {formatARS(config.sahumerio_venta)}
                </button>
                <button
                  onClick={() => setEsPack(true)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-smooth cursor-pointer ${
                    esPack ? 'bg-terra border-terra text-white' : 'bg-transparent border-alma-border text-alma-t2'
                  }`}
                >
                  Pack x8 · {formatARS(config.pack8_venta)}
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {(isSah ? VARIANTES_SAH : VARIANTES_DIF).map(v => (
                <button
                  key={v}
                  onClick={() => { setVariante(v); setStep(3); }}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold border border-alma-border bg-alma-card text-alma-t1 hover:border-terra hover:bg-terra/10 transition-smooth cursor-pointer text-center"
                >
                  {v}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3 - Qty + Channel */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-3">CANTIDAD</p>
            <div className="flex items-center justify-center gap-6 mb-3">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-12 h-12 rounded-full bg-alma-surface border border-alma-border text-alma-t1 flex items-center justify-center cursor-pointer hover:border-terra transition-smooth"
              >
                <Minus size={20} />
              </button>
              <span className="text-5xl font-black text-terra-gradient tracking-tighter w-20 text-center">{cantidad}</span>
              <button
                onClick={() => setCantidad(cantidad + 1)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer terra-glow-sm"
                style={{ background: 'linear-gradient(135deg, #D4521A 0%, #F07040 100%)' }}
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex gap-1.5 justify-center flex-wrap mb-5">
              {[5, 10, 20, 50, 100].map(n => (
                <button
                  key={n}
                  onClick={() => setCantidad(n)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-smooth ${
                    cantidad === n ? 'bg-terra border-terra text-white' : 'bg-alma-surface border-alma-border text-alma-t2'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Live breakdown */}
            <Card className="bg-alma-card border-alma-border mb-5">
              <CardContent className="p-4">
                <p className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-3">DESGLOSE EN VIVO</p>
                {[
                  { l: 'Total', v: formatARS(total), c: 'text-terra-light' },
                  { l: 'Costo material', v: formatARS(cantidad * (costoU - moU)), c: 'text-alma-t1' },
                  ...(isSah ? [{ l: 'Mano de obra', v: formatARS(moVenta), c: 'text-blue-400' }] : []),
                  { l: 'Ganancia', v: formatARS(ganancia), c: 'text-green-400' },
                ].map((r) => (
                  <div key={r.l} className="flex justify-between text-sm mb-1.5 last:mb-0">
                    <span className="text-alma-t2">{r.l}</span>
                    <span className={`font-bold ${r.c}`}>{r.v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-3">CANAL</p>
            <div className="space-y-2 mb-5">
              {CANALES.map(c => (
                <button
                  key={c}
                  onClick={() => setCanal(c)}
                  className={`w-full p-3.5 rounded-xl text-sm font-semibold text-left cursor-pointer border transition-smooth ${
                    canal === c ? 'bg-terra border-terra text-white' : 'bg-alma-card border-alma-border text-alma-t1 hover:border-terra'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button
              onClick={() => { if (canal) setStep(4); }}
              disabled={!canal}
              className="w-full bg-terra hover:bg-terra-light disabled:bg-alma-border disabled:text-alma-t3 text-white font-bold rounded-xl h-12"
            >
              Continuar →
            </Button>
          </motion.div>
        )}

        {/* STEP 4 - Confirm */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-3">CONFIRMÁ LA VENTA</p>
            <Card className="bg-alma-card border-alma-border mb-4">
              <CardContent className="p-0">
                {[
                  { l: 'Producto', v: isSah ? 'Sahumerio' : 'Difusor auto' },
                  { l: 'Tipo', v: isSah ? (esPack ? 'Pack x8' : 'Suelto') : '—' },
                  { l: 'Fragancia', v: variante || '' },
                  { l: 'Cantidad', v: `${cantidad} uds` },
                  { l: 'Canal', v: canal || '' },
                  { l: 'Precio unit.', v: formatARS(precioU) },
                ].map((r, i, arr) => (
                  <div key={r.l}>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-xs text-alma-t2">{r.l}</span>
                      <span className="text-sm font-semibold text-alma-t1">{r.v}</span>
                    </div>
                    {i < arr.length - 1 && <div className="h-px bg-alma-border mx-4" />}
                  </div>
                ))}
                <div className="bg-alma-surface">
                  <div className="h-px bg-alma-border" />
                  <div className="px-4 py-3">
                    <p className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-2">DESGLOSE</p>
                    {[
                      { l: 'Total', v: formatARS(total), c: 'text-terra-light' },
                      { l: 'Costo material', v: formatARS(cantidad * (costoU - moU)), c: 'text-alma-t1' },
                      ...(isSah ? [{ l: 'Mano de obra', v: formatARS(moVenta), c: 'text-blue-400' }] : []),
                      { l: 'Ganancia', v: formatARS(ganancia), c: 'text-green-400' },
                    ].map((r) => (
                      <div key={r.l} className="flex justify-between text-xs mb-1">
                        <span className="text-alma-t2">{r.l}</span>
                        <span className={`font-bold ${r.c}`}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-alma-border px-4 py-3 flex justify-between">
                    <span className="text-sm font-bold text-alma-t1">TOTAL</span>
                    <span className="text-xl font-black text-terra-light">{formatARS(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-terra hover:bg-terra-light text-white font-bold rounded-xl h-12 mb-2"
            >
              {submitting ? 'Registrando...' : '✓ Confirmar venta'}
            </Button>
            <button onClick={() => setStep(3)} className="w-full text-alma-t3 text-sm py-2 cursor-pointer hover:text-alma-t2 bg-transparent border-none">
              ← Editar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}