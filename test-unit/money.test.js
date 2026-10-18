import test from "node:test";
import assert from "node:assert/strict";
import { convert, lineTotal } from "../src/utils/money.js";
import { csvCell, csvText } from "../src/utils/export.js";
test("display conversions match server rounding and reject unavailable or expired rates", () => {
  const quote = {
    status: "available",
    rate: "3.65",
    expiresAt: new Date(Date.now() + 10000).toISOString(),
  };
  assert.equal(convert(100, "USD", "ILS", quote), 365);
  assert.equal(convert(365, "ILS", "USD", quote), 100);
  assert.equal(convert(0.01, "USD", "ILS", { ...quote, rate: "3.5" }), 0.04);
  assert.equal(convert(100, undefined, "USD", quote), null);
  assert.equal(convert(100, "USD", "ILS", { status: "unavailable" }), null);
  assert.equal(
    convert(100, "USD", "ILS", { ...quote, expiresAt: "2000-01-01" }),
    null,
  );
  assert.equal(
    lineTotal([
      { quantity: 0.125, unitPrice: 0.2 },
      { quantity: 3, unitPrice: 0.1 },
    ]),
    0.33,
  );
});
test("CSV retains Arabic and quotes while neutralizing spreadsheet formulas", () => {
  assert.equal(
    csvCell('=HYPERLINK("https://example.test")'),
    '"\'=HYPERLINK(""https://example.test"")"',
  );
  assert.equal(csvCell("  =1+1"), '"\'  =1+1"');
  assert.match(
    csvText([["فاتورة", "USD", 12.34]]),
    /^\ufeff"فاتورة","USD","12.34"$/,
  );
});
