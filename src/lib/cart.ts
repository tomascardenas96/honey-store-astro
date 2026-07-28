import type { Product } from "./catalog";
import { persistentAtom } from "@nanostores/persistent";
import { computed, keepMount } from "nanostores";

export interface CartItem {
  id: string;
  qty: number;
}

const MAX_QTY = 99;

export const cartItems = persistentAtom<CartItem[]>("apiare:cart:v1", [], {
  encode: JSON.stringify,
  decode: (value) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
});

// Deja el store siempre "montado": sin esto, un .get() hecho desde un
// componente que no está suscripto (el botón AÑADIR) puede leer el valor
// inicial vacío en vez de lo guardado, y pisarte el carrito.
// Solo en el navegador: en el server (workerd) no hay localStorage al que
// engancharse, y este módulo se evalúa ahí cuando lo importa una isla
// renderizada con client:load.
if (typeof window !== "undefined") {
  keepMount(cartItems);
}

export function addItem(id: string, qty = 1) {
  const items = cartItems.get();
  const found = items.find((item) => item.id === id);

  if (!found) {
    cartItems.set([...items, { id, qty: Math.min(qty, MAX_QTY) }]);
    return;
  }

  cartItems.set(
    items.map((item) =>
      item.id === id
        ? { ...item, qty: Math.min(item.qty + qty, MAX_QTY) }
        : item,
    ),
  );
}

export function setQty(id: string, qty: number) {
  if (qty <= 0) return removeItem(id);

  cartItems.set(
    cartItems
      .get()
      .map((item) =>
        item.id === id ? { ...item, qty: Math.min(qty, MAX_QTY) } : item,
      ),
  );
}

export function removeItem(id: string) {
  const items = cartItems.get();

  cartItems.set(items.filter((item) => item.id !== id));
}

export function clearCart() {
  cartItems.set([]);
}

// Total de unidades (no de líneas): sirve para el globito del header.
export const totalItems = computed(cartItems, (items) =>
  items.reduce((acc, item) => acc + item.qty, 0),
);

export interface CartLine extends Product {
  qty: number;
  subtotal: number;
}

// El cruce entre lo guardado y el catálogo real del build.
// Acá el precio se resuelve SIEMPRE contra el catálogo, nunca contra el
// localStorage: si cambiás un precio en el .md, el carrito lo refleja solo.
// Y si un producto se borró de la colección, su línea desaparece en vez de
// quedar como fantasma.
export function buildLines(items: CartItem[], catalog: Product[]): CartLine[] {
  return items.flatMap((item) => {
    const product = catalog.find((entry) => entry.id === item.id);
    if (!product) return [];

    return [{ ...product, qty: item.qty, subtotal: product.price * item.qty }];
  });
}
