import { describe, it } from "node:test";
import assert from "node:assert";
import { Tile } from "../js/tile.js";

function storesPositionAndValue() {
  const tile = new Tile({ x: 1, y: 3 }, 8);

  assert.equal(tile.x, 1);
  assert.equal(tile.y, 3);
  assert.equal(tile.value, 8);
}

function defaultsToTwo() {
  assert.equal(new Tile({ x: 0, y: 0 }).value, 2);
}

function remembersPreviousPosition() {
  const tile = new Tile({ x: 1, y: 2 }, 2);

  tile.savePosition();
  tile.updatePosition({ x: 3, y: 2 });

  assert.deepEqual(tile.previousPosition, { x: 1, y: 2 });
  assert.equal(tile.x, 3);
}

function serializesPositionAndValue() {
  const tile = new Tile({ x: 2, y: 0 }, 16);

  assert.deepEqual(tile.serialize(), {
    position: { x: 2, y: 0 },
    value: 16
  });
}

function tileTests() {
  it("stores its position and value", storesPositionAndValue);
  it("defaults to a value of 2", defaultsToTwo);
  it("remembers its previous position", remembersPreviousPosition);
  it("serializes its position and value", serializesPositionAndValue);
}

describe("Tile", tileTests);
