'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatARS } from './lib';
import { Trash2, ShoppingBag, Wallet, ArrowDownLeft, Download, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function descargarCSV(contenido: string, nombre: string) {
  const bom = '﻿';
  const blob = new Blob([bom + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

function exportarVentas(ventas: any[]) {
  const header = 'Fecha,Producto,Tipo,Fragancia,Cantidad,Precio unit.,Total,Costo,Ganancia,MO,Canal';
  const rows = ventas.map(v => [
    new Date(v.createdAt).toLocaleDateString('es-AR'),
    v.producto, v.tipo, v.variante, v.cantidad,
    v.precioUnitario, v.total, v.costoUnitario, v.ganancia, v.manoDeObra, v.canal,
  ].join(','));
  descargarCSV([header, ...rows].join('\n'), `ventas-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportarCompras(compras: any[]) {
  const header = 'Fecha,Proveedor,Insumo,Cantidad,Unidad,Costo unit.,Total,Notas';
  const rows = compras.map(c => [
    new Date(c.createdAt).toLocaleDateString('es-AR'),
    c.proveedor, c.insumo, c.cantidad, c.unidadMedida,
    c.costoUnitario, c.total, c.observaciones || '',
  ].join(','));
  descargarCSV([header, ...rows].join('\n'), `compras-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportarRetiros(retiros: any[]) {
  const header = 'Fecha,Quien,Tipo,Monto';
  const rows = retiros.map(r => [
    new Date(r.createdAt).toLocaleDateString('es-AR'),
    r.quien,
    r.tipo === 'mo' ? 'Mano de obra' : r.tipo === 'ganancia' ? 'Ganancia' : 'Ambos',
    r.monto,
  ].join(','));
  descargarCSV([header, ...rows].join('\n'), `retiros-${new Date().toISOString().slice(0,10)}.csv`);
}

/* ── Confirmación de borrado ── */
function ConfirmDialog({ mensaje, onConfirm, onCancel }: {
  mensaje: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(245,240,232,0.90)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card-glass-raised rounded-2xl p-6 w-full max-w-xs text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-terra/10 border border-terra/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} strokeWidth={1.5} className="text-terra" />
        </div>
        <p className="text-[14px] font-semibold text-noir-t1 mb-2">¿Borrar registro?</p>
        <p className="text-[12px] text-noir-t3 font-light mb-5">{mensaje}</p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-noir-t2 text-[12px] font-medium cursor-pointer bg-transparent hover:bg-black/[0.03] transition-luxury">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-terra text-white text-[12px] font-semibold cursor-pointer hover:bg-terra-dim transition-luxury border-none">
            Borrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HistorialView() {
  const [ventas, setVentas]       = useState<any[]>([]);
  const [compras, setCompras]     = useState<any[]>([]);
  const [retiros, setRetiros]     = useState<any[]>([]);
  const [prods, setProds]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [confirmId, setConfirmId] = useState<{ id: string; tipo: string; label: string } | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/ventas?limit=300').then(r => r.json()),
      fetch('/api/compras?limit=200').then(r => r.json()),
      fetch('/api/retiros').then(r => r.json()),
      fetch('/api/produccion').then(r => r.json()),
    ]).then(([v, c, r, p]) => {
      setVentas(v); setCompras(c); setRetiros(r); setProds(p); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const confirmarBorrado = async () => {
    if (!confirmId) return;
    const { id, tipo } = confirmId;
    const urls: Record<string, string> = {
      venta: `/api/ventas?id=${id}`,
      compra: `/api/compras?id=${id}`,
      retiro: `/api/retiros?id=${id}`,
      produccion: `/api/produccion?id=${id}`,
    };
    await fetch(urls[tipo], { method: 'DELETE' });
    if (tipo === 'venta')     setVentas(v => v.filter(x => x.id !== id));
    if (tipo === 'compra')    setCompras(c => c.filter(x => x.id !== id));
    if (tipo === 'retiro')    setRetiros(r => r.filter(x => x.id !== id));
    if (tipo === 'produccion') setProds(p => p.filter(x => x.id !== id));
    setConfirmId(null);
  };

  const pedir = (id: string, tipo: string, label: string) =>
    setConfirmId({ id, tipo, label });

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-10 pb-24 lg:px-8">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-black/[0.04] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const tabClass = "flex-1 rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-gold data-[state=active]:text-gold data-[state=active]:shadow-none text-noir-t3 pb-3 pt-1 text-[12px] font-medium tracking-wider uppercase bg-transparent transition-luxury";

  const labelProd = (tipo: string) => {
    if (tipo === 'sah_sin_aroma')   return 'Sin aromatizar';
    if (tipo === 'sah_aromatizado') return 'Aromatizados';
    if (tipo === 'dif_entrada')     return 'Difusor — entrada';
    return tipo;
  };

  return (
    <>
      <AnimatePresence>
        {confirmId && (
          <ConfirmDialog
            mensaje={confirmId.label}
            onConfirm={confirmarBorrado}
            onCancel={() => setConfirmId(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-xl mx-auto px-5 pt-10 pb-28 lg:px-8 lg:pt-12 lg:pb-8">
        <h2 className="text-xl font-black text-noir-t1 mb-6">Historial</h2>

        <Tabs defaultValue="ventas">
          <TabsList className="w-full bg-transparent border-b border-black/[0.08] rounded-none h-auto p-0 gap-0 mb-5">
            <TabsTrigger value="ventas"    className={tabClass}>Ventas</TabsTrigger>
            <TabsTrigger value="compras"   className={tabClass}>Compras</TabsTrigger>
            <TabsTrigger value="retiros"   className={tabClass}>Retiros</TabsTrigger>
            <TabsTrigger value="produccion" className={tabClass}>Stock</TabsTrigger>
          </TabsList>

          {/* ── VENTAS ── */}
          <TabsContent value="ventas" className="mt-0">
            {ventas.length > 0 && (
              <button onClick={() => exportarVentas(ventas)}
                className="flex items-center gap-1.5 text-[11px] text-noir-t3 hover:text-gold transition-luxury mb-3 cursor-pointer bg-transparent border-none font-medium tracking-wide">
                <Download size={12} /> Exportar CSV
              </button>
            )}
            {ventas.length === 0 ? (
              <p className="text-noir-t3 text-sm text-center py-12 font-light">Sin ventas registradas</p>
            ) : (
              <div className="space-y-1.5">
                {ventas.map(v => (
                  <motion.div key={v.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="card-glass rounded-xl p-3.5 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gold/5 flex items-center justify-center shrink-0">
                      <ArrowDownLeft size={15} strokeWidth={1.5} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-noir-t1 font-medium truncate">{v.variante}</span>
                        <Badge variant="secondary" className="bg-black/[0.05] text-noir-t3 text-[9px] border-none font-medium tracking-wider shrink-0">
                          {v.canal}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                        {v.cantidad} {v.tipo} · {new Date(v.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold text-noir-t1">{formatARS(v.total)}</p>
                      <p className="text-[10px] text-sage font-medium">+{formatARS(v.ganancia)}</p>
                    </div>
                    <button
                      onClick={() => pedir(v.id, 'venta', `${v.variante} · ${new Date(v.createdAt).toLocaleDateString('es-AR')}`)}
                      className="text-noir-t3/50 hover:text-terra transition-luxury p-1.5 cursor-pointer bg-transparent border-none shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── COMPRAS ── */}
          <TabsContent value="compras" className="mt-0">
            {compras.length > 0 && (
              <button onClick={() => exportarCompras(compras)}
                className="flex items-center gap-1.5 text-[11px] text-noir-t3 hover:text-gold transition-luxury mb-3 cursor-pointer bg-transparent border-none font-medium tracking-wide">
                <Download size={12} /> Exportar CSV
              </button>
            )}
            {compras.length === 0 ? (
              <p className="text-noir-t3 text-sm text-center py-12 font-light">Sin compras registradas</p>
            ) : (
              <div className="space-y-1.5">
                {compras.map(c => (
                  <div key={c.id} className="card-glass rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gold/5 flex items-center justify-center shrink-0">
                      <ShoppingBag size={15} strokeWidth={1.5} className="text-gold-dim" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-noir-t1 font-medium truncate">{c.insumo}</p>
                      <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                        {c.proveedor} · {c.cantidad} {c.unidadMedida} · {new Date(c.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-noir-t1 shrink-0">{formatARS(c.total)}</p>
                    <button
                      onClick={() => pedir(c.id, 'compra', `${c.insumo} · ${c.proveedor}`)}
                      className="text-noir-t3/50 hover:text-terra transition-luxury p-1.5 cursor-pointer bg-transparent border-none shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── RETIROS ── */}
          <TabsContent value="retiros" className="mt-0">
            {retiros.length > 0 && (
              <button onClick={() => exportarRetiros(retiros)}
                className="flex items-center gap-1.5 text-[11px] text-noir-t3 hover:text-gold transition-luxury mb-3 cursor-pointer bg-transparent border-none font-medium tracking-wide">
                <Download size={12} /> Exportar CSV
              </button>
            )}
            {retiros.length === 0 ? (
              <p className="text-noir-t3 text-sm text-center py-12 font-light">Sin retiros registrados</p>
            ) : (
              <div className="space-y-1.5">
                {retiros.map(r => (
                  <div key={r.id} className="card-glass rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sage/8 flex items-center justify-center shrink-0">
                      <Wallet size={15} strokeWidth={1.5} className="text-sage" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-noir-t1 font-medium">{r.quien}</p>
                      <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                        {r.tipo === 'mo' ? 'Mano de obra' : r.tipo === 'ganancia' ? 'Ganancia' : 'Ambos'} · {new Date(r.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-sage shrink-0">{formatARS(r.monto)}</p>
                    <button
                      onClick={() => pedir(r.id, 'retiro', `${r.quien} · ${formatARS(r.monto)}`)}
                      className="text-noir-t3/50 hover:text-terra transition-luxury p-1.5 cursor-pointer bg-transparent border-none shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── PRODUCCIÓN ── */}
          <TabsContent value="produccion" className="mt-0">
            {prods.length === 0 ? (
              <p className="text-noir-t3 text-sm text-center py-12 font-light">Sin movimientos de stock</p>
            ) : (
              <div className="space-y-1.5">
                {prods.map(p => (
                  <div key={p.id} className="card-glass rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-terra/8 flex items-center justify-center shrink-0">
                      <Sparkles size={15} strokeWidth={1.5} className="text-terra" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-noir-t1 font-medium truncate">
                        {p.variante || labelProd(p.tipo)}
                      </p>
                      <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                        {labelProd(p.tipo)} · {new Date(p.fecha).toLocaleDateString('es-AR')}
                        {p.notas && ` · ${p.notas}`}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold text-noir-t1 shrink-0">+{p.cantidad}</span>
                    <button
                      onClick={() => pedir(p.id, 'produccion', `${p.variante || labelProd(p.tipo)} · ${p.cantidad} u`)}
                      className="text-noir-t3/50 hover:text-terra transition-luxury p-1.5 cursor-pointer bg-transparent border-none shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
