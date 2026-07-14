'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAlmaStore } from './store';
import { formatARS, VARIANTES_SAH, VARIANTES_DIF, CANALES } from './lib';
import { Check, ArrowLeft, Plus, Minus, Sparkles, CarFront } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Config {
  sahumerio_venta: number; pack8_venta: number; difusor_venta: number;
  sahumerio_costo: number; difusor_costo: number; mo_sahumerio: number; mo_difusor: number;
}

const DEFAULT_CONFIG: Config = {
  sahumerio_venta: 400, pack8_venta: 2800, difusor_venta: 1200,
  sahumerio_costo: 375, difusor_costo: 320, mo_sahumerio: 175, mo_difusor: 0,
};

const slideIn = { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 } };

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto: isSah ? 'sahumerio' : 'difusor',
          tipo: isSah ? (esPack ? 'pack8' : 'suelto') : 'unidad',
          variante, cantidad, precioUnitario: precioU, total,
          costoUnitario: costoU, ganancia, manoDeObra: moVenta, canal,
        }),
      });
      refreshDashboard();
      setStep(5);
    } catch { /* empty */ }
    setSubmitting(false);
  };

  // Success
  if (step === 5) {
    return (
      <div className="max-w-md mx-auto px-5 pt-10 pb-24 lg:px-8 lg:pt-12 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-16 h-16 rounded-2xl bg-noir-sage/10 border border-noir-sage/20 flex items-center justify-center mb-6"
        >
          <Check size={28} strokeWidth={2.5} className="text-noir-sage" />
        </motion.div>
        <h2 className="text-xl font-black text-noir-t1 mb-1">Venta registrada</h2>
        <p className="text-noir-t2 text-sm font-light mb-6">{cantidad} × {variante}</p>
        <div className="w-full card-glass rounded-2xl p-5 mb-6 text-left space-y-3">
          {[
            { l: 'Total', v: formatARS(total), c: 'text-gold' },
            { l: 'Costo material', v: formatARS(cantidad * (costoU - moU)), c: 'text-noir-t1' },
            ...(isSah ? [{ l: 'Mano de obra', v: formatARS(moVenta), c: 'text-noir-ice' }] : []),
            { l: 'Ganancia', v: formatARS(ganancia), c: 'text-noir-sage' },
          ].map((r) => (
            <div key={r.l} className="flex justify-between text-[13px]">
              <span className="text-noir-t2 font-light">{r.l}</span>
              <span className={`font-semibold ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>
        <Button onClick={() => { reset(); onBack(); }} className="w-full bg-gold hover:bg-gold-dim text-noir-bg font-semibold rounded-xl h-12 text-sm tracking-wide">
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-28 lg:px-8 lg:pt-12 lg:pb-8">
      <button onClick={() => step > 1 ? setStep(step - 1) : onBack()} className="text-noir-t3 text-[12px] mb-6 flex items-center gap-1.5 hover:text-noir-t2 transition-luxury font-light">
        <ArrowLeft size={14} /> Volver
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1,2,3,4].map(s => (
          <div key={s} className="flex-1 h-[1.5px] rounded-full transition-all duration-500" style={{
            background: s <= step ? 'linear-gradient(90deg, #C8A45C, #9B7D3E)' : '#1F1F2C',
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 - Product */}
        {step === 1 && (
          <motion.div key="s1" {...slideIn} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-4">Producto</p>
            <div className="space-y-2.5">
              {[
                { k: 'sah' as const, icon: Sparkles, nombre: 'Sahumerios', desc: `${VARIANTES_SAH.length} fragancias · ${formatARS(config.sahumerio_venta)}/u` },
                { k: 'dif' as const, icon: CarFront, nombre: 'Difusores auto', desc: `${VARIANTES_DIF.length} fragancias · ${formatARS(config.difusor_venta)}/u` },
              ].map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.k}
                    onClick={() => { setProdKey(p.k); setStep(2); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl card-glass hover:border-gold/20 transition-luxury cursor-pointer text-left group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gold-soft flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-luxury">
                      <Icon size={18} strokeWidth={1.5} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-noir-t1">{p.nombre}</p>
                      <p className="text-[11px] text-noir-t3 font-light mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* STEP 2 - Variant */}
        {step === 2 && (
          <motion.div key="s2" {...slideIn} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-4">Fragancia</p>
            {isSah && (
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setEsPack(false)}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border cursor-pointer transition-luxury ${
                    !esPack ? 'bg-gold/10 border-gold/30 text-gold' : 'border-noir-border text-noir-t2 hover:border-noir-t3'
                  }`}
                >
                  Suelto · {formatARS(config.sahumerio_venta)}
                </button>
                <button
                  onClick={() => setEsPack(true)}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border cursor-pointer transition-luxury ${
                    esPack ? 'bg-gold/10 border-gold/30 text-gold' : 'border-noir-border text-noir-t2 hover:border-noir-t3'
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
                  className="py-2.5 px-3 rounded-xl text-[12px] font-light border border-noir-border text-noir-t1 hover:border-gold/30 hover:text-gold transition-luxury cursor-pointer text-center"
                >
                  {v}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3 - Qty + Channel */}
        {step === 3 && (
          <motion.div key="s3" {...slideIn} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-5">Cantidad</p>
            <div className="flex items-center justify-center gap-8 mb-4">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-12 h-12 rounded-full border border-noir-border text-noir-t1 flex items-center justify-center cursor-pointer hover:border-gold/30 transition-luxury bg-transparent"
              >
                <Minus size={18} strokeWidth={1.5} />
              </button>
              <span className="text-5xl font-black text-gold-gradient tracking-[-0.04em] w-20 text-center tabular-nums">{cantidad}</span>
              <button
                onClick={() => setCantidad(cantidad + 1)}
                className="w-12 h-12 rounded-full bg-gold text-noir-bg flex items-center justify-center cursor-pointer hover:bg-gold-dim transition-luxury border-none"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex gap-1.5 justify-center flex-wrap mb-8">
              {[5, 10, 20, 50, 100].map(n => (
                <button
                  key={n}
                  onClick={() => setCantidad(n)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer transition-luxury ${
                    cantidad === n ? 'bg-gold/10 border-gold/30 text-gold' : 'border-noir-border text-noir-t3 hover:text-noir-t2'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Live breakdown */}
            <div className="card-glass rounded-2xl p-4 mb-8">
              <p className="text-noir-t3 text-[10px] tracking-[0.2em] font-medium uppercase mb-3">Desglose en vivo</p>
              {[
                { l: 'Total', v: formatARS(total), c: 'text-gold' },
                { l: 'Costo material', v: formatARS(cantidad * (costoU - moU)), c: 'text-noir-t1' },
                ...(isSah ? [{ l: 'Mano de obra', v: formatARS(moVenta), c: 'text-noir-ice' }] : []),
                { l: 'Ganancia', v: formatARS(ganancia), c: 'text-noir-sage' },
              ].map((r) => (
                <div key={r.l} className="flex justify-between text-[12px] mb-1.5 last:mb-0">
                  <span className="text-noir-t2 font-light">{r.l}</span>
                  <span className={`font-semibold ${r.c}`}>{r.v}</span>
                </div>
              ))}
            </div>

            <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Canal</p>
            <div className="space-y-1.5 mb-6">
              {CANALES.map(c => (
                <button
                  key={c}
                  onClick={() => setCanal(c)}
                  className={`w-full p-3.5 rounded-xl text-[13px] text-left cursor-pointer border transition-luxury ${
                    canal === c ? 'bg-gold/5 border-gold/30 text-gold font-medium' : 'border-noir-border text-noir-t2 font-light hover:border-noir-t3'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button
              onClick={() => { if (canal) setStep(4); }}
              disabled={!canal}
              className="w-full bg-gold hover:bg-gold-dim disabled:bg-noir-border disabled:text-noir-t3 text-noir-bg font-semibold rounded-xl h-12 text-sm"
            >
              Continuar
            </Button>
          </motion.div>
        )}

        {/* STEP 4 - Confirm */}
        {step === 4 && (
          <motion.div key="s4" {...slideIn} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-4">Confirmar venta</p>
            <div className="card-glass rounded-2xl p-0 mb-5">
              {[
                { l: 'Producto', v: isSah ? 'Sahumerio' : 'Difusor auto' },
                { l: 'Tipo', v: isSah ? (esPack ? 'Pack x8' : 'Suelto') : '—' },
                { l: 'Fragancia', v: variante || '' },
                { l: 'Cantidad', v: `${cantidad} uds` },
                { l: 'Canal', v: canal || '' },
              ].map((r, i, arr) => (
                <div key={r.l}>
                  <div className="flex justify-between px-5 py-3">
                    <span className="text-[12px] text-noir-t2 font-light">{r.l}</span>
                    <span className="text-[13px] text-noir-t1 font-medium">{r.v}</span>
                  </div>
                  {i < arr.length - 1 && <div className="sep-thin mx-5" />}
                </div>
              ))}
              <div className="bg-noir-surface/50">
                <div className="sep-thin mx-5" />
                <div className="px-5 py-3 space-y-1.5">
                  {[
                    { l: 'Total', v: formatARS(total), c: 'text-gold' },
                    { l: 'Costo material', v: formatARS(cantidad * (costoU - moU)), c: 'text-noir-t1' },
                    ...(isSah ? [{ l: 'Mano de obra', v: formatARS(moVenta), c: 'text-noir-ice' }] : []),
                    { l: 'Ganancia', v: formatARS(ganancia), c: 'text-noir-sage' },
                  ].map((r) => (
                    <div key={r.l} className="flex justify-between text-[12px]">
                      <span className="text-noir-t2 font-light">{r.l}</span>
                      <span className={`font-semibold ${r.c}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-noir-border mx-0 px-5 py-4 flex justify-between items-baseline">
                  <span className="text-[13px] font-medium text-noir-t1">Total</span>
                  <span className="text-2xl font-black text-gold-gradient tracking-[-0.02em]">{formatARS(total)}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gold hover:bg-gold-dim text-noir-bg font-semibold rounded-xl h-12 text-sm mb-2"
            >
              {submitting ? 'Registrando...' : 'Confirmar venta'}
            </Button>
            <button onClick={() => setStep(3)} className="w-full text-noir-t3 text-[12px] py-2 cursor-pointer hover:text-noir-t2 bg-transparent border-none font-light">
              Editar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}