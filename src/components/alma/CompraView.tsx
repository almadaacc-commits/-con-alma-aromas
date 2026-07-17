'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAlmaStore } from './store';
import { formatARS } from './lib';
import { Check, ArrowLeft, Mic, MicOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Parser de voz para compras ── */
function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function parsearCompraVoz(texto: string): Partial<FormState> {
  const t = norm(texto);
  const result: Partial<FormState> = {};

  // Cantidad + unidad (ej: "500 gramos", "2 kilos", "10 unidades")
  const numMatch = t.match(/(\d+(?:[,.]\d+)?)\s*(kilos?|kg|litros?|lts?|gramos?|grs?|mililitros?|ml|unidades?|uds?)?/);
  if (numMatch) {
    result.cantidad = numMatch[1].replace(',', '.');
    const u = (numMatch[2] || '').toLowerCase();
    if (u.startsWith('kilo') || u === 'kg')               result.unidadMedida = 'kg';
    else if (u.startsWith('litro') || u.startsWith('lt')) result.unidadMedida = 'lts';
    else if (u.startsWith('gramo') || u.startsWith('gr')) result.unidadMedida = 'grs';
    else if (u === 'ml' || u.startsWith('mililit'))       result.unidadMedida = 'ml';
    else if (u.startsWith('unidad') || u.startsWith('ud')) result.unidadMedida = 'uds';
  }

  // Costo (ej: "a 1500", "costo 800", "precio 2000 pesos")
  const costoMatch = t.match(/(?:a\s+|costo\s+|precio\s+)(\d+(?:[,.]?\d+)?)\s*(?:pesos?)?/);
  if (costoMatch) result.costoUnitario = costoMatch[1].replace(',', '');

  // Proveedor (ej: "proveedor Aromas del Mundo")
  const provMatch = t.match(/proveedor\s+([a-záéíóúñ\s]+?)(?:\s*,|\s*a\s+\d|\s*costo|\s*precio|$)/);
  if (provMatch) result.proveedor = provMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase());

  // Insumo — lo que viene después de la cantidad/unidad y "de"
  const insumoMatch = t.match(/\d+[^\s]*\s+(?:kilos?|kg|litros?|lts?|gramos?|grs?|ml|unidades?|uds?)?\s*(?:de\s+)?([\wáéíóúñ\s]+?)(?:\s*,|\s*proveedor|\s*a\s+\d|\s*costo|\s*precio|$)/);
  if (insumoMatch) {
    const raw = insumoMatch[1].trim();
    if (raw.length > 2) result.insumo = raw.replace(/\b\w/g, c => c.toUpperCase());
  }

  return result;
}

/* ── Overlay de voz para compras ── */
function VozCompraOverlay({
  onConfirmar,
  onCerrar,
}: {
  onConfirmar: (data: Partial<FormState>) => void;
  onCerrar: () => void;
}) {
  const [escuchando, setEscuchando] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [resultado, setResultado]   = useState<Partial<FormState> | null>(null);
  const [soportado, setSoportado]   = useState(true);
  const recogRef     = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSoportado(false);
  }, []);

  const iniciar = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'es-AR'; r.continuous = true; r.interimResults = true;
    r.onstart  = () => { setEscuchando(true); transcriptRef.current = ''; };
    r.onend    = () => {
      setEscuchando(false);
      if (transcriptRef.current) setResultado(parsearCompraVoz(transcriptRef.current));
    };
    r.onresult = (e: any) => {
      let final = ''; let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      const txt = (final + interim).trim();
      transcriptRef.current = final.trim() || txt;
      setTranscript(txt);
    };
    recogRef.current = r;
    r.start();
  };
  const detener   = () => recogRef.current?.stop();
  const reiniciar = () => { setTranscript(''); setResultado(null); transcriptRef.current = ''; };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(245,240,232,0.96)', backdropFilter: 'blur(20px)' }}
    >
      <button onClick={onCerrar} className="absolute top-6 right-6 text-noir-t3 hover:text-noir-t1 transition-luxury bg-transparent border-none cursor-pointer">
        <X size={22} />
      </button>
      <p className="text-noir-t3 text-[10px] tracking-[0.35em] uppercase mb-2">Dictar compra</p>
      <p className="text-noir-t3 text-[11px] font-light mb-8 text-center max-w-xs">
        Ej: "500 gramos de esencia vainilla, proveedor Mundo Aromas, a 1500 pesos"
      </p>

      {!soportado ? (
        <p className="text-noir-t1 text-center font-light">Usá Chrome o Safari para esta función</p>
      ) : !resultado ? (
        <>
          <motion.button
            onPointerDown={iniciar} onPointerUp={detener} onPointerLeave={detener}
            whileTap={{ scale: 0.93 }}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-luxury cursor-pointer border-2 ${
              escuchando
                ? 'border-terra bg-terra/15 shadow-[0_0_48px_rgba(196,98,45,0.25)]'
                : 'border-gold/40 bg-gold/8'
            }`}
          >
            {escuchando
              ? <MicOff size={38} strokeWidth={1.5} className="text-terra" />
              : <Mic    size={38} strokeWidth={1.5} className="text-gold" />
            }
          </motion.button>
          <p className="text-noir-t2 text-[12px] mt-5 font-light text-center">
            {escuchando ? 'Escuchando — soltá cuando termines' : 'Mantené presionado para hablar'}
          </p>
          {transcript && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 card-glass rounded-2xl p-4 max-w-sm w-full text-center">
              <p className="text-noir-t1 text-[13px] font-light italic">"{transcript}"</p>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-4 text-center">Lo que entendí</p>
          <div className="card-glass rounded-2xl p-4 mb-4 space-y-3">
            {[
              { l: 'Insumo',    v: resultado.insumo        || '— no detectado' },
              { l: 'Proveedor', v: resultado.proveedor      || '— no detectado' },
              { l: 'Cantidad',  v: resultado.cantidad ? `${resultado.cantidad} ${resultado.unidadMedida || 'uds'}` : '— no detectado' },
              { l: 'Costo/u',  v: resultado.costoUnitario  ? `$${resultado.costoUnitario}` : '— no detectado' },
            ].map(r => (
              <div key={r.l} className="flex justify-between text-[12px]">
                <span className="text-noir-t3 font-light">{r.l}</span>
                <span className={`font-medium ${r.v.startsWith('—') ? 'text-terra' : 'text-noir-t1'}`}>{r.v}</span>
              </div>
            ))}
          </div>
          <p className="text-noir-t3 text-[11px] text-center mb-4 font-light">
            Podés editar los campos que falten después de confirmar
          </p>
          <Button
            onClick={() => onConfirmar(resultado)}
            className="w-full bg-gold hover:bg-gold-dim text-white font-semibold rounded-xl h-12 text-sm mb-2"
          >
            Usar estos datos
          </Button>
          <button onClick={reiniciar}
            className="w-full text-noir-t3 text-[12px] py-2 hover:text-noir-t2 bg-transparent border-none cursor-pointer font-light">
            Volver a dictar
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

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
  const [vozOpen, setVozOpen] = useState(false);

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
            className="w-full bg-gold hover:bg-gold-dim text-white font-semibold rounded-xl h-12 text-sm"
          >
            Registrar otra
          </Button>
        </div>
      </div>
    );
  }

  const confirmarVoz = (data: Partial<FormState>) => {
    setForm(f => ({
      ...f,
      ...(data.insumo        && { insumo: data.insumo }),
      ...(data.proveedor     && { proveedor: data.proveedor }),
      ...(data.cantidad      && { cantidad: data.cantidad }),
      ...(data.unidadMedida  && { unidadMedida: data.unidadMedida }),
      ...(data.costoUnitario && { costoUnitario: data.costoUnitario }),
    }));
    setVozOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {vozOpen && (
          <VozCompraOverlay onConfirmar={confirmarVoz} onCerrar={() => setVozOpen(false)} />
        )}
      </AnimatePresence>

    <div className="max-w-md mx-auto px-5 pt-8 pb-28 lg:px-8 lg:pt-12">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-noir-t3 text-[12px] flex items-center gap-1.5 hover:text-noir-t2 transition-luxury font-light"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <button
          onClick={() => setVozOpen(true)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-noir-t2 hover:text-gold transition-luxury bg-transparent border border-noir-border hover:border-gold/30 cursor-pointer px-3 py-1.5 rounded-lg"
        >
          <Mic size={13} /> Dictar
        </button>
      </div>
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
          className="w-full bg-gold hover:bg-gold-dim disabled:bg-noir-border disabled:text-noir-t3 text-white font-semibold rounded-xl h-12 text-sm"
        >
          {submitting ? 'Registrando...' : 'Registrar compra'}
        </Button>
      </motion.div>
    </div>
    </>
  );
}
