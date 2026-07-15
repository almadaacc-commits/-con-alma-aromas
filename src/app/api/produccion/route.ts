import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prod = await db.produccion.create({
      data: {
        tipo:     body.tipo,
        variante: body.variante ?? null,
        cantidad: body.cantidad,
        notas:    body.notas ?? null,
        fecha:    body.fecha ? new Date(body.fecha) : new Date(),
      },
    });
    return NextResponse.json(prod, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al registrar producción' }, { status: 500 });
  }
}

export async function GET() {
  const prods = await db.produccion.findMany({ orderBy: { fecha: 'desc' }, take: 200 });
  return NextResponse.json(prods);
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await db.produccion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
