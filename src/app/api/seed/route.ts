import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const VARIANTES_SAH = [
  "Flores blancas","Fresias","Sándalo dulce","Vainilla","Vainilla coco",
  "Frutos rojos","Fuera de hora","Naranja pimienta","Nag champa","Mirra",
  "Madera","Patchuli","Reina de la noche","Manantial herbal","Cher",
  "Caléndula","Nardo","Citronela","Cítrico zen","Jazmín","Tilo",
];
const CANALES = ["Feria","Instagram / Domicilio","Punto estratégico","Mayorista pack","Mayorista granel"];

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(a: number, b: number): number { return Math.floor(Math.random() * (b - a + 1)) + a; }

export async function POST() {
  // Seed config
  const defaults: Record<string, number> = {
    sahumerio_venta: 400, pack8_venta: 2800, difusor_venta: 1200,
    sahumerio_costo: 375, difusor_costo: 320, mo_sahumerio: 175, mo_difusor: 0,
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db.config.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // Seed ventas for July 2025
  const now = new Date();
  const ventas: Array<{
    producto: string; tipo: string; variante: string; cantidad: number;
    precioUnitario: number; total: number; costoUnitario: number;
    ganancia: number; manoDeObra: number; canal: string; createdAt: Date;
  }> = [];

  for (let d = 1; d <= Math.min(now.getDate(), 15); d++) {
    const numVentas = randomBetween(3, 12);
    for (let v = 0; v < numVentas; v++) {
      const isSah = Math.random() > 0.15;
      const isPack = isSah && Math.random() > 0.75;
      const cantidad = isPack ? randomBetween(1, 4) : randomBetween(1, 30);
      const precioUnit = isPack ? 2800 : isSah ? 400 : 1200;
      const costoUnit = isPack ? 375 * 8 : isSah ? 375 : 320;
      const moUnit = isPack ? 175 * 8 : isSah ? 175 : 0;
      const total = cantidad * precioUnit;
      const ganancia = total - cantidad * costoUnit;

      ventas.push({
        producto: isSah ? 'sahumerio' : 'difusor',
        tipo: isPack ? 'pack8' : isSah ? 'suelto' : 'unidad',
        variante: isSah ? randomFrom(VARIANTES_SAH) : randomFrom(["Cher","Fuera de hora","Madera"]),
        cantidad,
        precioUnitario: precioUnit,
        total,
        costoUnitario: costoUnit,
        ganancia,
        manoDeObra: cantidad * moUnit,
        canal: randomFrom(CANALES),
        createdAt: new Date(2025, 6, d, randomBetween(8, 20), randomBetween(0, 59)),
      });
    }
  }

  // Batch insert
  for (const v of ventas) {
    await db.venta.create({ data: v });
  }

  // Seed inventario
  const inventario = [
    { nombre: "Esencia Vainilla", tipo: "insumo", variante: null, stockActual: 120, stockMinimo: 200, unidadMedida: "ml", consumoDiario: 40 },
    { nombre: "Bolsa kraft 8x28", tipo: "insumo", variante: null, stockActual: 80, stockMinimo: 150, unidadMedida: "uds", consumoDiario: 30 },
    { nombre: "Varillas de álamo", tipo: "insumo", variante: null, stockActual: 200, stockMinimo: 100, unidadMedida: "uds", consumoDiario: 25 },
    { nombre: "Alcohol de cereal", tipo: "insumo", variante: null, stockActual: 1500, stockMinimo: 1000, unidadMedida: "ml", consumoDiario: 200 },
    { nombre: "Harina de madera", tipo: "insumo", variante: null, stockActual: 800, stockMinimo: 500, unidadMedida: "grs", consumoDiario: 50 },
    { nombre: "Goma guar", tipo: "insumo", variante: null, stockActual: 300, stockMinimo: 100, unidadMedida: "grs", consumoDiario: 10 },
    { nombre: "Sahumerio Vainilla", tipo: "producto", variante: "Vainilla", stockActual: 45, stockMinimo: 20, unidadMedida: "uds", consumoDiario: 7 },
    { nombre: "Sahumerio Flores blancas", tipo: "producto", variante: "Flores blancas", stockActual: 30, stockMinimo: 20, unidadMedida: "uds", consumoDiario: 7 },
    { nombre: "Sahumerio Fresias", tipo: "producto", variante: "Fresias", stockActual: 18, stockMinimo: 20, unidadMedida: "uds", consumoDiario: 7 },
    { nombre: "Sahumerio Sándalo dulce", tipo: "producto", variante: "Sándalo dulce", stockActual: 62, stockMinimo: 20, unidadMedida: "uds", consumoDiario: 7 },
    { nombre: "Sahumerio Nag champa", tipo: "producto", variante: "Nag champa", stockActual: 8, stockMinimo: 20, unidadMedida: "uds", consumoDiario: 7 },
    { nombre: "Sahumerio Madera", tipo: "producto", variante: "Madera", stockActual: 55, stockMinimo: 20, unidadMedida: "uds", consumoDiario: 7 },
  ];

  for (const inv of inventario) {
    await db.inventario.upsert({
      where: { id: inv.nombre.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() },
      update: inv,
      create: { ...inv, id: inv.nombre.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() },
    });
  }

  // Seed some retiros
  const retiros = [
    { quien: "Sebastián", tipo: "mo", monto: 75000 },
    { quien: "Paola", tipo: "mo", monto: 75000 },
    { quien: "Sebastián", tipo: "ganancia", monto: 100000 },
  ];
  for (const r of retiros) {
    await db.retiro.create({ data: { ...r, createdAt: new Date(2025, 6, randomBetween(1, 10)) } });
  }

  return NextResponse.json({
    success: true,
    ventasCreadas: ventas.length,
    inventario: inventario.length,
  });
}