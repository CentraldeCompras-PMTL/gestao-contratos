import test from "node:test";
import assert from "node:assert/strict";
import { buildUrl } from "./routes";

test("buildUrl replaces route params", () => {
  assert.equal(buildUrl("/api/contratos/:id", { id: "123" }), "/api/contratos/123");
});

test("buildUrl leaves untouched segments without params", () => {
  assert.equal(buildUrl("/api/contratos"), "/api/contratos");
});

test("buildUrl replaces multiple params", () => {
  assert.equal(
    buildUrl("/api/contratos/:contratoId/empenhos/:empenhoId", { contratoId: "c1", empenhoId: "e1" }),
    "/api/contratos/c1/empenhos/e1",
  );
});
