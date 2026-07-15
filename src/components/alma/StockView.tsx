'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { VARIANTES_SAH, VARIANTES_DIF } from './lib';
import { Plus, Sparkles, CarFront, X, Trash2, TrendingUp, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Tipos ────────────────────────────────────────────── */
interface VarianteSah {
  variante: string; producido: number; vendido: number;
  stock: number; vendidos30d: number;
}
interface VarianteDif {
  variante: string; entradas: number; vendido: number;
  stock: number; vendidos30d: number;
}
interface StockData {
  sahumerios: {
    sinAromaDisponible: number; sinAromaProducido: number; aromatizadoProducido: number;
    variantes: VarianteSah[]; recomendacion: { variante: string; pct: number }[];
  };
  difusores: VarianteDif[];
}

type TipoProduccion = 'sah_sin_aroma' | 'sah_aromatizado' | 'dif_entrada';

interface FormProd {
  tipo: TipoProduccion;
  variante: string;
  cantidad: string;
  notas: string;
}

/* ─── Helpers UI ───────────────────────────────────────── */
function StockBadge({ n }: { n: number }) {
  const color = n <= 0 ? 'text-terra bg-terra/10 border-terra/20'
              : n <= 5 ? 'text-gold  bg-gold/10  border-gold/20'
              : 'text-sage  bg-sage/10  border-sage/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${color}`}>
      {n}
    </span>
  );
}

function BarPct({ pct }: { pct: number }) {
  return (
    <div className="h-1 rounded-full bg-noir-border overflow-hidden flex-1">
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dim" />
    </div>
  );
}

/* ─── Componente principal ─────────────────────────────── */
export function StockView() {
  const [data, setData]         = useState<StockData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [distribN, setDistribN] = useState('100');
  const [form, setForm]         = useState<FormProd>({
    tipo: 'sah_sin_aroma', variante: '', cantidad: '', notas: '',
  });

  const fetchStock = () => {
    setLoading(true);
    fetch('/api/stock').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchStock(); }, []);

  const resetForm = () => setForm({ tipo: 'sah_sin_aroma', variante: '', cantidad: '', notas: '' });

  const handleSave = async () => {
    const qty = parseInt(form.cantidad);
    if (!qty || qty <= 0) return;
    if (form.tipo !== 'sah_sin_aroma' && !form.variante) return;
    setSaving(true);
    await fetch('/api/produccion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: form.tipo,
        variante: form.tipo === 'sah_sin_aroma' ? null : form.variante,
        cantidad: qty,
        notas: form.notas || null,
      }),
    }).catch(() => {});
    setSaving(false);
    setShowForm(false);
    resetForm();
    fetchStock();
  };

  const set = (k: keyof FormProd) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const tabClass = "flex-1 rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-gold data-[state=active]:text-gold data-[state=active]:shadow-none text-noir-t3 pb-3 pt-1 text-[12px] font-medium tracking-wider uppercase bg-transparent transition-luxury";

  const variantesForm = form.tipo === 'dif_entrada' ? VARIANTES_DIF : VARIANTES_SAH;

  // Distribución sugerida
  const N = parseInt(distribN) || 0;
  const distrib = data && N > 0
    ? data.sahumerios.recomendacion.map(r => ({ ...r, cantidad: Math.round(N * r.pct / 100) }))
    : [];
  const distribTotal = distrib.reduce((s, d) => s + d.cantidad, 0);
  if (distrib.length > 0 && distribTotal < N) distrib[0].cantidad += N - distribTotal;

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-10 pb-24 lg:px-8">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-noir-card rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Modal registrar producción ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end lg:items-center justify-center px-4 pb-4 lg:pb-0"
            style={{ background: 'rgba(13,31,23,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); resetForm(); } }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="card-glass-raised rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-[13px] font-semibold text-noir-t1">Registrar producción</p>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="text-noir-t3 hover:text-noir-t1 transition-luxury bg-transparent border-none cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Tipo */}
              <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-2">Tipo</p>
              <div className="space-y-1.5 mb-4">
                {[
                  { v: 'sah_sin_aroma'   as TipoProduccion, l: 'Sahumerios sin aromatizar' },
                  { v: 'sah_aromatizado' as TipoProduccion, l: 'Sahumerios aromatizados' },
                  { v: 'dif_entrada'     as TipoProduccion, l: 'Entrada de difusores' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => { set('tipo')(opt.v); set('variante')(''); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[12px] border cursor-pointer transition-luxury ${
                      form.tipo === opt.v
                        ? 'bg-gold/8 border-gold/30 text-gold font-medium'
                        : 'border-noir-border text-noir-t2 font-light'
                    }`}>
                    {opt.l}
                  </button>
                ))}
              </div>

              {/* Variante (no aplica para sin_aroma) */}
              {form.tipo !== 'sah_sin_aroma' && (
                <>
                  <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-2">Fragancia / variante</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-4 max-h-40 overflow-y-auto">
                    {variantesForm.map(v => (
                      <button key={v} onClick={() => set('variante')(v)}
                        className={`py-2 px-2 rounded-lg text-[11px] border cursor-pointer transition-luxury text-center ${
                          form.variante === v
                            ? 'bg-gold/10 border-gold/30 text-gold font-medium'
                            : 'border-noir-border text-noir-t2 font-light'
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Cantidad */}
              <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-2">Cantidad</p>
              <input
                type="number"
                value={form.cantidad}
                onChange={e => set('cantidad')(e.target.value)}
                placeholder="0"
                className="w-full bg-noir-surface border border-noir-border rounded-xl h-11 px-4 text-[13px] text-noir-t1 placeholder:text-noir-t3/60 mb-4 outline-none focus:border-gold/30"
              />

              {/* Notas */}
              <input
                type="text"
                value={form.notas}
                onChange={e => set('notas')(e.target.value)}
                placeholder="Notas (opcional)"
                className="w-full bg-noir-surface border border-noir-border rounded-xl h-11 px-4 text-[12px] text-noir-t1 placeholder:text-noir-t3/60 mb-5 outline-none focus:border-gold/30"
              />

              <Button onClick={handleSave} disabled={saving}
                className="w-full bg-gold hover:bg-gold-dim disabled:bg-noir-border disabled:text-noir-t3 text-alma-bg font-semibold rounded-xl h-11 text-sm">
                {saving ? 'Guardando...' : 'Registrar'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenido principal ── */}
      <div className="max-w-xl mx-auto px-5 pt-10 pb-28 lg:px-8 lg:pt-12 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-noir-t1">Stock</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-gold bg-gold/10 border border-gold/20 hover:border-gold/40 hover:bg-gold/15 cursor-pointer px-3 py-2 rounded-lg transition-luxury">
            <Plus size={13} /> Registrar producción
          </button>
        </div>

        {!data ? (
          <p className="text-noir-t3 text-sm text-center py-16">Sin datos</p>
        ) : (
          <Tabs defaultValue="sahumerios">
            <TabsList className="w-full bg-transparent border-b border-noir-border rounded-none h-auto p-0 gap-0 mb-5">
              <TabsTrigger value="sahumerios" className={tabClass}>Sahumerios</TabsTrigger>
              <TabsTrigger value="difusores"  className={tabClass}>Difusores</TabsTrigger>
              <TabsTrigger value="sugerencia" className={tabClass}>Distribución</TabsTrigger>
            </TabsList>

            {/* ── TAB SAHUMERIOS ── */}
            <TabsContent value="sahumerios" className="mt-0 space-y-4">
              {/* Sin aromatizar */}
              <div className="card-glass-raised rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-terra/10 flex items-center justify-center">
                    <Package size={16} strokeWidth={1.5} className="text-terra" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-noir-t1">Sin aromatizar</p>
                    <p className="text-[10px] text-noir-t3 font-light">Base disponible para aromatizar</p>
                  </div>
                  <StockBadge n={data.sahumerios.sinAromaDisponible} />
                </div>
                <div className="flex gap-4 mt-3 pl-12">
                  <div>
                    <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Producido</p>
                    <p className="text-[12px] text-noir-t2 font-medium">{data.sahumerios.sinAromaProducido}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Aromatizado</p>
                    <p className="text-[12px] text-noir-t2 font-medium">{data.sahumerios.aromatizadoProducido}</p>
                  </div>
                </div>
              </div>

              {/* Aromatizados por variante */}
              <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase">Por fragancia</p>
              {data.sahumerios.variantes.length === 0 ? (
                <p className="text-noir-t3 text-sm text-center py-8">
                  Registrá producciones para ver el stock por fragancia
                </p>
              ) : (
                <div className="space-y-1.5">
                  {data.sahumerios.variantes.map(v => (
                    <motion.div key={v.variante} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="card-glass rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/5 flex items-center justify-center shrink-0">
                        <Sparkles size={14} strokeWidth={1.5} className="text-gold/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-noir-t1 font-medium truncate">{v.variante}</p>
                        <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                          {v.vendidos30d} vendidos últimos 30d · {v.vendido} total
                        </p>
                      </div>
                      <StockBadge n={v.stock} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── TAB DIFUSORES ── */}
            <TabsContent value="difusores" className="mt-0 space-y-4">
              {data.difusores.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-gold/5 border border-gold/15 flex items-center justify-center mx-auto mb-4">
                    <CarFront size={22} strokeWidth={1.5} className="text-gold/60" />
                  </div>
                  <p className="text-noir-t2 font-medium text-sm mb-1">Sin stock cargado</p>
                  <p className="text-noir-t3 text-[12px] font-light">
                    Registrá una "Entrada de difusores" para empezar a trackear stock
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {data.difusores.map(v => (
                    <div key={v.variante} className="card-glass rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sage/8 flex items-center justify-center shrink-0">
                        <CarFront size={14} strokeWidth={1.5} className="text-sage" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-noir-t1 font-medium">{v.variante}</p>
                        <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                          {v.vendidos30d} vendidos últimos 30d · {v.entradas} entradas · {v.vendido} total vendido
                        </p>
                      </div>
                      <StockBadge n={v.stock} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── TAB DISTRIBUCIÓN ── */}
            <TabsContent value="sugerencia" className="mt-0">
              <div className="card-glass rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp size={17} strokeWidth={1.5} className="text-gold" />
                  <p className="text-[13px] font-semibold text-noir-t1">Sugerencia de producción</p>
                </div>
                <p className="text-noir-t3 text-[11px] font-light mb-4 leading-relaxed">
                  Basada en ventas de los últimos 30 días. Ingresá cuántos sahumerios vas a producir esta semana:
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="number"
                    value={distribN}
                    onChange={e => setDistribN(e.target.value)}
                    className="w-28 bg-noir-surface border border-noir-border rounded-xl h-10 px-3 text-[14px] font-black text-gold text-center outline-none focus:border-gold/30"
                    placeholder="100"
                  />
                  <span className="text-noir-t3 text-[12px] font-light">sahumerios</span>
                </div>
              </div>

              {data.sahumerios.recomendacion.length === 0 ? (
                <p className="text-noir-t3 text-sm text-center py-8">
                  Necesitás ventas registradas para generar la sugerencia
                </p>
              ) : (
                <div className="space-y-2">
                  {distrib.map((r, i) => (
                    <div key={r.variante} className="card-glass rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] text-noir-t3 w-4 text-right shrink-0">{i + 1}</span>
                        <p className="text-[13px] text-noir-t1 font-medium flex-1">{r.variante}</p>
                        <span className="text-[13px] font-black text-gold">{r.cantidad}</span>
                        <span className="text-[10px] text-noir-t3 w-8 text-right">{r.pct}%</span>
                      </div>
                      <div className="flex items-center gap-3 pl-7">
                        <BarPct pct={r.pct} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
