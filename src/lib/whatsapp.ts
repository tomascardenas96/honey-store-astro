// Formato internacional, sin "+", sin espacios ni guiones. Ej: 5493815551234.
// Va con prefijo PUBLIC_ porque se usa en el cliente para armar el link, y de
// todas formas el número termina siendo visible en el href.
// Declarada en astro:env, así que ya no hace falta el `?? ""`: si la variable
// falta, el build falla en vez de dejar pasar un link roto.
import { PUBLIC_WHATSAPP_PHONE } from "astro:env/client";
import type { CartLine } from "./cart";
import { formatPrice } from "./format";

export function buildWhatsappUrl(lines: CartLine[], total: number): string {
  const detalle = lines
    .map(
      (line) => `• ${line.qty}x ${line.name} — ${formatPrice(line.subtotal)}`,
    )
    .join("\n");

  const message = [
    "¡Hola! Quiero hacer este pedido:",
    "",
    detalle,
    "",
    `Total: ${formatPrice(total)}`,
  ].join("\n");

  // encodeURIComponent no es opcional: sin él los saltos de línea y los
  // caracteres especiales rompen la URL.
  return `https://wa.me/${PUBLIC_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
