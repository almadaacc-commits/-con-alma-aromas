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

export async function GET() {
  const retiros = await db.retiro.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json(retiros);
}