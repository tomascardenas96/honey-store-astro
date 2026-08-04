import { useStore } from "@nanostores/react";
import {
  buildLines,
  cartItems,
  clearCart,
  removeItem,
  setQty,
} from "@/lib/cart";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";

interface Props {
  catalog: Product[];
}

const qtyButtonClass =
  "px-3 py-1 cursor-pointer transition hover:bg-honey-500 hover:text-white";

export default function CartView({ catalog }: Props) {
  const items = useStore(cartItems);

  // Lo guardado son solo ids y cantidades; nombre, precio e imagen salen del
  // catálogo que llegó como prop desde el build.
  const lines = buildLines(items, catalog);
  const total = lines.reduce((acc, line) => acc + line.subtotal, 0);

  if (lines.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-6 py-16">
        <p className="font-body text-base text-[#000000cb]">
          Tu carrito está vacío.
        </p>
        <a
          href="/"
          className="border-2 px-8 py-3 text-md tracking-wide transition hover:bg-honey-500 hover:text-white"
        >
          VER PRODUCTOS
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-16">
      <ul className="flex flex-col">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex flex-wrap items-center gap-4 border-b border-[#828282] py-6"
          >
            <img
              src={line.image}
              alt={line.name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-card object-cover"
            />

            <div className="flex flex-1 flex-col gap-1">
              <a
                href={`/productos/${line.id}`}
                className="font-body text-sm hover:underline"
              >
                {line.name}
              </a>
              <span className="font-body text-sm text-[#000000cb]">
                {formatPrice(line.price)} c/u
              </span>
            </div>

            <div className="flex items-center border border-[#828282]">
              <button
                type="button"
                aria-label={`Quitar una unidad de ${line.name}`}
                onClick={() => setQty(line.id, line.qty - 1)}
                className={qtyButtonClass}
              >
                −
              </button>
              <span className="w-10 text-center font-body text-sm">
                {line.qty}
              </span>
              <button
                type="button"
                aria-label={`Agregar una unidad de ${line.name}`}
                onClick={() => setQty(line.id, line.qty + 1)}
                className={qtyButtonClass}
              >
                +
              </button>
            </div>

            <span className="w-28 text-right font-semibold">
              {formatPrice(line.subtotal)}
            </span>

            <button
              type="button"
              onClick={() => removeItem(line.id)}
              className="cursor-pointer font-body text-xs text-honey-700 underline transition hover:text-honey-900"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={clearCart}
          className="cursor-pointer font-body text-sm text-honey-700 underline transition hover:text-honey-900"
        >
          Vaciar carrito
        </button>
        <span className="text-2xl font-semibold">
          Total: {formatPrice(total)}
        </span>
      </div>

      <a
        href={buildWhatsappUrl(lines, total)}
        target="_blank"
        rel="noopener noreferrer"
        className="self-end border-2 px-8 py-3 text-md tracking-wide transition hover:bg-honey-500 hover:text-white"
      >
        FINALIZAR PEDIDO POR WHATSAPP
      </a>
    </div>
  );
}
