'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatARS } from './lib';
import { Trash2, ShoppingBag, Wallet, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function HistorialView() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [retiros, setRetiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/ventas?limit=100').then(r => r.json()),
      fetch('/api/compras?limit=100').then(r => r.json()),
      fetch('/api/retiros').then(r => r.json()),
    ]).then(([v, c, r]) => {
      setVentas(v); setCompras(c); setRetiros(r); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const deleteVenta = async (id: string) => {
    await fetch(`/api/ventas?id=${id}`, { method: 'DELETE' });
    setVentas(v => v.filter(x => x.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-10 pb-24 lg:px-8">
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-noir-card rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-5 pt-10 pb-28 lg:px-8 lg:pt-12 lg:pb-8">
      <h2 className="text-xl font-black text-noir-t1 mb-6">Historial</h2>

      <Tabs defaultValue="ventas">
        <TabsList className="w-full bg-transparent border-b border-noir-border rounded-none h-auto p-0 gap-0 mb-5">
          {[
            { v: 'ventas', l: `Ventas` },
            { v: 'compras', l: `Compras` },
            { v: 'retiros', l: `Retiros` },
          ].map(t => (
            <TabsTrigger key={t.v} value={t.v}
              className="flex-1 rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-gold data-[state=active]:text-gold data-[state=active]:shadow-none text-noir-t3 pb-3 pt-1 text-[12px] font-medium tracking-wider uppercase bg-transparent transition-luxury">
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ventas" className="mt-0">
          {ventas.length === 0 ? (
            <p className="text-noir-t3 text-sm text-center py-12 font-light">Sin ventas</p>
          ) : (
            <div className="space-y-1.5">
              {ventas.map(v => (
                <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                  className="card-glass rounded-xl p-3.5 flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-gold/5 flex items-center justify-center shrink-0">
                    <ArrowDownLeft size={15} strokeWidth={1.5} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-noir-t1 font-medium truncate">{v.variante}</span>
                      <Badge variant="secondary" className="bg-noir-surface text-noir-t3 text-[9px] border-none font-medium tracking-wider">
                        {v.canal}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                      {v.cantidad} {v.tipo} · {new Date(v.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold text-noir-t1">{formatARS(v.total)}</p>
                    <p className="text-[10px] text-noir-sage font-medium">+{formatARS(v.ganancia)}</p>
                  </div>
                  <button onClick={() => deleteVenta(v.id)}
                    className="text-noir-t3/40 hover:text-noir-coral transition-luxury p-1 cursor-pointer bg-transparent border-none opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compras" className="mt-0">
          {compras.length === 0 ? (
            <p className="text-noir-t3 text-sm text-center py-12 font-light">Sin compras</p>
          ) : (
            <div className="space-y-1.5">
              {compras.map(c => (
                <div key={c.id} className="card-glass rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-noir-ice/5 flex items-center justify-center shrink-0">
                    <ShoppingBag size={15} strokeWidth={1.5} className="text-noir-ice" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-noir-t1 font-medium truncate">{c.insumo}</p>
                    <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                      {c.proveedor} · {c.cantidad} {c.unidadMedida} · {new Date(c.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-noir-t1 shrink-0">{formatARS(c.total)}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="retiros" className="mt-0">
          {retiros.length === 0 ? (
            <p className="text-noir-t3 text-sm text-center py-12 font-light">Sin retiros</p>
          ) : (
            <div className="space-y-1.5">
              {retiros.map(r => (
                <div key={r.id} className="card-glass rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-noir-sage/5 flex items-center justify-center shrink-0">
                    <Wallet size={15} strokeWidth={1.5} className="text-noir-sage" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] text-noir-t1 font-medium">{r.quien}</p>
                    <p className="text-[10px] text-noir-t3 font-light mt-0.5">
                      {r.tipo === 'mo' ? 'Mano de obra' : r.tipo === 'ganancia' ? 'Ganancia' : 'Ambos'} · {new Date(r.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-noir-sage shrink-0">{formatARS(r.monto)}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}