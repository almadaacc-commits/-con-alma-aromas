'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAlmaStore } from './store';
import { formatARS, VARIANTES_SAH, VARIANTES_DIF, CANALES } from './lib';
import {
  Check, ArrowLeft, Plus, Minus, Sparkles, CarFront,
  Mic, MicOff, X, Trash2, ShoppingCart,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/* ─── Tipos ────────────────────────────────────────────── */
interface Config {
  sahumerio_venta: number; pack8_venta: number; difusor_venta: number;
  sahumerio_costo: number; difusor_costo: number; mo_sahumerio: number; mo_difusor: number;
}
const DEFAULT_CONFIG: Config = {
  sahumerio_venta: 400, pack8_venta: 2800, difusor_venta: 1200,
  sahumerio_costo: 375, difusor_costo: 320, mo_sahumerio: 175, mo_difusor: 0,
};

interface CartItem {
  uid: string;
  prodKey: 'sah' | 'dif';
  variante: string;
  esPack: boolean;
  cantidad: number;
  precioU: number;
  costoU: number;
  moU: number;
}

interface ItemVoz {
  prodKey: 'sah' | 'dif' | null;
  variante: string | null;
  cantidad: number;
  esPack: boolean;
}

type Mode = 'cart' | 'add' | 'voice' | 'success';
type AddStep = 1 | 2 | 3;

/* ─── Constantes de parsing ────────────────────────────── */
const NUMEROS_ES: [string, number][] = [
  ['cien',100],['noventa',90],['ochenta',80],['setenta',70],['sesenta',60],
  ['cincuenta',50],['cuarenta',40],['treinta',30],['veinte',20],
  ['diecinueve',19],['dieciocho',18],['diecisiete',17],['dieciseis',16],
  ['quince',15],['catorce',14],['trece',13],['doce',12],['once',11],
  ['diez',10],['nueve',9],['ocho',8],['siete',7],['seis',6],
  ['cinco',5],['cuatro',4],['tres',3],['dos',2],['uno',1],['una',1],
];
const MAP_CANAL: [string, string][] = [
  ['feria','Feria'],['instagram','Instagram / Domicilio'],
  ['domicilio','Instagram / Domicilio'],['punto','Punto estratégico'],
  ['estrategico','Punto estratégico'],['granel','Mayorista granel'],
  ['mayorista','Mayorista pack'],
];

/* ─── Helpers de parsing ───────────────────────────────── */
function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function parsearUno(parte: string): ItemVoz {
  const t = norm(parte);
  const item: ItemVoz = { prodKey: null, variante: null, cantidad: 1, esPack: false };

  if (t.includes('difusor'))                                        item.prodKey = 'dif';
  else if (t.includes('sahumerio') || t.includes('sahu'))           item.prodKey = 'sah';

  if (t.includes('pack') || t.includes('caja'))                     item.esPack = true;

  const dig = t.match(/\d+/);
  if (dig) item.cantidad = parseInt(dig[0]);
  else for (const [w, n] of NUMEROS_ES) if (t.includes(w)) { item.cantidad = n; break; }

  const todos = [...VARIANTES_SAH, ...VARIANTES_DIF];

  // Paso 1: todas las palabras de la variante están presentes
  for (const v of todos) {
    const vn = norm(v);
    const words = vn.split(' ').filter(p => p.length > 2);
    if (words.length && words.every(p => t.includes(p))) { item.variante = v; break; }
  }
  // Paso 2: nombre completo como substring
  if (!item.variante) {
    for (const v of todos) if (t.includes(norm(v))) { item.variante = v; break; }
  }
  // Paso 3: cualquier palabra significativa de la variante (maneja "sandalo" → "Sándalo dulce")
  if (!item.variante) {
    for (const v of todos) {
      const words = norm(v).split(' ').filter(p => p.length > 4);
      if (words.length > 0 && words.some(p => t.includes(p))) { item.variante = v; break; }
    }
  }

  // Inferir producto desde la variante cuando no se mencionó "sahumerio"/"difusor"
  if (!item.prodKey && item.variante) {
    const inSah = VARIANTES_SAH.includes(item.variante);
    const inDif = VARIANTES_DIF.includes(item.variante);
    if (inDif && !inSah) item.prodKey = 'dif';
    else if (inSah)      item.prodKey = 'sah';
  }

  return item;
}

function parsearVoz(texto: string): { items: ItemVoz[]; canal: string | null } {
  const t = norm(texto);

  let canal: string | null = null;
  for (const [kw, c] of MAP_CANAL) if (t.includes(kw)) { canal = c; break; }

  const partes = t.split(/[,;]|\s+y\s+|\s+mas\s+/).map(p => p.trim()).filter(p => p.length > 1);

  if (partes.length <= 1) return { items: [parsearUno(t)], canal };

  let lastProd: 'sah' | 'dif' | null = null;
  const items: ItemVoz[] = [];
  for (const p of partes) {
    const item = parsearUno(p);
    if (!item.prodKey && lastProd) item.prodKey = lastProd;
    if (item.prodKey) lastProd = item.prodKey;
    if (item.variante || item.prodKey) items.push(item);
  }
  return { items: items.length ? items : [parsearUno(t)], canal };
}

/* ─── VozOverlay ───────────────────────────────────────── */
interface VozOverlayProps {
  onConfirmar: (items: ItemVoz[], canal: string | null) => void;
  onCerrar: () => void;
}

function VozOverlay({ onConfirmar, onCerrar }: VozOverlayProps) {
  const [escuchando, setEscuchando] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [resultado, setResultado]   = useState<{ items: ItemVoz[]; canal: string | null } | null>(null);
  const [soportado, setSoportado]   = useState(true);
  const recogRef = useRef<any>(null);
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
      if (transcriptRef.current) setResultado(parsearVoz(transcriptRef.current));
    };
    r.onresult = (e: any) => {
      let final = ''; let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      const txt = (final + interim).trim();
      transcriptRef.current = (final).trim() || txt;
      setTranscript(txt);
    };
    recogRef.current = r;
    r.start();
  };
  const detener   = () => recogRef.current?.stop();
  const reiniciar = () => { setTranscript(''); setResultado(null); transcriptRef.current = ''; };

  const removeItem = (i: number) =>
    setResultado(r => r ? { ...r, items: r.items.filter((_, j) => j !== i) } : r);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(245,240,232,0.96)', backdropFilter: 'blur(20px)' }}
    >
      <button onClick={onCerrar} className="absolute top-6 right-6 text-noir-t3 hover:text-noir-t1 transition-luxury bg-transparent border-none cursor-pointer">
        <X size={22} />
      </button>

      <p className="text-noir-t3 text-[10px] tracking-[0.35em] uppercase mb-8">Modo dictado</p>

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
          <p className="text-noir-t3 text-[11px] mt-2 font-light text-center max-w-xs leading-relaxed">
            Ej: "tres vainilla, cuatro sándalo y dos difusores de madera, feria"
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
          <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-3 text-center">
            {resultado.items.length} producto{resultado.items.length !== 1 ? 's' : ''} detectado{resultado.items.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-2 mb-4">
            {resultado.items.map((item, i) => (
              <div key={i} className="card-glass-raised rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium ${item.variante ? 'text-noir-t1' : 'text-terra'}`}>
                    {item.variante || '— variante no detectada'}
                  </p>
                  <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                    {item.prodKey === 'sah' ? 'Sahumerio' : item.prodKey === 'dif' ? 'Difusor' : '— tipo no detectado'}
                    {item.esPack && ' · Pack x8'}
                    {' · '}{item.cantidad} ud{item.cantidad !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => removeItem(i)}
                  className="text-noir-t3/50 hover:text-terra transition-luxury bg-transparent border-none cursor-pointer p-1">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {resultado.canal && (
            <p className="text-[11px] text-sage text-center mb-4 font-medium">
              Canal detectado: {resultado.canal}
            </p>
          )}

          <Button
            onClick={() => onConfirmar(resultado.items, resultado.canal)}
            disabled={resultado.items.length === 0 || resultado.items.every(i => !i.variante)}
            className="w-full bg-gold hover:bg-gold-dim text-white font-semibold rounded-xl h-12 text-sm mb-2 disabled:bg-noir-border disabled:text-noir-t3"
          >
            Agregar al carrito
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

/* ─── VentaView ────────────────────────────────────────── */
const slideIn = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

export function VentaView({ onBack }: { onBack: () => void }) {
  const { refreshDashboard } = useAlmaStore();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  // Carrito
  const [cart, setCart]   = useState<CartItem[]>([]);
  const [canal, setCanal] = useState<string | null>(null);

  // Modos
  const [mode, setMode]       = useState<Mode>('cart');
  const [addStep, setAddStep] = useState<AddStep>(1);

  // Estado temporal al agregar un ítem
  const [tmpProd,     setTmpProd]     = useState<'sah' | 'dif' | null>(null);
  const [tmpVariante, setTmpVariante] = useState<string | null>(null);
  const [tmpEsPack,   setTmpEsPack]   = useState(false);
  const [tmpCantidad, setTmpCantidad] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => { fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => {}); }, []);

  /* Helpers de carrito */
  const itemDesdeCfg = (
    prodKey: 'sah' | 'dif', variante: string, esPack: boolean, cantidad: number
  ): CartItem => {
    const precioU = prodKey === 'sah' ? (esPack ? config.pack8_venta : config.sahumerio_venta) : config.difusor_venta;
    const costoU  = prodKey === 'sah' ? config.sahumerio_costo : config.difusor_costo;
    const moU     = prodKey === 'sah' ? config.mo_sahumerio : 0;
    return { uid: Math.random().toString(36).slice(2), prodKey, variante, esPack, cantidad, precioU, costoU, moU };
  };

  const addToCart = (item: CartItem) => setCart(c => [...c, item]);
  const removeFromCart = (uid: string) => setCart(c => c.filter(i => i.uid !== uid));
  const updateCantidad = (uid: string, delta: number) =>
    setCart(c => c.map(i => i.uid === uid ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i));

  const resetAdd = () => { setTmpProd(null); setTmpVariante(null); setTmpEsPack(false); setTmpCantidad(1); setAddStep(1); };

  const cartTotal    = cart.reduce((s, i) => s + i.cantidad * i.precioU, 0);
  const cartGanancia = cart.reduce((s, i) => s + i.cantidad * i.precioU - i.cantidad * i.costoU, 0);

  /* Submit */
  const handleSubmit = async () => {
    if (!cart.length || !canal) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const results = await Promise.all(cart.map(item => {
        const total    = item.cantidad * item.precioU;
        const ganancia = total - item.cantidad * item.costoU;
        const moVenta  = item.cantidad * item.moU;
        return fetch('/api/ventas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            producto: item.prodKey === 'sah' ? 'sahumerio' : 'difusor',
            tipo: item.prodKey === 'sah' ? (item.esPack ? 'pack8' : 'suelto') : 'unidad',
            variante: item.variante, cantidad: item.cantidad,
            precioUnitario: item.precioU, total,
            costoUnitario: item.costoU, ganancia, manoDeObra: moVenta, canal,
          }),
        });
      }));
      if (results.some(r => !r.ok)) throw new Error('server');
      refreshDashboard();
      setMode('success');
    } catch {
      setSubmitError('No se pudo guardar. Verificá tu conexión e intentá de nuevo.');
    }
    setSubmitting(false);
  };

  /* Confirmar voz */
  const confirmarVoz = (items: ItemVoz[], canalDetectado: string | null) => {
    const nuevos = items
      .filter(i => i.prodKey && i.variante)
      .map(i => itemDesdeCfg(i.prodKey!, i.variante!, i.esPack, i.cantidad));
    setCart(c => [...c, ...nuevos]);
    if (canalDetectado && !canal) setCanal(canalDetectado);
    setMode('cart');
  };

  /* ── Pantalla éxito ── */
  if (mode === 'success') {
    return (
      <div className="max-w-md mx-auto px-5 pt-10 pb-24 lg:px-8 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-16 h-16 rounded-2xl bg-sage/10 border border-sage/25 flex items-center justify-center mb-6 relief"
        >
          <Check size={28} strokeWidth={2.5} className="text-sage" />
        </motion.div>
        <h2 className="text-xl font-black text-noir-t1 mb-1">Venta registrada</h2>
        <p className="text-noir-t2 text-sm font-light mb-1">{cart.length} producto{cart.length !== 1 ? 's' : ''} · {canal}</p>
        <p className="text-3xl font-black text-gold-gradient tracking-[-0.02em] mt-2 mb-6">{formatARS(cartTotal)}</p>

        <div className="w-full card-glass rounded-2xl p-4 mb-6 text-left space-y-2.5">
          {cart.map(item => {
            const t = item.cantidad * item.precioU;
            return (
              <div key={item.uid} className="flex justify-between text-[12px]">
                <span className="text-noir-t2 font-light">{item.cantidad}× {item.variante}</span>
                <span className="text-noir-t1 font-semibold">{formatARS(t)}</span>
              </div>
            );
          })}
          <div className="sep-thin" />
          <div className="flex justify-between text-[12px]">
            <span className="text-noir-t2 font-light">Ganancia total</span>
            <span className="text-sage font-semibold">{formatARS(cartGanancia)}</span>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <Button onClick={() => { setCart([]); setCanal(null); setMode('cart'); }}
            className="flex-1 bg-noir-card border border-noir-border text-noir-t1 hover:bg-noir-hover font-semibold rounded-xl h-11 text-sm">
            Nueva venta
          </Button>
          <Button onClick={() => { setCart([]); setCanal(null); onBack(); }}
            className="flex-1 bg-gold hover:bg-gold-dim text-white font-semibold rounded-xl h-11 text-sm">
            Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Overlay voz ── */}
      <AnimatePresence>
        {mode === 'voice' && (
          <VozOverlay onConfirmar={confirmarVoz} onCerrar={() => setMode('cart')} />
        )}
      </AnimatePresence>

      {/* ── Overlay agregar ítem ── */}
      <AnimatePresence>
        {mode === 'add' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col"
            style={{ background: '#FAF7F2' }}
          >
            <div className="max-w-md mx-auto w-full px-5 pt-8 pb-8 flex-1 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => addStep > 1 ? setAddStep((addStep - 1) as AddStep) : (resetAdd(), setMode('cart'))}
                  className="text-noir-t3 text-[12px] flex items-center gap-1.5 hover:text-noir-t2 transition-luxury font-light bg-transparent border-none cursor-pointer">
                  <ArrowLeft size={14} /> {addStep > 1 ? 'Atrás' : 'Carrito'}
                </button>
                <p className="text-noir-t3 text-[10px] tracking-[0.2em] uppercase">Agregar producto</p>
                <button onClick={() => { resetAdd(); setMode('cart'); }}
                  className="text-noir-t3 hover:text-noir-t1 transition-luxury bg-transparent border-none cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex-1 h-[1.5px] rounded-full transition-all duration-500" style={{
                    background: s <= addStep ? 'linear-gradient(90deg,#C8A45C,#9B7D3E)' : 'rgba(122,158,126,0.16)',
                  }} />
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* Step 1 — Producto */}
                {addStep === 1 && (
                  <motion.div key="a1" {...slideIn} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                    <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-4">Producto</p>
                    <div className="space-y-2.5">
                      {[
                        { k: 'sah' as const, icon: Sparkles, nombre: 'Sahumerios',    desc: `${formatARS(config.sahumerio_venta)}/u` },
                        { k: 'dif' as const, icon: CarFront, nombre: 'Difusores auto', desc: `${formatARS(config.difusor_venta)}/u` },
                      ].map(p => {
                        const Icon = p.icon;
                        return (
                          <button key={p.k}
                            onClick={() => { setTmpProd(p.k); setAddStep(2); }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl card-glass hover:border-gold/20 transition-luxury cursor-pointer text-left group">
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

                {/* Step 2 — Variante */}
                {addStep === 2 && (
                  <motion.div key="a2" {...slideIn} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                    <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-4">Fragancia</p>
                    {tmpProd === 'sah' && (
                      <div className="flex gap-2 mb-4">
                        {[
                          { v: false, l: `Suelto · ${formatARS(config.sahumerio_venta)}` },
                          { v: true,  l: `Pack x8 · ${formatARS(config.pack8_venta)}` },
                        ].map(opt => (
                          <button key={String(opt.v)}
                            onClick={() => setTmpEsPack(opt.v)}
                            className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border cursor-pointer transition-luxury ${
                              tmpEsPack === opt.v ? 'bg-gold/10 border-gold/30 text-gold' : 'border-noir-border text-noir-t2'
                            }`}>
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {(tmpProd === 'sah' ? VARIANTES_SAH : VARIANTES_DIF).map(v => (
                        <button key={v}
                          onClick={() => { setTmpVariante(v); setAddStep(3); }}
                          className="py-2.5 px-3 rounded-xl text-[12px] font-light border border-noir-border text-noir-t1 hover:border-gold/30 hover:text-gold transition-luxury cursor-pointer text-center">
                          {v}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Cantidad */}
                {addStep === 3 && (
                  <motion.div key="a3" {...slideIn} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                    <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-2">
                      {tmpVariante} {tmpEsPack && '· Pack x8'}
                    </p>
                    <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-5">Cantidad</p>
                    <div className="flex items-center justify-center gap-8 mb-5">
                      <button onClick={() => setTmpCantidad(Math.max(1, tmpCantidad - 1))}
                        className="w-12 h-12 rounded-full border border-noir-border text-noir-t1 flex items-center justify-center cursor-pointer hover:border-gold/30 transition-luxury bg-transparent">
                        <Minus size={18} strokeWidth={1.5} />
                      </button>
                      <span className="text-5xl font-black text-gold-gradient tracking-[-0.04em] w-20 text-center tabular-nums">{tmpCantidad}</span>
                      <button onClick={() => setTmpCantidad(tmpCantidad + 1)}
                        className="w-12 h-12 rounded-full bg-gold text-white flex items-center justify-center cursor-pointer hover:bg-gold-dim transition-luxury border-none">
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                    <div className="flex gap-1.5 justify-center flex-wrap mb-6">
                      {[5, 10, 20, 50].map(n => (
                        <button key={n} onClick={() => setTmpCantidad(n)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer transition-luxury ${
                            tmpCantidad === n ? 'bg-gold/10 border-gold/30 text-gold' : 'border-noir-border text-noir-t3 hover:text-noir-t2'
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>

                    {tmpProd && tmpVariante && (() => {
                      const item = itemDesdeCfg(tmpProd!, tmpVariante!, tmpEsPack, tmpCantidad);
                      const t = item.cantidad * item.precioU;
                      const g = t - item.cantidad * item.costoU;
                      return (
                        <div className="card-glass rounded-2xl p-4 mb-6 space-y-1.5">
                          {[
                            { l: 'Total',    v: formatARS(t), c: 'text-gold' },
                            { l: 'Ganancia', v: formatARS(g), c: 'text-sage' },
                            ...(tmpProd === 'sah' ? [{ l: 'MO', v: formatARS(item.cantidad * item.moU), c: 'text-terra' }] : []),
                          ].map(r => (
                            <div key={r.l} className="flex justify-between text-[12px]">
                              <span className="text-noir-t2 font-light">{r.l}</span>
                              <span className={`font-semibold ${r.c}`}>{r.v}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <Button
                      onClick={() => {
                        if (tmpProd && tmpVariante) {
                          addToCart(itemDesdeCfg(tmpProd, tmpVariante, tmpEsPack, tmpCantidad));
                          resetAdd();
                          setMode('cart');
                        }
                      }}
                      className="w-full bg-gold hover:bg-gold-dim text-white font-semibold rounded-xl h-12 text-sm"
                    >
                      Agregar al carrito
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Vista carrito ── */}
      <div className="max-w-md mx-auto px-5 pt-8 pb-28 lg:px-8 lg:pt-12 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack}
            className="text-noir-t3 text-[12px] flex items-center gap-1.5 hover:text-noir-t2 transition-luxury font-light bg-transparent border-none cursor-pointer">
            <ArrowLeft size={14} /> Volver
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode('voice')}
              className="flex items-center gap-1.5 text-[11px] font-medium text-noir-t2 hover:text-gold transition-luxury bg-transparent border border-noir-border hover:border-gold/30 cursor-pointer px-3 py-1.5 rounded-lg">
              <Mic size={13} /> Dictar
            </button>
            <button onClick={() => { resetAdd(); setMode('add'); }}
              className="flex items-center gap-1.5 text-[11px] font-medium text-noir-t1 hover:text-gold transition-luxury bg-gold/10 border border-gold/20 hover:border-gold/40 cursor-pointer px-3 py-1.5 rounded-lg">
              <Plus size={13} /> Agregar
            </button>
          </div>
        </div>

        {/* Carrito vacío */}
        {cart.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gold/5 border border-gold/15 flex items-center justify-center mb-4">
              <ShoppingCart size={26} strokeWidth={1.5} className="text-gold/60" />
            </div>
            <p className="text-noir-t1 font-semibold mb-1">Carrito vacío</p>
            <p className="text-noir-t3 text-[12px] font-light mb-6">Agregá productos uno a uno o usando el micrófono</p>
            <div className="flex gap-2">
              <button onClick={() => setMode('voice')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-noir-border text-noir-t2 text-[12px] font-medium hover:border-gold/30 hover:text-gold transition-luxury bg-transparent cursor-pointer">
                <Mic size={14} /> Dictar venta
              </button>
              <button onClick={() => { resetAdd(); setMode('add'); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold text-[12px] font-medium hover:bg-gold/15 transition-luxury cursor-pointer">
                <Plus size={14} /> Agregar producto
              </button>
            </div>
          </motion.div>
        )}

        {/* Ítems del carrito */}
        {cart.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">
              {cart.length} producto{cart.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2 mb-4">
              {cart.map(item => {
                const t = item.cantidad * item.precioU;
                return (
                  <div key={item.uid} className="card-glass rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-noir-t1 font-medium truncate">
                        {item.variante} {item.esPack && <span className="text-gold text-[10px] font-normal ml-1">pack</span>}
                      </p>
                      <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                        {item.prodKey === 'sah' ? 'Sahumerio' : 'Difusor'} · {formatARS(item.precioU)}/u
                      </p>
                    </div>
                    {/* Cantidad */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateCantidad(item.uid, -1)}
                        className="w-6 h-6 rounded-full border border-noir-border text-noir-t2 flex items-center justify-center cursor-pointer hover:border-gold/30 transition-luxury bg-transparent text-xs">
                        <Minus size={10} />
                      </button>
                      <span className="text-[14px] font-black text-gold w-5 text-center tabular-nums">{item.cantidad}</span>
                      <button onClick={() => updateCantidad(item.uid, +1)}
                        className="w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center cursor-pointer hover:bg-gold/25 transition-luxury border-none text-xs">
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="text-[12px] font-semibold text-noir-t1 w-16 text-right shrink-0">{formatARS(t)}</span>
                    <button onClick={() => removeFromCart(item.uid)}
                      className="text-noir-t3/40 hover:text-terra transition-luxury p-1 cursor-pointer bg-transparent border-none shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Totales */}
            <div className="card-glass-raised rounded-2xl p-4 mb-6">
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-noir-t2 font-light">Ganancia estimada</span>
                <span className="text-sage font-semibold">{formatARS(cartGanancia)}</span>
              </div>
              <div className="sep-thin mb-2" />
              <div className="flex justify-between">
                <span className="text-[13px] font-medium text-noir-t1">Total</span>
                <span className="text-xl font-black text-gold-gradient tracking-[-0.02em]">{formatARS(cartTotal)}</span>
              </div>
            </div>

            {/* Canal */}
            <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-3">Canal de venta</p>
            <div className="space-y-1.5 mb-6">
              {CANALES.map(c => (
                <button key={c} onClick={() => setCanal(c)}
                  className={`w-full p-3.5 rounded-xl text-[13px] text-left cursor-pointer border transition-luxury ${
                    canal === c ? 'bg-gold/5 border-gold/30 text-gold font-medium' : 'border-noir-border text-noir-t2 font-light hover:border-noir-t3'
                  }`}>
                  {c}
                </button>
              ))}
            </div>

            {submitError && (
              <p className="text-terra text-[12px] text-center mb-3 font-light">{submitError}</p>
            )}
            <Button onClick={handleSubmit} disabled={!canal || submitting}
              className="w-full bg-gold hover:bg-gold-dim disabled:bg-noir-border disabled:text-noir-t3 text-white font-semibold rounded-xl h-12 text-sm">
              {submitting ? 'Registrando...' : `Registrar ${cart.length} producto${cart.length !== 1 ? 's' : ''}`}
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
}
