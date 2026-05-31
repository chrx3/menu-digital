import { Categoria, PreciosSandwich } from '../types';

/** Mismo precio para lomito y churrasco; mechada aparte */
function preciosSandwich(
  lomitoOChurrasco: number,
  promoLomitoChurrasco: number | null,
  mechada: number,
  promoMechada: number | null,
): PreciosSandwich {
  const base = {
    individual: lomitoOChurrasco,
    promo_2x: promoLomitoChurrasco,
  };
  return {
    lomito: { ...base },
    churrasco: { ...base },
    mechada: { individual: mechada, promo_2x: promoMechada },
  };
}

const rawMenu: Categoria[] = [
  {
    id: 'papas_supremas',
    titulo: 'Papas Supremas',
    descripcion: 'Base de papas fritas y carne',
    items: [
      { nombre: 'Cheddar', ingredientes: ['Tomate', 'Cheddar', 'Cebollín'], precios: { chica: 4500, grande: 7900, familiar: 13900 } },
      { nombre: 'Italiana', ingredientes: ['Tomate', 'Palta', 'Mayo'], precios: { chica: 4500, grande: 7900, familiar: 13900 } },
      { nombre: 'Chacarera', ingredientes: ['Tomate', 'Poroto verde', 'Ají verde', 'Mayo'], precios: { chica: 4500, grande: 7900, familiar: 13900 } },
      { nombre: 'Mexicana', ingredientes: ['Palta', 'Tomate', 'Cebollín', 'Ají verde'], precios: { chica: 4500, grande: 7900, familiar: 13900 } },
      { nombre: 'Napolitana', ingredientes: ['Tomate', 'Aceituna', 'Queso caliente', 'Orégano'], precios: { chica: 4500, grande: 7900, familiar: 13900 } },
      { nombre: 'Chorrillana', ingredientes: ['Cebolla caramelizada', 'Huevo frito', 'Salchichas'], precios: { chica: 5000, grande: 8700, familiar: 15500 } }
    ]
  },
  {
    id: 'fajitas',
    titulo: 'Fajitas',
    descripcion: 'Fajitas armadas con opciones de Pollo, Lomito o Churrasco',
    items: [
      { nombre: 'Italiana', ingredientes: ['Tomate', 'Palta', 'Mayo'], precios: { pollo: 3200, lomito: 3700, churrasco: 3700 } },
      { nombre: 'Clásica', ingredientes: ['Tomate', 'Lechuga', 'Palta', 'Mayo'], precios: { pollo: 3400, lomito: 3700, churrasco: 3700 } },
      { nombre: 'Chacarera', ingredientes: ['Tomate', 'Poroto verde', 'Ají verde', 'Mayo'], precios: { pollo: 3400, lomito: 3700, churrasco: 3700 } },
      { nombre: 'Mexicana', ingredientes: ['Palta', 'Tomate', 'Cebollín', 'Ají verde'], precios: { pollo: 3400, lomito: 3700, churrasco: 3700 } },
      { nombre: 'Napolitana', ingredientes: ['Tomate', 'Aceituna', 'Queso caliente', 'Orégano'], precios: { pollo: 3400, lomito: 3700, churrasco: 3700 } },
      { nombre: 'A lo Pobre', ingredientes: ['Papas fritas', 'Cebolla caramelizada', 'Huevo frito'], precios: { pollo: 3900, lomito: 4400, churrasco: 4400 } }
    ]
  },
  {
    id: 'pollo_asado',
    titulo: 'Pollo Asado y Promos',
    descripcion: 'Pollo asado tierno y combos con papas y bebida',
    items: [
      { nombre: '01. Pollo Entero', incluye: ['Pollo entero solo'], precio: 13500 },
      { nombre: '02. 1/2 Pollo', incluye: ['Medio pollo solo'], precio: 7500 },
      { nombre: '03. Pollo Entero + Caja de Papas', incluye: ['Pollo entero', 'Caja de papas completas'], precio: 18000 },
      { nombre: '04. Pollo Entero + C. Papas + Bebida 2 Lt', incluye: ['Pollo entero', 'Caja de papas', 'Bextible 2 Litros'], precio: 20000 },
      { nombre: '05. 1/2 Pollo + Papa Mediana', incluye: ['Medio pollo', 'Papas fritas medianas'], precio: 9000 },
      { nombre: '06. 1/2 Pollo + Papa Grande', incluye: ['Medio pollo', 'Papas fritas grandes'], precio: 10500 },
      { nombre: '07. 1/2 Pollo + Caja de Papas', incluye: ['Medio pollo', 'Caja de papas familiar'], precio: 12500 },
      { nombre: '08. 1/4 Pollo Tuto + Papas (Colación)', incluye: ['Un cuarto de pollo tuto', 'Papas fritas'], precio: 5000 },
      { nombre: '09. 1/4 Pollo Pechuga + Papas (Colación)', incluye: ['Un cuarto de pollo pechuga', 'Papas fritas'], precio: 5500 }
    ]
  },
  {
    id: 'sandwiches',
    titulo: 'Sándwiches',
    descripcion: '¡Aprovecha las promociones llevando 2 unidades!',
    items: [
      { nombre: 'Solo Carne', ingredientes: ['Carne sola'], precios: preciosSandwich(2800, null, 3300, null) },
      { nombre: 'Completo ó Italiano', ingredientes: ['Tomate', 'Palta', 'Mayo', 'o Chucrut/Americana'], precios: preciosSandwich(3500, 6500, 4200, 7900) },
      { nombre: 'Luco', ingredientes: ['Queso caliente derretido'], precios: preciosSandwich(3500, 6500, 4200, 7900) },
      { nombre: 'Chacarera', ingredientes: ['Tomate', 'Poroto verde', 'Ají verde', 'Mayo'], precios: preciosSandwich(3500, 6500, 4200, 7900) },
      { nombre: 'Brasileño', ingredientes: ['Queso caliente', 'Palta'], precios: preciosSandwich(3700, 7000, 4500, 8500) },
      { nombre: 'Dinámico', ingredientes: ['Tomate', 'Palta', 'Mayo', 'Chucrut', 'Americana'], precios: preciosSandwich(3700, 7000, 4700, 8500) },
      { nombre: 'Napolitano', ingredientes: ['Tomate', 'Aceituna', 'Queso caliente', 'Orégano'], precios: preciosSandwich(4000, 7500, 4700, 8500) },
      { nombre: 'A lo Pobre', ingredientes: ['Papas fritas', 'Huevo frito', 'Cebolla caramelizada'], precios: preciosSandwich(4000, 7500, 4800, 8900) }
    ]
  },
  {
    id: 'vienesas_y_ases',
    titulo: 'Vienesas y Ases XL',
    descripcion: 'El clásico chileno en formato XL o con carne picada (As)',
    items: [
      { nombre: 'Sola', ingredientes: ['Solo pan y proteína'], precios: { vienesa_xl: 1400, as_xl: 2500 } },
      { nombre: 'Completo', ingredientes: ['Tomate', 'Chucrut', 'Americana', 'Mayo'], precios: { vienesa_xl: 2400, as_xl: 3200 } },
      { nombre: 'Italiano', ingredientes: ['Tomate', 'Palta', 'Mayo'], precios: { vienesa_xl: 2400, as_xl: 3200 } },
      { nombre: 'Luco', ingredientes: ['Queso caliente'], precios: { vienesa_xl: 2400, as_xl: 3200 } },
      { nombre: 'Chacarera', ingredientes: ['Tomate', 'Poroto verde', 'Ají verde', 'Mayo'], precios: { vienesa_xl: 2900, as_xl: 3900 } },
      { nombre: 'Dinámico', ingredientes: ['Tomate', 'Palta', 'Mayo', 'Americana', 'Chucrut'], precios: { vienesa_xl: 2900, as_xl: 3900 } },
      { nombre: 'Brasileño', ingredientes: ['Palta', 'Queso caliente'], precios: { vienesa_xl: 2900, as_xl: 3900 } },
      { nombre: 'Napolitano', ingredientes: ['Tomate', 'Aceituna', 'Queso caliente', 'Orégano'], precios: { vienesa_xl: 2900, as_xl: 3900 } },
      { nombre: 'A lo Pobre', ingredientes: ['Papas fritas', 'Huevo frito', 'Cebolla caramelizada'], precios: { vienesa_xl: 3200, as_xl: 4200 } }
    ]
  },
  {
    id: 'snacks',
    titulo: 'Snacks y Acompañamientos',
    descripcion: 'Porciones extras, empanadas y sopaipillas',
    items: [
      { nombre: 'Empanadas de Queso (3 unidades)', detalle: 'Media luna 12 cm', precio: 1200 },
      { nombre: 'Boxkid', detalle: 'Salchipapa + 2 empanaditas + 5 nuggets', precio: 5000 },
      { nombre: '10 Nuggets de Pollo', detalle: 'Porción clásica', precio: 3200 },
      { nombre: '18 Nuggets de Pollo', detalle: 'Porción grande', precio: 5800 },
      { nombre: '3 Sopaipillas', detalle: 'Tradicionales', precio: 1000 },
      { nombre: '7 Sopaipillas', detalle: 'Para compartir', precio: 2000 }
    ]
  }
];

export const menuData: Categoria[] = rawMenu.map((categoria) => ({
  ...categoria,
  items: categoria.items,
}));
