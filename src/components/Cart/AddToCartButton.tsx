import { useEffect, useRef, useState } from "react";
import { addItem } from "@/lib/cart";

interface Props {
  id: string;
  className?: string;
}

// Este componente solo ESCRIBE en el carrito, nunca lo lee durante el render.
// Por eso puede ir con client:load y aprovechar el HTML pre-renderizado.
export default function AddToCartButton({ id, className }: Props) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleClick() {
    addItem(id);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {added ? "AGREGADO ✓" : "AÑADIR"}
    </button>
  );
}
