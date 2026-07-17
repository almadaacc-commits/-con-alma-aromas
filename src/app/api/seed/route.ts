import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const VARIANTES_SAH = [
  "Flores blancas","Fresias","Sándalo dulce","Vainilla","Vainilla coco",
  "Frutos rojos","Fuera de hora","Naranja pimienta","Nag champa","Mirra",
  "Madera","Patchuli","Reina de la noche","Manantial herbal","Cher",
  "Caléndula","Nardo","Citronela","Cítrico zen","Jazmín","Tilo",
];
const VARIANTES_DIF = ["Cher","Fuera de hora","Madera"];
const CANALES = ["Feria","Instagram / Domicilio","Punto estratégico","Mayorista pack","Mayorista granel"];

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(a: number, b: number): number { return Math.floor(Math.random() * (b - a + 1)) + a; }

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const clearExisting = searchParams.get('clear') === 'true';

  if (clearExisting) {
    await db.retiro.deleteMany({});
    await db.venta.deleteMany({});
    await db.compra.deleteMany({});
    await db.produccion.deleteMany({});
    await db.inventario.deleteMany({});
  }

  // ── Config ────────────────────────────────────────────────
  const configDefaults: Record<string, number> = {
    sahumerio_venta: 400, pack8_venta: 2800, difusor_venta: 1200,
    sahumerio_costo: 375, difusor_costo: 320, mo_sahumerio: 175, mo_difusor: 0,
  };
  for (const [key, value] of Object.entries(configDefaults)) {
    await db.config.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // ── Ventas junio 2025 ─────────────────────────────────────
  const ventasJunio: Array<{
    producto: string; tipo: string; variante: string; cantidad: number;
    precioUnitario: number; total: number; costoUnitario: number;
    ganancia: number; manoDeObra: number; canal: string; createdAt: Date;
  }> = [];

  // Distribución más realista: ferias los sábados, Instagram diario
  for (let d = 1; d <= 30; d++) {
    const fecha = new Date(2025, 5, d); // junio = mes 5
    const diaSemana = fecha.getDay(); // 0=dom, 6=sab
    const esFeria = diaSemana === 6; // sólo sábados

    // Ventas Instagram casi todos los días
    if (Math.random() > 0.2) {
      const numIg = randomBetween(2, 8);
      for (let v = 0; v < numIg; v++) {
        const isSah = Math.random() > 0.1;
        const isPack = isSah && Math.random() > 0.8;
        const cantidad = isPack ? randomBetween(1, 2) : randomBetween(1, 10);
        const precioUnit = isPack ? 2800 : isSah ? 400 : 1200;
        const costoUnit = isSah ? 375 : 320;
        const moUnit = isSah ? 175 : 0;
        const total = cantidad * precioUnit;
        const ganancia = total - cantidad * costoUnit;
        ventasJunio.push({
          producto: isSah ? 'sahumerio' : 'difusor',
          tipo: isPack ? 'pack8' : isSah ? 'suelto' : 'unidad',
          variante: isSah ? randomFrom(VARIANTES_SAH) : randomFrom(VARIANTES_DIF),
          cantidad, precioUnitario: precioUnit, total,
          costoUnitario: costoUnit, ganancia, manoDeObra: cantidad * moUnit,
          canal: 'Instagram / Domicilio',
          createdAt: new Date(2025, 5, d, randomBetween(9, 21), randomBetween(0, 59)),
        });
      }
    }

    // Ventas feria sábados: muchas más
    if (esFeria) {
      const numFeria = randomBetween(20, 45);
      for (let v = 0; v < numFeria; v++) {
        const isSah = Math.random() > 0.12;
        const isPack = isSah && Math.random() > 0.65;
        const cantidad = isPack ? randomBetween(1, 4) : randomBetween(1, 15);
        const precioUnit = isPack ? 2800 : isSah ? 400 : 1200;
        const costoUnit = isSah ? 375 : 320;
        const moUnit = isSah ? 175 : 0;
        const total = cantidad * precioUnit;
        const ganancia = total - cantidad * costoUnit;
        ventasJunio.push({
          producto: isSah ? 'sahumerio' : 'difusor',
          tipo: isPack ? 'pack8' : isSah ? 'suelto' : 'unidad',
          variante: isSah ? randomFrom(VARIANTES_SAH) : randomFrom(VARIANTES_DIF),
          cantidad, precioUnitario: precioUnit, total,
          costoUnitario: costoUnit, ganancia, manoDeObra: cantidad * moUnit,
          canal: 'Feria',
          createdAt: new Date(2025, 5, d, randomBetween(10, 18), randomBetween(0, 59)),
        });
      }
    }

    // Punto estratégico ocasional (semana de por medio)
    if (Math.random() > 0.75 && diaSemana !== 0) {
      const numPunto = randomBetween(3, 12);
      for (let v = 0; v < numPunto; v++) {
        const cantidad = randomBetween(1, 8);
        const total = cantidad * 400;
        const costoUnit = 375;
        ventasJunio.push({
          producto: 'sahumerio', tipo: 'suelto',
          variante: randomFrom(VARIANTES_SAH),
          cantidad, precioUnitario: 400, total,
          costoUnitario: costoUnit, ganancia: total - cantidad * costoUnit,
          manoDeObra: cantidad * 175, canal: 'Punto estratégico',
          createdAt: new Date(2025, 5, d, randomBetween(10, 18), randomBetween(0, 59)),
        });
      }
    }
  }

  for (const v of ventasJunio) {
    await db.venta.create({ data: v });
  }

  // ── Compras junio 2025 ─────────────────────────────────────
  const comprasJunio = [
    { proveedor: 'Aromas del Mundo', insumo: 'Esencia Vainilla', cantidad: 500, unidadMedida: 'ml', costoUnitario: 3.2, createdAt: new Date(2025, 5, 3) },
    { proveedor: 'Aromas del Mundo', insumo: 'Esencia Sándalo', cantidad: 250, unidadMedida: 'ml', costoUnitario: 4.5, createdAt: new Date(2025, 5, 3) },
    { proveedor: 'Aromas del Mundo', insumo: 'Esencia Flores Blancas', cantidad: 250, unidadMedida: 'ml', costoUnitario: 3.8, createdAt: new Date(2025, 5, 3) },
    { proveedor: 'Papelería Norte', insumo: 'Bolsa kraft 8x28', cantidad: 500, unidadMedida: 'uds', costoUnitario: 12, createdAt: new Date(2025, 5, 5) },
    { proveedor: 'Maderería San Martín', insumo: 'Varillas de álamo 30cm', cantidad: 1000, unidadMedida: 'uds', costoUnitario: 2.5, createdAt: new Date(2025, 5, 8) },
    { proveedor: 'Química Sur', insumo: 'Alcohol de cereal 96°', cantidad: 5, unidadMedida: 'lts', costoUnitario: 2800, createdAt: new Date(2025, 5, 10) },
    { proveedor: 'Química Sur', insumo: 'Harina de madera fina', cantidad: 2, unidadMedida: 'kg', costoUnitario: 1200, createdAt: new Date(2025, 5, 10) },
    { proveedor: 'Química Sur', insumo: 'Goma guar', cantidad: 200, unidadMedida: 'grs', costoUnitario: 8, createdAt: new Date(2025, 5, 10) },
    { proveedor: 'Proveedor Difusores SA', insumo: 'Difusores auto Madera (x12)', cantidad: 12, unidadMedida: 'uds', costoUnitario: 320, createdAt: new Date(2025, 5, 15) },
    { proveedor: 'Proveedor Difusores SA', insumo: 'Difusores auto Cher (x6)', cantidad: 6, unidadMedida: 'uds', costoUnitario: 320, createdAt: new Date(2025, 5, 15) },
    { proveedor: 'Proveedor Difusores SA', insumo: 'Difusores auto Fuera de Hora (x6)', cantidad: 6, unidadMedida: 'uds', costoUnitario: 320, createdAt: new Date(2025, 5, 15) },
    { proveedor: 'Aromas del Mundo', insumo: 'Esencia Nag Champa', cantidad: 250, unidadMedida: 'ml', costoUnitario: 5.2, createdAt: new Date(2025, 5, 18) },
    { proveedor: 'Papelería Norte', insumo: 'Etiquetas autoadhesivas', cantidad: 200, unidadMedida: 'uds', costoUnitario: 8, createdAt: new Date(2025, 5, 20) },
  ];
  for (const c of comprasJunio) {
    await db.compra.create({ data: { ...c, total: c.cantidad * c.costoUnitario } });
  }

  // ── Producciones junio 2025 ────────────────────────────────
  const produccionesJunio = [
    { tipo: 'sah_sin_aroma', variante: null, cantidad: 200, notas: 'Primera tanda del mes', fecha: new Date(2025, 5, 2) },
    { tipo: 'sah_aromatizado', variante: 'Vainilla', cantidad: 40, fecha: new Date(2025, 5, 4) },
    { tipo: 'sah_aromatizado', variante: 'Flores blancas', cantidad: 30, fecha: new Date(2025, 5, 4) },
    { tipo: 'sah_aromatizado', variante: 'Sándalo dulce', cantidad: 30, fecha: new Date(2025, 5, 4) },
    { tipo: 'sah_aromatizado', variante: 'Fresias', cantidad: 25, fecha: new Date(2025, 5, 4) },
    { tipo: 'sah_aromatizado', variante: 'Nag champa', cantidad: 20, fecha: new Date(2025, 5, 4) },
    { tipo: 'sah_aromatizado', variante: 'Madera', cantidad: 20, fecha: new Date(2025, 5, 4) },
    { tipo: 'sah_aromatizado', variante: 'Cher', cantidad: 15, fecha: new Date(2025, 5, 4) },
    { tipo: 'dif_entrada', variante: 'Madera', cantidad: 12, notas: 'Stock inicial', fecha: new Date(2025, 5, 15) },
    { tipo: 'dif_entrada', variante: 'Cher', cantidad: 6, fecha: new Date(2025, 5, 15) },
    { tipo: 'dif_entrada', variante: 'Fuera de hora', cantidad: 6, fecha: new Date(2025, 5, 15) },
    { tipo: 'sah_sin_aroma', variante: null, cantidad: 150, notas: 'Segunda tanda', fecha: new Date(2025, 5, 17) },
    { tipo: 'sah_aromatizado', variante: 'Vainilla coco', cantidad: 20, fecha: new Date(2025, 5, 20) },
    { tipo: 'sah_aromatizado', variante: 'Frutos rojos', cantidad: 20, fecha: new Date(2025, 5, 20) },
    { tipo: 'sah_aromatizado', variante: 'Jazmín', cantidad: 15, fecha: new Date(2025, 5, 20) },
    { tipo: 'sah_aromatizado', variante: 'Patchuli', cantidad: 15, fecha: new Date(2025, 5, 20) },
  ];
  for (const p of produccionesJunio) {
    await db.produccion.create({ data: p });
  }

  // ── Retiros junio 2025 ─────────────────────────────────────
  const retirosJunio = [
    { quien: 'Sebastián', tipo: 'mo', monto: 50000, createdAt: new Date(2025, 5, 14) },
    { quien: 'Paola', tipo: 'mo', monto: 50000, createdAt: new Date(2025, 5, 14) },
    { quien: 'Sebastián', tipo: 'ganancia', monto: 80000, createdAt: new Date(2025, 5, 28) },
    { quien: 'Paola', tipo: 'ganancia', monto: 80000, createdAt: new Date(2025, 5, 28) },
  ];
  for (const r of retirosJunio) {
    await db.retiro.create({ data: r });
  }

  // ── Inventario ────────────────────────────────────────────
  const inventario = [
    { nombre: 'Esencia Vainilla', tipo: 'insumo', stockActual: 120, stockMinimo: 200, unidadMedida: 'ml', consumoDiario: 40 },
    { nombre: 'Bolsa kraft 8x28', tipo: 'insumo', stockActual: 80, stockMinimo: 150, unidadMedida: 'uds', consumoDiario: 30 },
    { nombre: 'Varillas de álamo', tipo: 'insumo', stockActual: 200, stockMinimo: 100, unidadMedida: 'uds', consumoDiario: 25 },
    { nombre: 'Alcohol de cereal', tipo: 'insumo', stockActual: 1500, stockMinimo: 1000, unidadMedida: 'ml', consumoDiario: 200 },
    { nombre: 'Harina de madera', tipo: 'insumo', stockActual: 800, stockMinimo: 500, unidadMedida: 'grs', consumoDiario: 50 },
    { nombre: 'Goma guar', tipo: 'insumo', stockActual: 300, stockMinimo: 100, unidadMedida: 'grs', consumoDiario: 10 },
  ];
  for (const inv of inventario) {
    const idKey = inv.nombre.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    await db.inventario.upsert({
      where: { id: idKey },
      update: inv,
      create: { ...inv, id: idKey },
    });
  }

  return NextResponse.json({
    success: true,
    ventasCreadas: ventasJunio.length,
    comprasCreadas: comprasJunio.length,
    produccionesCreadas: produccionesJunio.length,
    retirosCreados: retirosJunio.length,
  });
}
