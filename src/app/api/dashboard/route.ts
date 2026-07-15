import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const mes = parseInt(searchParams.get('mes') || String(now.getMonth() + 1));
  const anio = parseInt(searchParams.get('anio') || String(now.getFullYear()));

  const startOfMonth = new Date(anio, mes - 1, 1);
  const endOfMonth = new Date(anio, mes, 0, 23, 59, 59);

  const ventas = await db.venta.findMany({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
    orderBy: { createdAt: 'desc' },
  });

  const retiros = await db.retiro.findMany({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
    orderBy: { createdAt: 'desc' },
  });

  const inventario = await db.inventario.findMany();

  // Compute metrics
  const facturacion = ventas.reduce((s, v) => s + v.total, 0);
  const udsSah = ventas.filter(v => v.producto === 'sahumerio').reduce((s, v) => s + v.cantidad * (v.tipo === 'pack8' ? 8 : 1), 0);
  const udsDif = ventas.filter(v => v.producto === 'difusor').reduce((s, v) => s + v.cantidad, 0);
  const costoTotal = ventas.reduce((s, v) => s + v.costoUnitario * v.cantidad, 0);
  const moTotal = ventas.reduce((s, v) => s + v.manoDeObra, 0);
  const gananciaEmp = facturacion - costoTotal;
  const reinversion = gananciaEmp * 0.35;
  const gananciaRet = gananciaEmp * 0.45;
  const totalRetiros = retiros.reduce((s, r) => s + r.monto, 0);

  // Top aroma
  const aromaCount: Record<string, number> = {};
  ventas.forEach(v => { aromaCount[v.variante] = (aromaCount[v.variante] || 0) + v.cantidad; });
  const aromaTop = Object.entries(aromaCount).sort((a, b) => b[1] - a[1])[0];

  // Canal breakdown
  const canalMap: Record<string, { monto: number; uds: number }> = {};
  ventas.forEach(v => {
    if (!canalMap[v.canal]) canalMap[v.canal] = { monto: 0, uds: 0 };
    canalMap[v.canal].monto += v.total;
    canalMap[v.canal].uds += v.cantidad;
  });
  const canales = Object.entries(canalMap).map(([label, c]) => ({
    label,
    monto: c.monto,
    pct: facturacion > 0 ? Math.round((c.monto / facturacion) * 100) : 0,
  })).sort((a, b) => b.monto - a.monto);

  // Daily sales for chart
  const dailyMap: Record<string, number> = {};
  ventas.forEach(v => {
    const day = v.createdAt.toISOString().slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + v.total;
  });
  const dailySales = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, monto]) => ({ date, monto }));

  // Aroma distribution for pie chart
  const aromaPie = Object.entries(aromaCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Stock alerts
  const stockAlertas = inventario.filter(i => {
    const dias = i.consumoDiario > 0 ? i.stockActual / i.consumoDiario : 999;
    return dias < 30;
  }).map(i => {
    const dias = i.consumoDiario > 0 ? Math.round((i.stockActual / i.consumoDiario) * 10) / 10 : 999;
    return {
      id: i.id,
      nombre: i.nombre,
      tipo: i.tipo,
      stockActual: i.stockActual,
      stockMinimo: i.stockMinimo,
      dias,
      severity: dias < 3 ? 'red' : dias < 10 ? 'yellow' : 'green',
    };
  }).sort((a, b) => a.dias - b.dias);

  return NextResponse.json({
    mesNOMBRE: new Date(anio, mes - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
    facturacion: Math.round(facturacion),
    udsSah: Math.round(udsSah),
    udsDif: Math.round(udsDif),
    aromaTop: aromaTop ? aromaTop[0] : '—',
    canalTop: canales[0]?.label || '—',
    costoTotal: Math.round(costoTotal),
    moTotal: Math.round(moTotal),
    gananciaEmp: Math.round(gananciaEmp),
    reinversion: Math.round(reinversion),
    gananciaRet: Math.round(gananciaRet),
    totalRetiros: Math.round(totalRetiros),
    canales,
    dailySales,
    aromaPie,
    stockAlertas,
    totalVentas: ventas.length,
  });
}