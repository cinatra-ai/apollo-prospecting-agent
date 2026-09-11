// Bridge-output item members — the prospect node asks the model for exactly the
// shape this file declares, so every field the node's own instructions tell the
// model to append to `failures[]` has to be a declared member of the item.
//
// The runtime sends an object level with no declared members CLOSED and EMPTY
// (the strict structured-output contract has no open map), so an undeclared
// member arrives as nothing at all. These assertions pin the members against
// the five failure sites the node's own system prompt spells out.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const oas = JSON.parse(readFileSync(join(root, "cinatra/oas.json"), "utf8"));
const components = oas.$referenced_components ?? {};

function output(nodeId, title) {
  const node = components[nodeId];
  assert.ok(node, `no component ${nodeId}`);
  const found = (node.outputs ?? []).find((out) => out?.title === title);
  assert.ok(found, `node ${nodeId} declares no output ${title}`);
  return found;
}

function itemsOf(prop) {
  return prop.items ?? prop.json_schema?.items;
}

test("the prospect node's failures output declares its item members", () => {
  const failures = output("prospect", "failures");
  assert.equal(failures.type, "array");
  const items = itemsOf(failures);
  assert.ok(
    items && typeof items === "object" && !Array.isArray(items),
    "failures declares no items object",
  );
  assert.equal(items.type, "object");
  const members = items.properties;
  assert.ok(
    members && typeof members === "object",
    "failures[] declares no members (properties)",
  );
  assert.deepEqual(Object.keys(members).sort(), [
    "contactId",
    "domain",
    "error",
    "listId",
    "name",
  ]);
});

test("name and error are declared strings and required on every failure entry", () => {
  const items = itemsOf(output("prospect", "failures"));
  assert.equal(items.properties?.name?.type, "string");
  assert.equal(items.properties?.error?.type, "string");
  assert.deepEqual([...(items.required ?? [])].sort(), ["error", "name"]);
});

test("the per-site extras are declared nullable strings", () => {
  const items = itemsOf(output("prospect", "failures"));
  for (const member of ["domain", "listId", "contactId"]) {
    assert.deepEqual(items.properties?.[member]?.type, ["string", "null"], member);
  }
});

test("every declared failure member carries a description", () => {
  const items = itemsOf(output("prospect", "failures"));
  const members = items.properties;
  assert.ok(members && typeof members === "object", "failures[] declares no members");
  assert.equal(Object.keys(members).length, 5);
  for (const [name, member] of Object.entries(members)) {
    assert.equal(typeof member.description, "string", name);
    assert.ok(member.description.length > 0, name);
  }
});
