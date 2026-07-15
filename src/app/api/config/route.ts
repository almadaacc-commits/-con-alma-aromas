import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const DEFAULTS: Record<string, number> = {
  sahumerio_venta: 400,
  pack8_venta: 2800,
  difusor_venta: 1200,
  sahumerio_costo: 375,
  difusor_costo: 320,
  mo_sahumerio: 175,
  mo_difusor: 0,
};

export async function GET() {
  const configs = await db.config.findMany();
  const result: Record<string, number> = { ...DEFAULTS };
  for (const c of configs) result[c.key] = c.value;
  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  try {
    const body: Record<string, number> = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await db.config.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}