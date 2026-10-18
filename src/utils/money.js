import Decimal from "decimal.js";
export function convert(value, from, to, quote) {
  if (!["ILS", "USD"].includes(from)) return null;
  if (from === to) return Number(value);
  if (
    quote?.status !== "available" ||
    !quote.rate ||
    Date.now() >= Date.parse(quote.expiresAt)
  )
    return null;
  const amount = new Decimal(value);
  const converted =
    from === "USD" ? amount.times(quote.rate) : amount.div(quote.rate);
  return converted.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}
export const lineTotal = (items) =>
  items
    .reduce(
      (sum, item) =>
        sum.plus(
          new Decimal(item.quantity || 0)
            .times(item.unitPrice || 0)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
        ),
      new Decimal(0),
    )
    .toNumber();
