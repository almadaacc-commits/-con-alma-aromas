import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const retiro = await db.retiro.create({ data: body });
    return NextResponse.json(retiro, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear retiro' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get('desde');
  const hasta = searchParams.get('hasta');

  const where: Record<string, unknown> = {};
  if (desde || hasta) {
    const f: Record<string, unknown> = {};
    if (desde) f.gte = new Date(desde);
    if (hasta) f.lte = new Date(hasta);
    where.createdAt = f;
  }

  const retiros = await db.retiro.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });
  return NextResponse.json(retiros);
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await db.retiro.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
