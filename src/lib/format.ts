const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// 2500 -> "$ 2.500"
export function formatPrice(value: number): string {
  return currency.format(value);
}
