import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    await db.$transaction([
      db.venta.deleteMany(),
      db.retiro.deleteMany(),
      db.produccion.deleteMany(),
      db.compra.deleteMany(),
      db.inventario.deleteMany(),
    ]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al resetear' }, { status: 500 });
  }
}
