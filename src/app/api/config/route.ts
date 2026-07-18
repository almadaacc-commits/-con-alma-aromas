import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULTS: Record<string, number> = {
  sahumerio_venta: 500,
  pack8_venta: 4000,
  difusor_venta: 9000,
  sahumerio_costo: 264,
  difusor_costo: 2500,
  mo_sahumerio: 175,
  mo_difusor: 0,
};

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' };

async function readConfig(): Promise<Record<string, number>> {
  const rows = await db.config.findMany();
  const result: Record<string, number> = { ...DEFAULTS };
  for (const c of rows) result[c.key] = c.value;
  return result;
}

export async function GET() {
  try {
    const result = await readConfig();
    return NextResponse.json(result, { headers: NO_CACHE });
  } catch (e) {
    console.error('Config GET error:', e);
    return NextResponse.json(DEFAULTS, { headers: NO_CACHE });
  }
}

export async function PUT(req: Request) {
  try {
    const body: Record<string, unknown> = await req.json();

    for (const [key, raw] of Object.entries(body)) {
      const value = Number(raw);
      if (isNaN(value)) continue;
      await db.config.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
      });
    }

    // Devuelve lo que quedó en la DB para que el cliente confirme
    const confirmed = await readConfig();
    return NextResponse.json(confirmed, { headers: NO_CACHE });
  } catch (e) {
    console.error('Config PUT error:', e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
