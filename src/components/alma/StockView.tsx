'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { VARIANTES_SAH, VARIANTES_DIF } from './lib';
import { Plus, Sparkles, CarFront, X, TrendingUp, Package, Pencil, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Tipos ─────────────────────────────────────────────── */
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
  tipo: TipoProduccion; variante: string; cantidad: string; notas: string;
}

/* ─── Helpers UI ─────────────────────────────────────────── */
function StockBadge({ n }: { n: number }) {
  const color = n <= 0 ? 'text-terra bg-terra/10 border-terra/20'
              : n <= 5 ? 'text-gold bg-gold/10 border-gold/20'
              : 'text-sage bg-sage/10 border-sage/20';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[12px] font-bold border ${color}`}>
      {n}
    </span>
  );
}

function BarPct({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden flex-1">
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dim" />
    </div>
  );
}

/* ─── Modal genérico de confirmación ─────────────────────── */
function ConfirmModal({ titulo, desc, onConfirm, onCancel, loading }: {
  titulo: string; desc: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(245,240,232,0.90)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card-glass-raised rounded-2xl p-6 w-full max-w-xs text-center">
        <div className="w-12 h-12 rounded-2xl bg-terra/10 border border-terra/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} strokeWidth={1.5} className="text-terra" />
        </div>
        <p className="text-[14px] font-semibold text-noir-t1 mb-2">{titulo}</p>
        <p className="text-[12px] text-noir-t3 font-light mb-5">{desc}</p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-noir-t2 text-[12px] font-medium cursor-pointer bg-transparent">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-terra text-white text-[12px] font-semibold cursor-pointer border-none disabled:opacity-60">
            {loading ? 'Borrando...' : 'Borrar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Modal editar stock de fragancia ────────────────────── */
function EditStockModal({ variante, stockActual, vendido, tipoKey, onGuardar, onCerrar }: {
  variante: string; stockActual: number; vendido: number;
  tipoKey: 'sah_aromatizado' | 'dif_entrada';
  onGuardar: (nuevoStock: number) => Promise<void>;
  onCerrar: () => void;
}) {
  const [valor, setValor] = useState(stockActual <= 0 ? '' : String(stockActual));
  const [saving, setSaving] = useState(false);

  const handleGuardar = async () => {
    const n = parseInt(valor);
    if (isNaN(n) || n < 0) return;
    setSaving(true);
    await onGuardar(n);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center px-4 pb-4 lg:pb-0"
      style={{ background: 'rgba(245,240,232,0.90)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="card-glass-raised rounded-2xl p-6 w-full max-w-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-semibold text-noir-t1">Editar stock</p>
            <p className="text-[11px] text-noir-t3 font-light mt-0.5">{variante}</p>
          </div>
          <button onClick={onCerrar} className="text-noir-t3 hover:text-noir-t1 bg-transparent border-none cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="card-glass rounded-xl p-3 mb-4 flex justify-between text-[12px]">
          <span className="text-noir-t3 font-light">Stock actual</span>
          <span className="font-bold text-gold">{stockActual} u</span>
        </div>

        <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-2">Nuevo stock</p>
        <input
          type="number"
          value={valor}
          onChange={e => setValor(e.target.value)}
          placeholder="0"
          autoFocus
          min="0"
          className="w-full bg-white/60 border border-black/[0.08] rounded-xl h-14 px-4 text-[22px] font-black text-gold text-center placeholder:text-noir-t3/50 mb-1 outline-none focus:border-gold/40"
        />
        <p className="text-[10px] text-noir-t3 font-light text-center mb-4">
          Se borran los registros anteriores y se crea uno nuevo
        </p>

        <Button onClick={handleGuardar} disabled={saving || valor === ''}
          className="w-full bg-gold hover:bg-gold-dim disabled:bg-black/10 disabled:text-noir-t3 text-white font-semibold rounded-xl h-10 text-sm">
          {saving ? 'Guardando...' : 'Guardar stock'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Componente principal ──────────────────────────────── */
export function StockView() {
  const [data, setData]         = useState<StockData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [distribN, setDistribN] = useState('100');
  const [form, setForm]         = useState<FormProd>({ tipo: 'sah_sin_aroma', variante: '', cantidad: '', notas: '' });

  // Sin aromatizar editable
  const [editandoSinAroma, setEditandoSinAroma]   = useState(false);
  const [sinAromaInput, setSinAromaInput]         = useState('');
  const [guardandoSinAroma, setGuardandoSinAroma] = useState(false);

  // Modal agregar stock difusor
  const [addDifusorModal, setAddDifusorModal]     = useState<{ variante: string } | null>(null);
  const [addDifusorCantidad, setAddDifusorCantidad] = useState('');
  const [guardandoDifusor, setGuardandoDifusor]   = useState(false);

  // Edit stock por fragancia
  const [editModal, setEditModal] = useState<{
    variante: string; stockActual: number; vendido: number;
    tipoKey: 'sah_aromatizado' | 'dif_entrada';
  } | null>(null);

  // Confirmación borrar variante
  const [deleteModal, setDeleteModal] = useState<{
    variante: string; label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStock = () => {
    setLoading(true);
    fetch('/api/stock')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchStock(); }, []);

  const resetForm = () => setForm({ tipo: 'sah_sin_aroma', variante: '', cantidad: '', notas: '' });
  const set = (k: keyof FormProd) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSaveProd = async () => {
    const qty = parseInt(form.cantidad);
    if (!qty || qty <= 0) return;
    if (form.tipo !== 'sah_sin_aroma' && !form.variante) return;
    setSaving(true);
    const res = await fetch('/api/produccion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: form.tipo,
        variante: form.tipo === 'sah_sin_aroma' ? null : form.variante,
        cantidad: qty, notas: form.notas || null,
      }),
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) { setShowForm(false); resetForm(); fetchStock(); }
  };

  const guardarSinAroma = async () => {
    const n = parseInt(sinAromaInput);
    if (isNaN(n) || n < 0) return;
    setGuardandoSinAroma(true);
    const actual = data?.sahumerios.sinAromaDisponible ?? 0;
    const diferencia = n - actual;
    if (diferencia !== 0) {
      await fetch('/api/produccion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: diferencia > 0 ? 'sah_sin_aroma' : 'sah_aromatizado',
          variante: null, cantidad: Math.abs(diferencia), notas: 'Ajuste manual',
        }),
      }).catch(() => {});
    }
    setGuardandoSinAroma(false);
    setEditandoSinAroma(false);
    fetchStock();
  };

  const guardarStockDifusor = async () => {
    if (!addDifusorModal) return;
    const n = parseInt(addDifusorCantidad);
    if (!n || n <= 0) return;
    setGuardandoDifusor(true);
    await fetch('/api/produccion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'dif_entrada', variante: addDifusorModal.variante, cantidad: n, notas: 'Incorporación manual' }),
    }).catch(() => {});
    setGuardandoDifusor(false);
    setAddDifusorModal(null);
    setAddDifusorCantidad('');
    fetchStock();
  };

  /* ── Editar stock de fragancia ── */
  const handleEditStock = async (nuevoStock: number) => {
    if (!editModal) return;
    const { variante, vendido, tipoKey } = editModal;
    // 1. Borrar todos los registros de producción para esa variante
    await fetch(`/api/produccion?variante=${encodeURIComponent(variante)}`, { method: 'DELETE' }).catch(() => {});
    // 2. Crear nuevo registro con la cantidad correcta (nuevoStock + vendido = total producido)
    const cantidadNecesaria = nuevoStock + vendido;
    if (cantidadNecesaria > 0) {
      await fetch('/api/produccion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoKey, variante, cantidad: cantidadNecesaria, notas: 'Ajuste manual de stock' }),
      }).catch(() => {});
    }
    setEditModal(null);
    fetchStock();
  };

  /* ── Borrar variante (todos sus registros de producción) ── */
  const handleDeleteVariante = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    await fetch(`/api/produccion?variante=${encodeURIComponent(deleteModal.variante)}`, { method: 'DELETE' }).catch(() => {});
    setDeleting(false);
    setDeleteModal(null);
    fetchStock();
  };

  const tabClass = "flex-1 rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-gold data-[state=active]:text-gold data-[state=active]:shadow-none text-noir-t3 pb-3 pt-1 text-[12px] font-medium tracking-wider uppercase bg-transparent transition-luxury";
  const variantesForm = form.tipo === 'dif_entrada' ? VARIANTES_DIF : VARIANTES_SAH;

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
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-black/[0.04] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Modales ── */}
      <AnimatePresence>
        {/* Modal registrar producción */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end lg:items-center justify-center px-4 pb-4 lg:pb-0"
            style={{ background: 'rgba(245,240,232,0.88)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); resetForm(); } }}>
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="card-glass-raised rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[13px] font-semibold text-noir-t1">Registrar producción</p>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="text-noir-t3 hover:text-noir-t1 transition-luxury bg-transparent border-none cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-2">Tipo</p>
              <div className="space-y-1.5 mb-4">
                {[
                  { v: 'sah_sin_aroma'   as TipoProduccion, l: 'Sahumerios sin aromatizar' },
                  { v: 'sah_aromatizado' as TipoProduccion, l: 'Sahumerios aromatizados' },
                  { v: 'dif_entrada'     as TipoProduccion, l: 'Entrada de difusores' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => { set('tipo')(opt.v); set('variante')(''); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[12px] border cursor-pointer transition-luxury ${
                      form.tipo === opt.v ? 'bg-gold/8 border-gold/30 text-gold font-medium' : 'border-black/[0.08] text-noir-t2 font-light bg-white/40'
                    }`}>
                    {opt.l}
                  </button>
                ))}
              </div>

              {form.tipo !== 'sah_sin_aroma' && (
                <>
                  <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-2">Fragancia</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-4 max-h-40 overflow-y-auto">
                    {variantesForm.map(v => (
                      <button key={v} onClick={() => set('variante')(v)}
                        className={`py-2 px-2 rounded-lg text-[11px] border cursor-pointer transition-luxury text-center ${
                          form.variante === v ? 'bg-gold/10 border-gold/30 text-gold font-medium' : 'border-black/[0.08] text-noir-t2 font-light bg-white/40'
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mb-2">Cantidad</p>
              <input type="number" value={form.cantidad} onChange={e => set('cantidad')(e.target.value)}
                placeholder="0"
                className="w-full bg-white/60 border border-black/[0.08] rounded-xl h-11 px-4 text-[13px] text-noir-t1 placeholder:text-noir-t3/60 mb-4 outline-none focus:border-gold/30" />
              <input type="text" value={form.notas} onChange={e => set('notas')(e.target.value)}
                placeholder="Notas (opcional)"
                className="w-full bg-white/60 border border-black/[0.08] rounded-xl h-11 px-4 text-[12px] text-noir-t1 placeholder:text-noir-t3/60 mb-5 outline-none focus:border-gold/30" />

              <Button onClick={handleSaveProd} disabled={saving}
                className="w-full bg-gold hover:bg-gold-dim disabled:bg-black/10 disabled:text-noir-t3 text-white font-semibold rounded-xl h-11 text-sm">
                {saving ? 'Guardando...' : 'Registrar'}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Modal agregar stock difusor */}
        {addDifusorModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end lg:items-center justify-center px-4 pb-4 lg:pb-0"
            style={{ background: 'rgba(245,240,232,0.88)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) { setAddDifusorModal(null); setAddDifusorCantidad(''); } }}>
            <motion.div
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="card-glass-raised rounded-2xl p-6 w-full max-w-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13px] font-semibold text-noir-t1">Incorporar stock</p>
                  <p className="text-[11px] text-noir-t3 font-light mt-0.5">{addDifusorModal.variante}</p>
                </div>
                <button onClick={() => { setAddDifusorModal(null); setAddDifusorCantidad(''); }}
                  className="text-noir-t3 hover:text-noir-t1 bg-transparent border-none cursor-pointer"><X size={16} /></button>
              </div>
              <input type="number" value={addDifusorCantidad} onChange={e => setAddDifusorCantidad(e.target.value)}
                placeholder="0" autoFocus
                className="w-full bg-white/60 border border-black/[0.08] rounded-xl h-12 px-4 text-[20px] font-black text-gold text-center placeholder:text-noir-t3/50 mb-4 outline-none focus:border-gold/40" />
              <Button onClick={guardarStockDifusor} disabled={guardandoDifusor || !addDifusorCantidad}
                className="w-full bg-gold hover:bg-gold-dim disabled:bg-black/10 disabled:text-noir-t3 text-white font-semibold rounded-xl h-10 text-sm">
                {guardandoDifusor ? 'Guardando...' : 'Agregar'}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Modal editar stock fragancia */}
        {editModal && (
          <EditStockModal
            variante={editModal.variante}
            stockActual={editModal.stockActual}
            vendido={editModal.vendido}
            tipoKey={editModal.tipoKey}
            onGuardar={handleEditStock}
            onCerrar={() => setEditModal(null)}
          />
        )}

        {/* Confirmación borrar variante */}
        {deleteModal && (
          <ConfirmModal
            titulo="¿Borrar registros?"
            desc={`Se eliminan todos los movimientos de stock de "${deleteModal.label}". Las ventas no se borran.`}
            onConfirm={handleDeleteVariante}
            onCancel={() => setDeleteModal(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>

      {/* ── Contenido principal ── */}
      <div className="max-w-xl mx-auto px-5 pt-10 pb-28 lg:px-8 lg:pt-12 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-noir-t1">Stock</h2>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-gold bg-gold/8 border border-gold/20 hover:border-gold/40 hover:bg-gold/12 cursor-pointer px-3 py-2 rounded-lg transition-luxury">
            <Plus size={13} /> Registrar producción
          </button>
        </div>

        {!data ? (
          <p className="text-noir-t3 text-sm text-center py-16">Sin datos</p>
        ) : (
          <Tabs defaultValue="sahumerios">
            <TabsList className="w-full bg-transparent border-b border-black/[0.08] rounded-none h-auto p-0 gap-0 mb-5">
              <TabsTrigger value="sahumerios" className={tabClass}>Sahumerios</TabsTrigger>
              <TabsTrigger value="difusores"  className={tabClass}>Difusores</TabsTrigger>
              <TabsTrigger value="sugerencia" className={tabClass}>Distribución</TabsTrigger>
            </TabsList>

            {/* ── TAB SAHUMERIOS ── */}
            <TabsContent value="sahumerios" className="mt-0 space-y-4">
              {/* Sin aromatizar editable */}
              <div className="card-glass-raised rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-terra/10 flex items-center justify-center shrink-0">
                    <Package size={16} strokeWidth={1.5} className="text-terra" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-noir-t1">Sin aromatizar</p>
                    <p className="text-[10px] text-noir-t3 font-light">Base disponible para aromatizar</p>
                  </div>
                  {editandoSinAroma ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={sinAromaInput} onChange={e => setSinAromaInput(e.target.value)}
                        autoFocus
                        className="w-20 bg-white/70 border border-gold/30 rounded-lg h-9 px-2 text-[14px] font-black text-gold text-center outline-none focus:border-gold/60" />
                      <button onClick={guardarSinAroma} disabled={guardandoSinAroma}
                        className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold cursor-pointer hover:bg-gold/20 transition-luxury disabled:opacity-50">
                        <Check size={15} />
                      </button>
                      <button onClick={() => setEditandoSinAroma(false)}
                        className="w-9 h-9 rounded-lg border border-black/[0.08] flex items-center justify-center text-noir-t3 cursor-pointer bg-transparent">
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <StockBadge n={data.sahumerios.sinAromaDisponible} />
                      <button
                        onClick={() => { setSinAromaInput(String(data.sahumerios.sinAromaDisponible)); setEditandoSinAroma(true); }}
                        className="w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-noir-t3 cursor-pointer hover:text-gold hover:border-gold/30 transition-luxury bg-transparent">
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-5 mt-3 pl-12">
                  <div>
                    <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Producido</p>
                    <p className="text-[12px] text-noir-t2 font-semibold">{data.sahumerios.sinAromaProducido}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Aromatizado</p>
                    <p className="text-[12px] text-noir-t2 font-semibold">{data.sahumerios.aromatizadoProducido}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Disponible</p>
                    <p className="text-[12px] text-gold font-bold">{data.sahumerios.sinAromaDisponible}</p>
                  </div>
                </div>
              </div>

              {/* Por fragancia */}
              <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase">Por fragancia</p>
              {data.sahumerios.variantes.length === 0 ? (
                <p className="text-noir-t3 text-sm text-center py-8">
                  Registrá producciones para ver el stock por fragancia
                </p>
              ) : (
                <div className="space-y-1.5">
                  {data.sahumerios.variantes.map(v => (
                    <motion.div key={v.variante} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="card-glass rounded-xl px-3 py-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gold/8 flex items-center justify-center shrink-0">
                        <Sparkles size={14} strokeWidth={1.5} className="text-gold/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-noir-t1 font-medium truncate">{v.variante}</p>
                        <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                          {v.vendidos30d} vendidos 30d · {v.vendido} total
                        </p>
                      </div>
                      <StockBadge n={v.stock} />
                      {/* Editar */}
                      <button
                        onClick={() => setEditModal({ variante: v.variante, stockActual: v.stock, vendido: v.vendido, tipoKey: 'sah_aromatizado' })}
                        className="w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-noir-t3 hover:text-gold hover:border-gold/30 cursor-pointer bg-transparent transition-luxury shrink-0">
                        <Pencil size={12} />
                      </button>
                      {/* Borrar */}
                      <button
                        onClick={() => setDeleteModal({ variante: v.variante, label: v.variante })}
                        className="w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-noir-t3/60 hover:text-terra hover:border-terra/30 cursor-pointer bg-transparent transition-luxury shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── TAB DIFUSORES ── */}
            <TabsContent value="difusores" className="mt-0 space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => { setAddDifusorModal({ variante: VARIANTES_DIF[0] }); setAddDifusorCantidad(''); }}
                  className="flex items-center gap-1.5 text-[11px] text-noir-t2 hover:text-gold border border-black/[0.08] hover:border-gold/30 px-3 py-1.5 rounded-lg cursor-pointer transition-luxury bg-transparent font-medium">
                  <Plus size={12} /> Incorporar stock
                </button>
              </div>

              {data.difusores.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-gold/8 border border-gold/15 flex items-center justify-center mx-auto mb-4">
                    <CarFront size={22} strokeWidth={1.5} className="text-gold/60" />
                  </div>
                  <p className="text-noir-t2 font-medium text-sm mb-1">Sin stock cargado</p>
                  <p className="text-noir-t3 text-[12px] font-light">Usá "Incorporar stock" para agregar difusores</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.difusores.map(v => (
                    <div key={v.variante} className="card-glass rounded-xl px-3 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center shrink-0">
                          <CarFront size={14} strokeWidth={1.5} className="text-sage" />
                        </div>
                        <p className="text-[13px] text-noir-t1 font-semibold flex-1">{v.variante}</p>
                        <StockBadge n={v.stock} />
                        {/* Incorporar más */}
                        <button
                          onClick={() => { setAddDifusorModal({ variante: v.variante }); setAddDifusorCantidad(''); }}
                          className="flex items-center gap-1 text-[10px] font-medium text-gold bg-gold/8 border border-gold/20 hover:bg-gold/15 px-2 py-1.5 rounded-lg cursor-pointer transition-luxury shrink-0">
                          <Plus size={10} />
                        </button>
                        {/* Editar */}
                        <button
                          onClick={() => setEditModal({ variante: v.variante, stockActual: v.stock, vendido: v.vendido, tipoKey: 'dif_entrada' })}
                          className="w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-noir-t3 hover:text-gold hover:border-gold/30 cursor-pointer bg-transparent transition-luxury shrink-0">
                          <Pencil size={12} />
                        </button>
                        {/* Borrar */}
                        <button
                          onClick={() => setDeleteModal({ variante: v.variante, label: v.variante })}
                          className="w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-noir-t3/60 hover:text-terra hover:border-terra/30 cursor-pointer bg-transparent transition-luxury shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex gap-4 pl-10">
                        <div>
                          <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Stock</p>
                          <p className={`text-[12px] font-bold ${v.stock <= 0 ? 'text-terra' : v.stock <= 3 ? 'text-gold' : 'text-sage'}`}>{v.stock} u</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Vendidas</p>
                          <p className="text-[12px] font-semibold text-noir-t2">{v.vendido} u</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Últ. 30d</p>
                          <p className="text-[12px] font-semibold text-noir-t2">{v.vendidos30d} u</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-noir-t3 uppercase tracking-wider mb-0.5">Ingresadas</p>
                          <p className="text-[12px] font-semibold text-noir-t2">{v.entradas} u</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Variantes sin stock */}
              {VARIANTES_DIF.filter(vd => !data.difusores.find(d => d.variante === vd)).length > 0 && (
                <>
                  <p className="text-noir-t3 text-[10px] tracking-[0.25em] uppercase mt-4 mb-2">Sin stock cargado</p>
                  <div className="space-y-1.5">
                    {VARIANTES_DIF.filter(vd => !data.difusores.find(d => d.variante === vd)).map(vd => (
                      <button key={vd}
                        onClick={() => { setAddDifusorModal({ variante: vd }); setAddDifusorCantidad(''); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[12px] border border-dashed border-black/[0.10] text-noir-t3 hover:text-gold hover:border-gold/30 transition-luxury bg-transparent cursor-pointer">
                        <span>{vd}</span>
                        <Plus size={14} />
                      </button>
                    ))}
                  </div>
                </>
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
                <div className="flex items-center gap-3">
                  <input type="number" value={distribN} onChange={e => setDistribN(e.target.value)}
                    className="w-28 bg-white/60 border border-black/[0.08] rounded-xl h-10 px-3 text-[14px] font-black text-gold text-center outline-none focus:border-gold/30"
                    placeholder="100" />
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
