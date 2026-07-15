'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAlmaStore, type Screen } from './store';
import { formatARS } from './lib';
import { TrendingUp, AlertTriangle, Package, Wrench, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#C8A45C', '#9B7D3E', '#6BCB77', '#5B9FED', '#E8A838', '#E85D5D', '#A78BFA', '#F472B6'];

interface DashData {
  mesNOMBRE: string;
  facturacion: number;
  udsSah: number;
  udsDif: number;
  aromaTop: string;
  canalTop: string;
  costoTotal: number;
  moTotal: number;
  gananciaEmp: number;
  reinversion: number;
  gananciaRet: number;
  totalRetiros: number;
  canales: { label: string; monto: number; pct: number }[];
  dailySales: { date: string; monto: number }[];
  aromaPie: { name: string; value: number }[];
  stockAlertas: {
    id: string; nombre: string; tipo: string; stockActual: number;
    stockMinimo: number; dias: number; severity: string;
  }[];
  totalVentas: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function DashboardView({ onNav }: { onNav: (s: Screen) => void }) {
  const { dashboardRefresh } = useAlmaStore();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard, dashboardRefresh]);

  if (loading || !data) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-10 pb-24 lg:px-8 lg:pt-12">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 bg-noir-card rounded" />
          <div className="h-12 w-64 bg-noir-card rounded" />
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 bg-noir-card rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const disponible = data.moTotal + data.gananciaRet - data.totalRetiros;
  const margen = ((data.gananciaEmp / data.facturacion) * 100).toFixed(1);

  return (
    <div className="max-w-xl mx-auto px-5 pt-10 pb-28 lg:px-8 lg:pt-12 lg:pb-8">
      {/* ── Header ── */}
      <motion.div initial="hidden" animate="visible" className="mb-8">
        <motion.p variants={fadeUp} custom={0} className="text-noir-t3 text-[11px] tracking-[0.3em] font-medium uppercase mb-3">
          Con Alma Aromas
        </motion.p>
        <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl font-black text-noir-t1 tracking-tight capitalize leading-none">
          {data.mesNOMBRE}
        </motion.h2>
      </motion.div>

      {/* ── Hero number ── */}
      <motion.div
        variants={fadeUp} custom={2}
        initial="hidden" animate="visible"
        className="mb-8"
      >
        <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-2">Facturación del mes</p>
        <p className="text-[44px] sm:text-[56px] font-black text-gold-gradient tracking-[-0.04em] leading-[0.9]">
          {formatARS(data.facturacion)}
        </p>
        <div className="flex gap-5 mt-3 text-[12px] text-noir-t2">
          <span className="flex items-center gap-1.5">
            <Wrench size={13} className="text-gold-dim" />
            {data.udsSah.toLocaleString('es-AR')} sah
          </span>
          <span>{data.udsDif} difusores</span>
          <span className="text-noir-t3">·</span>
          <span className="text-noir-t2">Margen <strong className="text-noir-t1">{margen}%</strong></span>
        </div>
      </motion.div>

      {/* ── Disponible card ── */}
      <motion.div
        variants={fadeUp} custom={3}
        initial="hidden" animate="visible"
        onClick={() => onNav('retiro')}
        className="card-glass rounded-2xl p-5 mb-6 cursor-pointer transition-luxury hover:border-gold/20 group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/3 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase">Disponible</p>
            <ArrowUpRight size={14} className="text-noir-t3 group-hover:text-gold transition-luxury" />
          </div>
          <p className="text-3xl font-black text-noir-t1 tracking-[-0.03em]">{formatARS(disponible)}</p>
          <div className="flex gap-4 mt-2 text-[11px] text-noir-t2">
            <span>MO {formatARS(data.moTotal)}</span>
            <span className="text-noir-t3">·</span>
            <span>Gan. {formatARS(data.gananciaRet)}</span>
            <span className="text-noir-t3">·</span>
            <span className="text-noir-coral/70">Retirado {formatARS(data.totalRetiros)}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Metric cards ── */}
      <motion.div
        variants={fadeUp} custom={4}
        initial="hidden" animate="visible"
        className="grid grid-cols-2 gap-2.5 mb-6"
      >
        {[
          { l: 'Ganancia', v: formatARS(data.gananciaEmp), sub: `${margen}% margen`, icon: TrendingUp, accent: 'text-gold' },
          { l: 'Reinversión', v: formatARS(data.reinversion), sub: '35% de ganancia', icon: Package, accent: 'text-noir-t1' },
          { l: 'Costos', v: formatARS(data.costoTotal), sub: `${((data.costoTotal / data.facturacion) * 100).toFixed(0)}% facturación`, icon: AlertTriangle, accent: 'text-noir-t1' },
          { l: 'Mano de obra', v: formatARS(data.moTotal), sub: `${data.totalVentas} operaciones`, icon: Wrench, accent: 'text-noir-ice' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.l} className="card-glass rounded-2xl gold-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-noir-t3 text-[10px] tracking-[0.2em] font-medium uppercase">{m.l}</span>
                  <Icon size={14} strokeWidth={1.5} className="text-noir-t3" />
                </div>
                <p className={`text-lg font-black tracking-tight ${m.accent}`}>{m.v}</p>
                <p className="text-[10px] text-noir-t2 mt-1 font-light">{m.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="canales" className="w-full">
        <TabsList className="w-full bg-transparent border-b border-noir-border rounded-none h-auto p-0 gap-0 mb-5">
          {['Canales', 'Desglose', 'Stock'].map((l, i) => (
            <TabsTrigger
              key={l}
              value={['canales', 'desglose', 'stock'][i]}
              className="flex-1 rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-gold data-[state=active]:text-gold data-[state=active]:shadow-none text-noir-t3 pb-3 pt-1 text-[12px] font-medium tracking-wider uppercase bg-transparent transition-luxury"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* CANALES */}
        <TabsContent value="canales" className="mt-0 space-y-4">
          {/* Channel bars */}
          <div>
            {data.canales.map((c) => (
              <div key={c.label} className="py-3">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[13px] text-noir-t1 font-medium">{c.label}</span>
                  <div className="text-right">
                    <span className="text-[13px] font-semibold text-noir-t1">{formatARS(c.monto)}</span>
                    <span className="text-[10px] text-noir-t3 ml-2">{c.pct}%</span>
                  </div>
                </div>
                <div className="h-[2px] bg-noir-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Daily chart */}
          {data.dailySales.length > 1 && (
            <Card className="card-glass rounded-2xl">
              <CardContent className="p-4 pt-5">
                <p className="text-noir-t3 text-[10px] tracking-[0.2em] font-medium uppercase mb-4">Ventas diarias</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dailySales} barSize={8}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: '#3E3E4E' }}
                        tickFormatter={(v: string) => v.slice(-2)}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#15151E', border: '1px solid #1F1F2C',
                          borderRadius: 12, color: '#EEEAE4', fontSize: 11,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                        formatter={(v: number) => [formatARS(v), '']}
                        labelFormatter={(l: string) => `Día ${l.slice(-2)}`}
                        cursor={{ fill: 'rgba(200,164,92,0.04)' }}
                      />
                      <Bar dataKey="monto" fill="#C8A45C" radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aroma pie */}
          {data.aromaPie.length > 0 && (
            <Card className="card-glass rounded-2xl">
              <CardContent className="p-4 pt-5">
                <p className="text-noir-t3 text-[10px] tracking-[0.2em] font-medium uppercase mb-4">Top aromas</p>
                <div className="flex items-center gap-6">
                  <div className="w-36 h-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.aromaPie} cx="50%" cy="50%"
                          innerRadius={32} outerRadius={60}
                          dataKey="value" stroke="none"
                        >
                          {data.aromaPie.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    {data.aromaPie.slice(0, 5).map((a, i) => (
                      <div key={a.name} className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[11px] text-noir-t2 truncate flex-1">{a.name}</span>
                        <span className="text-[11px] text-noir-t1 font-semibold">{a.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DESGLOSE */}
        <TabsContent value="desglose" className="mt-0">
          <Card className="card-glass rounded-2xl">
            <CardContent className="p-0">
              {[
                { l: 'Reinversión (35%)', v: formatARS(data.reinversion), c: 'text-gold', pct: 35 },
                { l: 'Costos indirectos (20%)', v: formatARS(data.gananciaEmp * 0.2), c: 'text-noir-t2', pct: 20 },
                { l: 'Retiro ganancia (45%)', v: formatARS(data.gananciaRet), c: 'text-noir-sage', pct: 45 },
              ].map((r, i) => (
                <div key={r.l}>
                  <div className="px-5 py-4">
                    <div className="flex justify-between items-baseline mb-2.5">
                      <span className="text-[12px] text-noir-t2 font-light">{r.l}</span>
                      <span className={`text-[14px] font-bold ${r.c}`}>{r.v}</span>
                    </div>
                    <div className="h-[2px] bg-noir-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${r.pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: r.c === 'text-gold' ? '#C8A45C' : r.c === 'text-noir-sage' ? '#6BCB77' : '#3E3E4E' }}
                      />
                    </div>
                  </div>
                  {i < 2 && <div className="sep-thin mx-5" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STOCK */}
        <TabsContent value="stock" className="mt-0">
          {data.stockAlertas.length === 0 ? (
            <div className="text-center py-12 text-noir-t3 text-sm font-light">Sin alertas de stock</div>
          ) : (
            <Card className="card-glass rounded-2xl">
              <CardContent className="p-0">
                {data.stockAlertas.map((a, i) => {
                  const colorMap: Record<string, string> = { red: 'bg-noir-coral', yellow: 'bg-noir-amber', green: 'bg-noir-sage' };
                  const labelMap: Record<string, string> = { red: 'Urgente', yellow: 'Bajo', green: 'Ok' };
                  const textColorMap: Record<string, string> = { red: 'text-noir-coral', yellow: 'text-noir-amber', green: 'text-noir-sage' };
                  return (
                    <div key={a.id}>
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-1 h-8 rounded-full ${colorMap[a.severity]} ${a.severity === 'red' ? 'pulse-subtle' : ''}`} />
                          <div className="min-w-0">
                            <p className="text-[13px] text-noir-t1 font-medium truncate">{a.nombre}</p>
                            <p className="text-[10px] text-noir-t3 font-light">
                              {a.dias.toFixed(1)} días · {a.stockActual} {a.tipo === 'insumo' ? 'disp.' : 'uds'}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${textColorMap[a.severity]} border-none bg-transparent text-[10px] tracking-wider font-semibold uppercase shrink-0`}
                        >
                          {labelMap[a.severity]}
                        </Badge>
                      </div>
                      {i < data.stockAlertas.length - 1 && <div className="sep-thin mx-5" />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}