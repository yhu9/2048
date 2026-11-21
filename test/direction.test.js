import { describe, it } from "node:test";
import assert from "node:assert";
import { Direction } from "../js/direction.js";

function numbersTheDirections() {
  assert.deepEqual({ ...Direction }, { up: 0, right: 1, down: 2, left: 3 });
}

function cannotBeChanged() {
  assert.ok(Object.isFrozen(Direction));
}

function directionTests() {
  it("numbers up, right, down and left from 0 to 3", numbersTheDirections);
  it("is frozen", cannotBeChanged);
}

describe("Direction", directionTests);
