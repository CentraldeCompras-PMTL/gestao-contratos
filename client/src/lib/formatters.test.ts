import test from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, formatDate, parseNumberString } from "./formatters";

test("formatCurrency formats number to BRL", () => {
  assert.equal(formatCurrency(10), "R$ 10,00");
});

test("formatDate formats YYYY-MM-DD string", () => {
  assert.equal(formatDate("2026-03-15"), "15/03/2026");
});

test("parseNumberString parses decimal strings", () => {
  assert.equal(parseNumberString("12.34"), 12.34);
});

test("parseNumberString returns zero for invalid values", () => {
  assert.equal(parseNumberString("abc"), 0);
});
