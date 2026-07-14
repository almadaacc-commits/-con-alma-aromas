import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const venta = await db.venta.create({ data: body });
    return NextResponse.json(venta, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Error al crear venta' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get('desde');
  const hasta = searchParams.get('hasta');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: Record<string, unknown> = {};
  if (desde || hasta) {
    const f: Record<string, unknown> = {};
    if (desde) f.gte = new Date(desde);
    if (hasta) f.lte = new Date(hasta);
    where.createdAt = f;
  }

  const ventas = await db.venta.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json(ventas);
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await db.venta.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}