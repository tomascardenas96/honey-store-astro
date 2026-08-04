import { useStore } from "@nanostores/react";
import { totalItems } from "@/lib/cart";

interface Props {
  variant?: "text" | "badge";
}

// Isla mínima: solo el número. El ícono y la palabra "CARRITO" quedan en HTML
// estático dentro del Header, así el encabezado no salta mientras hidrata.
export default function CartCount({ variant = "badge" }: Props) {
  const count = useStore(totalItems);

  if (variant === "text") return <>[{count}]</>;

  // El globito aparece solo si hay algo: un "0" flotando se ve roto.
  if (count === 0) return null;

  // La key es el número: al cambiar, el nodo se remonta y el globito vuelve a
  // saltar. Los estilos viven en `@/styles/cart.css`.
  return (
    <div
      key={count}
      data-cart-badge
      className="w-4.5 h-4.5 rounded-full bg-honey-400 absolute -top-2 -right-1 flex justify-center items-center"
    >
      <p className="font-bold text-xs text-white">{count}</p>
    </div>
  );
}
