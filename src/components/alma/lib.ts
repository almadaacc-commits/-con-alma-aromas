const VARIANTES_SAH = [
  "Flores blancas","Fresias","Sándalo dulce","Vainilla","Vainilla coco",
  "Frutos rojos","Fuera de hora","Naranja pimienta","Nag champa","Mirra",
  "Madera","Patchuli","Reina de la noche","Manantial herbal","Cher",
  "Caléndula","Nardo","Citronela","Cítrico zen","Jazmín","Tilo",
];
const VARIANTES_DIF = ["Cher","Fuera de hora","Madera"];
const CANALES = ["Feria","Instagram / Domicilio","Punto estratégico","Mayorista pack","Mayorista granel"];

export const formatARS = (n: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

export const pct = (a: number, b: number): string =>
  b > 0 ? ((a / b) * 100).toFixed(0) + '%' : '—';

export { VARIANTES_SAH, VARIANTES_DIF, CANALES };