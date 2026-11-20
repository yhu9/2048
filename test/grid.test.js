import { describe, it } from "node:test";
import assert from "node:assert";
import { Grid } from "../js/grid.js";
import { Tile } from "../js/tile.js";

function startsEmpty() {
  const grid = new Grid(4);

  assert.equal(grid.size, 4);
  assert.equal(grid.availableCells().length, 16);
  assert.ok(grid.cellsAvailable());
}

function insertsAndRemovesTiles() {
  const grid = new Grid(4);
  const tile = new Tile({ x: 2, y: 3 }, 4);

  grid.insertTile(tile);
  assert.equal(grid.cellContent({ x: 2, y: 3 }), tile);
  assert.ok(grid.cellOccupied({ x: 2, y: 3 }));

  grid.removeTile(tile);
  assert.equal(grid.cellContent({ x: 2, y: 3 }), null);
  assert.ok(grid.cellAvailable({ x: 2, y: 3 }));
}

function treatsOutsideCellsAsOutOfBounds() {
  const grid = new Grid(4);

  assert.ok(grid.withinBounds({ x: 3, y: 3 }));
  assert.ok(!grid.withinBounds({ x: 4, y: 0 }));
  assert.ok(!grid.withinBounds({ x: 0, y: -1 }));
  assert.equal(grid.cellContent({ x: 4, y: 0 }), null);
}

function listsAvailableCells() {
  const grid = new Grid(2);
  grid.insertTile(new Tile({ x: 0, y: 0 }, 2));

  assert.deepEqual(grid.availableCells(), [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 }
  ]);

  grid.availableCells().forEach((cell) => grid.insertTile(new Tile(cell)));
  assert.ok(!grid.cellsAvailable());
  assert.equal(grid.randomAvailableCell(), undefined);
}

function picksAFreeCellWithTheRandomSource() {
  const grid = new Grid(2);
  grid.insertTile(new Tile({ x: 0, y: 0 }, 2));

  // Free cells, in order: (0,1), (1,0), (1,1)
  assert.deepEqual(grid.randomAvailableCell(() => 0), { x: 0, y: 1 });
  assert.deepEqual(grid.randomAvailableCell(() => 0.5), { x: 1, y: 0 });
  assert.deepEqual(grid.randomAvailableCell(() => 0.99), { x: 1, y: 1 });
}

function rebuildsFromSerializedState() {
  const grid = new Grid(3);
  grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
  grid.insertTile(new Tile({ x: 2, y: 1 }, 64));

  const state = grid.serialize();
  const copy = new Grid(state.size, state.cells);

  assert.deepEqual(copy.serialize(), state);
  assert.ok(copy.cellContent({ x: 2, y: 1 }) instanceof Tile);
  assert.equal(copy.cellContent({ x: 2, y: 1 }).value, 64);
}

function gridTests() {
  it("starts empty", startsEmpty);
  it("inserts and removes tiles", insertsAndRemovesTiles);
  it("treats cells outside the grid as out of bounds",
    treatsOutsideCellsAsOutOfBounds);
  it("lists the available cells", listsAvailableCells);
  it("picks a free cell with the random source it's given",
    picksAFreeCellWithTheRandomSource);
  it("can be rebuilt from its serialized state", rebuildsFromSerializedState);
}

describe("Grid", gridTests);
