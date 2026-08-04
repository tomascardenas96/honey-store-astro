import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useStore } from "@nanostores/react";
import {
  buildLines,
  cartItems,
  clearCart,
  removeItem,
  setQty,
} from "@/lib/cart";
import type { CartLine } from "@/lib/cart";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";

interface Props {
  catalog: Product[];
}

// El área táctil de `px-3 py-1` da unos 30x26: chica para el pulgar y fácil de
// errar entre el − y el +. Los mínimos la llevan a 40x40 sin tocar el padding,
// así que de sm en adelante el botón queda exactamente como estaba.
const qtyButtonClass =
  "px-3 py-1 cursor-pointer transition hover:bg-honey-500 hover:text-white active:scale-90 max-sm:min-h-10 max-sm:min-w-10 max-sm:text-lg";

// Un número que late cuando cambia: la key es el valor, así que al cambiar el
// nodo se remonta y la animación arranca sola. El ref se saltea el primer
// render: al abrir la página los números llegan con la cascada de entrada, no
// latiendo todos a la vez.
function Bump({
  value,
  className,
  children,
}: {
  value: number;
  className?: string;
  children: ReactNode;
}) {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <span
      key={value}
      data-cart-bump={mounted.current ? "" : undefined}
      className={className}
    >
      {children}
    </span>
  );
}

export default function CartView({ catalog }: Props) {
  const items = useStore(cartItems);

  // Alturas de las líneas que se están yendo, indexadas por id. Sacar una del
  // store la borra del DOM en el acto, así que primero la animamos y recién
  // cuando termina tocamos el store.
  const [exiting, setExiting] = useState<Record<string, number>>({});
  const nodes = useRef(new Map<string, HTMLLIElement>());

  // Lo guardado son solo ids y cantidades; nombre, precio e imagen salen del
  // catálogo que llegó como prop desde el build.
  const lines = buildLines(items, catalog);
  const total = lines.reduce((acc, line) => acc + line.subtotal, 0);

  // La cascada de entrada del total y del botón se calcula una sola vez: si
  // después se elimina una línea no queremos que el retraso se recalcule
  // mientras la animación todavía corre.
  const initialCount = useRef(lines.length).current;

  // La altura se mide acá porque el CSS no puede animar desde `auto`. Si el
  // nodo no está (algo raro pasó), borramos sin animar antes que no borrar.
  const startExit = (id: string) => {
    const height = nodes.current.get(id)?.offsetHeight;
    if (!height) return removeItem(id);

    setExiting((prev) => ({ ...prev, [id]: height }));
  };

  const finishExit = (id: string) => {
    setExiting((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    removeItem(id);
  };

  // Bajar de 1 es eliminar, así que pasa por la misma animación que "Eliminar".
  const handleDecrease = (line: CartLine) => {
    if (line.qty <= 1) return startExit(line.id);
    setQty(line.id, line.qty - 1);
  };

  // Vaciar es sacar todas juntas: se miden todas y salen a la vez. Cada línea
  // llama a `removeItem` al terminar su animación, así que el store se vacía
  // solo. Si alguna no se pudo medir, vaciamos derecho y listo.
  const handleClear = () => {
    const heights: Record<string, number> = {};

    for (const line of lines) {
      const height = nodes.current.get(line.id)?.offsetHeight;
      if (!height) return clearCart();
      heights[line.id] = height;
    }

    setExiting(heights);
  };

  // Una vez que el pedido salió por WhatsApp el carrito ya cumplió: se vacía
  // (y con él lo guardado en localStorage, porque el store es persistente).
  // El vaciado va diferido un tick a propósito: si limpiás el store dentro del
  // handler, React re-renderiza el estado vacío y saca este <a> del DOM antes
  // de que el navegador llegue a abrir el link. Acá no animamos la salida por
  // lo mismo: la página ya está entregando el pedido.
  const handleCheckout = () => {
    setTimeout(clearCart, 0);
  };

  if (lines.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-6 py-12 sm:py-16">
        <p data-cart-enter className="font-body text-base text-[#000000cb]">
          Tu carrito está vacío.
        </p>
        <a
          href="/#products"
          data-cart-enter
          style={{ "--cart-index": 1 } as CSSProperties}
          className="w-full max-w-72 border-2 px-8 py-3 text-center text-md tracking-wide transition hover:bg-honey-500 hover:text-white sm:w-auto"
        >
          VER PRODUCTOS
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-8 sm:gap-10 xl:gap-16">
      <ul className="flex flex-col">
        {/* Dos layouts para la misma línea. En mobile no entra todo en una fila
            de 327px útiles, así que va una grilla de dos filas: foto + nombre
            arriba, y los controles abajo ocupando el ancho completo. De sm en
            adelante vuelve a ser la fila única de siempre. */}
        {lines.map((line, index) => {
          const exitHeight = exiting[line.id];

          return (
            <li
              key={line.id}
              ref={(node) => {
                if (node) nodes.current.set(line.id, node);
                return () => {
                  nodes.current.delete(line.id);
                };
              }}
              data-cart-enter
              data-cart-exit={exitHeight ? "" : undefined}
              // Solo la salida escucha: la entrada, si la salida la pisa antes
              // de terminar, dispara `animationcancel`, no `animationend`. La
              // comparación con `currentTarget` descarta los latidos de los
              // números, que burbujean desde adentro de la línea.
              onAnimationEnd={
                exitHeight
                  ? (event) => {
                      if (event.target === event.currentTarget)
                        finishExit(line.id);
                    }
                  : undefined
              }
              style={
                {
                  "--cart-index": index,
                  "--cart-exit-height": exitHeight
                    ? `${exitHeight}px`
                    : undefined,
                } as CSSProperties
              }
              className="group grid grid-cols-[5rem_1fr] items-center gap-x-4 gap-y-3 border-b border-[#828282] py-4 sm:flex sm:flex-wrap sm:gap-y-4 sm:py-3 xl:py-6"
            >
              <img
                src={line.image}
                alt={line.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-card object-cover transition-transform duration-300 ease-out-soft group-hover:scale-105"
              />

              {/* min-w-0: en la grilla la columna es `1fr`, pero un ítem no baja
                  de su contenido mínimo salvo que se lo pidas. Sin esto un
                  nombre largo estira la columna y desborda la fila. */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
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

              {/* Este envoltorio existe solo en mobile: agrupa los controles en
                  la segunda fila de la grilla. En sm se vuelve `display:
                  contents`, así que la caja desaparece y sus tres hijos pasan a
                  ser ítems flex de la línea, en el mismo orden que antes. */}
              <div className="col-span-2 flex items-center justify-between gap-3 sm:contents">
                <div className="flex items-center border border-[#828282]">
                  <button
                    type="button"
                    aria-label={`Quitar una unidad de ${line.name}`}
                    onClick={() => handleDecrease(line)}
                    className={qtyButtonClass}
                  >
                    −
                  </button>
                  <Bump
                    value={line.qty}
                    className="w-10 text-center font-body text-sm"
                  >
                    {line.qty}
                  </Bump>
                  <button
                    type="button"
                    aria-label={`Agregar una unidad de ${line.name}`}
                    onClick={() => setQty(line.id, line.qty + 1)}
                    className={qtyButtonClass}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => startExit(line.id)}
                  className="cursor-pointer py-1.5 font-body text-sm text-honey-700 underline transition hover:text-honey-900 sm:order-last sm:py-0 sm:text-xs"
                >
                  Eliminar
                </button>

                <Bump
                  value={line.subtotal}
                  className="text-right font-semibold sm:w-28"
                >
                  {formatPrice(line.subtotal)}
                </Bump>
              </div>
            </li>
          );
        })}
      </ul>

      {/* col-reverse: en mobile el total va arriba, que es el dato que se viene
          a buscar, y "Vaciar carrito" queda abajo lejos del pulgar. El orden del
          DOM no cambia, así que en sm la fila queda igual que siempre. */}
      <div
        data-cart-enter
        style={{ "--cart-index": initialCount } as CSSProperties}
        className="flex flex-col-reverse gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4"
      >
        <button
          type="button"
          onClick={handleClear}
          className="cursor-pointer self-start font-body text-sm text-honey-700 underline transition hover:text-honey-900 sm:self-auto"
        >
          Vaciar carrito
        </button>
        {/* En mobile el importe se va al borde derecho y el rótulo queda a la
            izquierda; en sm los dos vuelven a leerse como una sola frase. */}
        <span className="flex w-full items-baseline justify-between gap-2 border-t border-[#828282] pt-5 text-2xl font-semibold sm:w-auto sm:border-0 sm:pt-0">
          <span>Total:</span>
          <Bump value={total}>{formatPrice(total)}</Bump>
        </span>
      </div>

      <a
        href={buildWhatsappUrl(lines, total)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleCheckout}
        data-cart-enter
        style={{ "--cart-index": initialCount + 1 } as CSSProperties}
        className="border-2 px-6 py-4 text-center text-md tracking-wide transition hover:-translate-y-0.5 hover:bg-honey-500 hover:text-white hover:shadow-raised active:translate-y-0 max-sm:leading-tight sm:self-end sm:px-8 sm:py-3"
      >
        FINALIZAR PEDIDO POR WHATSAPP
      </a>
    </div>
  );
}
