import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [ventas, producciones] = await Promise.all([
    db.venta.findMany({ select: { producto: true, variante: true, cantidad: true, createdAt: true } }),
    db.produccion.findMany(),
  ]);

  // ── Sahumerios ───────────────────────────────────────────
  const sinAromaProducido = producciones
    .filter(p => p.tipo === 'sah_sin_aroma')
    .reduce((s, p) => s + p.cantidad, 0);

  const aromatizadoProducido = producciones
    .filter(p => p.tipo === 'sah_aromatizado')
    .reduce((s, p) => s + p.cantidad, 0);

  const sinAromaDisponible = sinAromaProducido - aromatizadoProducido;

  // Por variante: producidos aromatizados - vendidos
  const aroProd: Record<string, number> = {};
  for (const p of producciones.filter(x => x.tipo === 'sah_aromatizado')) {
    aroProd[p.variante ?? ''] = (aroProd[p.variante ?? ''] ?? 0) + p.cantidad;
  }

  const sahVentas: Record<string, number> = {};
  const sahVentas30d: Record<string, number> = {};
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (const v of ventas.filter(v => v.producto === 'sahumerio')) {
    sahVentas[v.variante] = (sahVentas[v.variante] ?? 0) + v.cantidad;
    if (new Date(v.createdAt) >= hace30)
      sahVentas30d[v.variante] = (sahVentas30d[v.variante] ?? 0) + v.cantidad;
  }

  const todosVariantesSah = Array.from(
    new Set([...Object.keys(aroProd), ...Object.keys(sahVentas)])
  );

  const sahumerios = todosVariantesSah.map(variante => ({
    variante,
    producido:  aroProd[variante] ?? 0,
    vendido:    sahVentas[variante] ?? 0,
    stock:      (aroProd[variante] ?? 0) - (sahVentas[variante] ?? 0),
    vendidos30d: sahVentas30d[variante] ?? 0,
  })).sort((a, b) => b.vendidos30d - a.vendidos30d);

  // ── Recomendación de distribución ───────────────────────
  const totalVendidos30d = sahumerios.reduce((s, x) => s + x.vendidos30d, 0);
  const recomendacion = sahumerios
    .filter(x => x.vendidos30d > 0)
    .map(x => ({
      variante: x.variante,
      pct: totalVendidos30d > 0 ? Math.round((x.vendidos30d / totalVendidos30d) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  // ── Difusores ────────────────────────────────────────────
  const difEntrada: Record<string, number> = {};
  for (const p of producciones.filter(x => x.tipo === 'dif_entrada')) {
    difEntrada[p.variante ?? ''] = (difEntrada[p.variante ?? ''] ?? 0) + p.cantidad;
  }

  const difVentas: Record<string, number> = {};
  const difVentas30d: Record<string, number> = {};
  for (const v of ventas.filter(v => v.producto === 'difusor')) {
    difVentas[v.variante] = (difVentas[v.variante] ?? 0) + v.cantidad;
    if (new Date(v.createdAt) >= hace30)
      difVentas30d[v.variante] = (difVentas30d[v.variante] ?? 0) + v.cantidad;
  }

  const todosVariantesDif = Array.from(
    new Set([...Object.keys(difEntrada), ...Object.keys(difVentas)])
  );

  const difusores = todosVariantesDif.map(variante => ({
    variante,
    entradas:   difEntrada[variante] ?? 0,
    vendido:    difVentas[variante] ?? 0,
    stock:      (difEntrada[variante] ?? 0) - (difVentas[variante] ?? 0),
    vendidos30d: difVentas30d[variante] ?? 0,
  })).sort((a, b) => b.vendidos30d - a.vendidos30d);

  return NextResponse.json({
    sahumerios: {
      sinAromaDisponible,
      sinAromaProducido,
      aromatizadoProducido,
      variantes: sahumerios,
      recomendacion,
    },
    difusores,
  });
}
