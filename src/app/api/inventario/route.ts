import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await db.inventario.findMany({
    orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
  });
  return NextResponse.json(items);
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const updated = await db.inventario.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}