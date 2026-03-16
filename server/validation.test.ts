import test from "node:test";
import assert from "node:assert/strict";
import { HttpError, ensureDateOrder, parseDateOnly, parseMoney, startOfTodayUtc } from "./validation";

test("parseDateOnly accepts valid ISO date", () => {
  const parsed = parseDateOnly("2026-03-15", "data");
  assert.equal(parsed.toISOString(), "2026-03-15T00:00:00.000Z");
});

test("parseDateOnly rejects invalid date", () => {
  assert.throws(
    () => parseDateOnly("2026-02-30", "data"),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  );
});

test("ensureDateOrder rejects inverted dates", () => {
  assert.throws(
    () => ensureDateOrder("2026-03-16", "2026-03-15", "inicio", "fim"),
    (error: unknown) => error instanceof HttpError && error.message.includes("nao pode ser menor"),
  );
});

test("parseMoney accepts numeric strings", () => {
  assert.equal(parseMoney("12.50", "valor"), 12.5);
});

test("parseMoney rejects negative values", () => {
  assert.throws(
    () => parseMoney(-1, "valor"),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  );
});

test("startOfTodayUtc normalizes time", () => {
  const normalized = startOfTodayUtc(new Date("2026-03-15T18:45:33.000Z"));
  assert.equal(normalized.toISOString(), "2026-03-15T00:00:00.000Z");
});
