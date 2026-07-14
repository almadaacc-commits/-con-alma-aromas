'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatARS, CANALES } from './lib';
import { Trash2, ShoppingBag, Wallet, TrendingDown } from 'lucide-react';
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
      setVentas(v);
      setCompras(c);
      setRetiros(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const deleteVenta = async (id: string) => {
    await fetch(`/api/ventas?id=${id}`, { method: 'DELETE' });
    setVentas(v => v.filter(x => x.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8 lg:ml-56">
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-alma-card rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 lg:ml-56 pb-24">
      <h2 className="text-xl font-extrabold text-alma-t1 mb-5">Historial</h2>

      <Tabs defaultValue="ventas">
        <TabsList className="w-full bg-transparent border-b border-alma-border rounded-none h-auto p-0 gap-0 mb-4">
          {[
            { v: 'ventas', l: `Ventas (${ventas.length})` },
            { v: 'compras', l: `Compras (${compras.length})` },
            { v: 'retiros', l: `Retiros (${retiros.length})` },
          ].map(t => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-terra-light data-[state=active]:text-terra-light data-[state=active]:shadow-none text-alma-t3 pb-3 pt-2 text-xs font-semibold bg-transparent"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ventas" className="mt-0">
          {ventas.length === 0 ? (
            <p className="text-alma-t3 text-sm text-center py-8">Sin ventas registradas</p>
          ) : (
            <div className="space-y-2">
              {ventas.map(v => (
                <motion.div key={v.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-alma-card border-alma-border">
                    <CardContent className="p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-terra/10 flex items-center justify-center shrink-0">
                        <TrendingDown size={18} className="text-terra-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-alma-t1 truncate">{v.variante}</span>
                          <Badge variant="secondary" className="bg-alma-surface text-alma-t3 text-[10px] border-none">
                            {v.canal}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-alma-t3 mt-0.5">
                          {v.cantidad} {v.tipo} · {new Date(v.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-alma-t1">{formatARS(v.total)}</p>
                        <p className="text-[10px] text-green-400 font-semibold">+{formatARS(v.ganancia)}</p>
                      </div>
                      <button
                        onClick={() => deleteVenta(v.id)}
                        className="text-alma-t3 hover:text-red-400 transition-smooth p-1 cursor-pointer bg-transparent border-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compras" className="mt-0">
          {compras.length === 0 ? (
            <p className="text-alma-t3 text-sm text-center py-8">Sin compras registradas</p>
          ) : (
            <div className="space-y-2">
              {compras.map(c => (
                <Card key={c.id} className="bg-alma-card border-alma-border">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center shrink-0">
                      <ShoppingBag size={18} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-alma-t1 truncate">{c.insumo}</p>
                      <p className="text-[11px] text-alma-t3 mt-0.5">
                        {c.proveedor} · {c.cantidad} {c.unidadMedida} · {new Date(c.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-alma-t1 shrink-0">{formatARS(c.total)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="retiros" className="mt-0">
          {retiros.length === 0 ? (
            <p className="text-alma-t3 text-sm text-center py-8">Sin retiros registrados</p>
          ) : (
            <div className="space-y-2">
              {retiros.map(r => (
                <Card key={r.id} className="bg-alma-card border-alma-border">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center shrink-0">
                      <Wallet size={18} className="text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-alma-t1">{r.quien}</p>
                      <p className="text-[11px] text-alma-t3 mt-0.5">
                        {r.tipo === 'mo' ? 'Mano de obra' : r.tipo === 'ganancia' ? 'Ganancia' : 'Ambos'} · {new Date(r.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-400 shrink-0">{formatARS(r.monto)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}