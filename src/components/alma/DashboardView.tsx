'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAlmaStore, type Screen } from './store';
import { formatARS } from './lib';
import { TrendingUp, AlertTriangle, Package, Flame } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#D4521A', '#F07040', '#FF9468', '#4ADE80', '#60A5FA', '#FBBF24', '#C084FC', '#F472B6'];

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
      <div className="max-w-2xl mx-auto px-4 pt-8 lg:ml-56">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-alma-card rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const disponible = data.moTotal + data.gananciaRet - data.totalRetiros;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 lg:ml-56">
      {/* Header */}
      <div className="relative mb-6">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-terra-glow pointer-events-none" />
        <p className="text-alma-t3 text-xs tracking-[0.2em] font-bold mb-1">CON ALMA AROMAS</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-alma-t1 tracking-tight capitalize">
          {data.mesNOMBRE}
        </h2>
        <div className="mt-6">
          <p className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-1">FACTURACIÓN</p>
          <p className="text-4xl sm:text-5xl font-black text-terra-gradient tracking-tighter leading-none">
            {formatARS(data.facturacion)}
          </p>
          <div className="flex gap-4 mt-3 text-xs text-alma-t2 flex-wrap">
            <span className="flex items-center gap-1"><Flame size={14} className="text-terra-light" /> {data.udsSah.toLocaleString('es-AR')} sah</span>
            <span>{data.udsDif} difusores</span>
            <span>Aroma top: <strong className="text-alma-t1">{data.aromaTop}</strong></span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full bg-transparent border-b border-alma-border rounded-none h-auto p-0 gap-0 mb-4">
          {['Resumen', 'Desglose', 'Stock'].map((l, i) => (
            <TabsTrigger
              key={l}
              value={['overview', 'desglose', 'stock'][i]}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-terra-light data-[state=active]:text-terra-light data-[state=active]:shadow-none text-alma-t3 pb-3 pt-2 text-sm font-semibold bg-transparent"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="mt-0 space-y-3">
          {/* Disponible card */}
          <div
            className="rounded-2xl p-5 mb-3 relative overflow-hidden terra-glow-sm cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #D4521A 0%, #8B2A08 100%)' }}
            onClick={() => onNav('retiro')}
          >
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-white/5" />
            <p className="text-white/50 text-[10px] tracking-[0.2em] font-bold mb-1">DISPONIBLE PARA RETIRAR</p>
            <p className="text-3xl font-black text-white tracking-tighter">{formatARS(disponible)}</p>
            <div className="flex gap-4 mt-2 text-[11px] text-white/60">
              <span>MO {formatARS(data.moTotal)}</span>
              <span>Gan. {formatARS(data.gananciaRet)}</span>
              <span>Retirado {formatARS(data.totalRetiros)}</span>
            </div>
            <div className="mt-3 inline-block bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
              Registrar retiro →
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { l: 'Ganancia empresa', v: formatARS(data.gananciaEmp), sub: `${((data.gananciaEmp / data.facturacion) * 100).toFixed(0)}% margen`, icon: TrendingUp },
              { l: 'Reinversión', v: formatARS(data.reinversion), sub: '35% ganancia', icon: Package },
              { l: 'Costos directos', v: formatARS(data.costoTotal), sub: `${((data.costoTotal / data.facturacion) * 100).toFixed(0)}% factur.`, icon: AlertTriangle },
              { l: 'Mano de obra', v: formatARS(data.moTotal), sub: `${data.totalVentas} ventas`, icon: Flame },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.l} className="bg-alma-card border-alma-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-alma-t3 text-[10px] tracking-wider font-bold">{m.l.toUpperCase()}</span>
                      <Icon size={14} className="text-alma-t3" />
                    </div>
                    <p className="text-lg font-extrabold text-alma-t1 tracking-tight">{m.v}</p>
                    <p className="text-[10px] text-alma-t2 mt-1">{m.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Channel breakdown */}
          <div>
            <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-2">VENTAS POR CANAL</p>
            <Card className="bg-alma-card border-alma-border">
              <CardContent className="p-0">
                {data.canales.map((c, i) => (
                  <div key={c.label}>
                    <div className="px-4 py-3">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-alma-t1">{c.label}</span>
                        <span className="text-sm font-bold text-alma-t1">{formatARS(c.monto)}</span>
                      </div>
                      <div className="h-1.5 bg-alma-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${c.pct}%`,
                            background: 'linear-gradient(90deg, #D4521A 0%, #F07040 100%)',
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-alma-t3 mt-1">{c.pct}%</p>
                    </div>
                    {i < data.canales.length - 1 && <div className="h-px bg-alma-border" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Daily Sales Chart */}
          {data.dailySales.length > 1 && (
            <div>
              <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-2">VENTAS DIARIAS</p>
              <Card className="bg-alma-card border-alma-border">
                <CardContent className="p-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailySales}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#5C3D2A' }}
                          tickFormatter={(v: string) => v.slice(-2)}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1E1410',
                            border: '1px solid #2E1E0F',
                            borderRadius: 12,
                            color: '#F5EDE4',
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [formatARS(v), 'Ventas']}
                          labelFormatter={(l: string) => `Día ${l.slice(-2)}`}
                        />
                        <Bar dataKey="monto" fill="#D4521A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Aroma Pie */}
          {data.aromaPie.length > 0 && (
            <div>
              <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-2">TOP AROMAS</p>
              <Card className="bg-alma-card border-alma-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-40 h-40 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.aromaPie}
                            cx="50%" cy="50%"
                            innerRadius={30} outerRadius={65}
                            dataKey="value"
                            stroke="none"
                          >
                            {data.aromaPie.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#1E1410', border: '1px solid #2E1E0F',
                              borderRadius: 12, color: '#F5EDE4', fontSize: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {data.aromaPie.slice(0, 5).map((a, i) => (
                        <div key={a.name} className="flex items-center gap-2 text-xs">
                          <div
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-alma-t2 truncate">{a.name}</span>
                          <span className="text-alma-t1 font-bold ml-auto">{a.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── DESGLOSE ── */}
        <TabsContent value="desglose" className="mt-0 space-y-3">
          <DesgloseTab data={data} />
        </TabsContent>

        {/* ── STOCK ── */}
        <TabsContent value="stock" className="mt-0 space-y-3">
          <StockTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DesgloseTab({ data }: { data: DashData }) {
  const items = [
    { l: 'Ganancia empresa', v: formatARS(data.gananciaEmp), c: 'text-alma-t1' },
    { l: 'Reinversión (35%)', v: formatARS(data.reinversion), c: 'text-terra-light', bar: 35 },
    { l: 'Costos indirectos (20%)', v: formatARS(data.gananciaEmp * 0.2), c: 'text-alma-t2', bar: 20 },
    { l: 'Retiro ganancia (45%)', v: formatARS(data.gananciaRet), c: 'text-green-400', bar: 45 },
  ];

  return (
    <>
      <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold">DISTRIBUCIÓN DE GANANCIA</p>
      <Card className="bg-alma-card border-alma-border">
        <CardContent className="p-0">
          {items.map((r, i) => (
            <div key={r.l}>
              <div className="px-4 py-3">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-alma-t2">{r.l}</span>
                  <span className={`text-sm font-bold ${r.c}`}>{r.v}</span>
                </div>
                {'bar' in r && r.bar && (
                  <Progress value={r.bar} className="h-0.5 bg-alma-border" />
                )}
              </div>
              {i < items.length - 1 && <div className="h-px bg-alma-border" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function StockTab({ data }: { data: DashData }) {
  const sevColor: Record<string, string> = { red: 'bg-red-400', yellow: 'bg-yellow-400', green: 'bg-green-400' };
  const sevBg: Record<string, string> = { red: 'bg-red-400/10 text-red-400', yellow: 'bg-yellow-400/10 text-yellow-400', green: 'bg-green-400/10 text-green-400' };
  const sevLabel: Record<string, string> = { red: 'URGENTE', yellow: 'REPONER', green: 'OK' };

  return (
    <>
      <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold">ALERTAS DE STOCK</p>
      {data.stockAlertas.length === 0 ? (
        <Card className="bg-alma-card border-alma-border">
          <CardContent className="p-6 text-center text-alma-t3 text-sm">Sin alertas</CardContent>
        </Card>
      ) : (
        <Card className="bg-alma-card border-alma-border">
          <CardContent className="p-0">
            {data.stockAlertas.map((a, i) => (
              <div key={a.id}>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${sevColor[a.severity]}`} style={a.severity === 'red' ? { boxShadow: `0 0 8px ${sevColor[a.severity].replace('bg-', '')}` } : {}} />
                    <div>
                      <p className="text-sm text-alma-t1">{a.nombre}</p>
                      <p className="text-[10px] text-alma-t3">{a.dias.toFixed(1)} días restantes · {a.stockActual} {a.tipo === 'insumo' ? 'disponible' : 'uds'}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`${sevBg[a.severity]} border-none text-[10px] font-bold tracking-wider ${a.severity === 'red' ? 'alert-pulse' : ''}`}>
                    {sevLabel[a.severity]}
                  </Badge>
                </div>
                {i < data.stockAlertas.length - 1 && <div className="h-px bg-alma-border" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}