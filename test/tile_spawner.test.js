import { describe, it } from "node:test";
import assert from "node:assert";
import { Grid } from "../js/grid.js";
import { Tile } from "../js/tile.js";
import { TileSpawner } from "../js/tile_spawner.js";

// A random source that returns the given numbers in turn
function sequence(...numbers) {
  let calls = 0;
  return () => {
    calls += 1;
    return numbers[(calls - 1) % numbers.length];
  };
}

function spawnsInTheTopRow() {
  const grid = new Grid(4, 6);

  // 0.95 makes the tile a 4. Then 0.5 picks the third of the four free cells
  const tile = new TileSpawner(sequence(0.95, 0.5)).spawn(grid);

  assert.equal(tile.value, 4);
  assert.deepEqual({ x: tile.x, y: tile.y }, { x: 2, y: 0 });
  assert.equal(grid.cellContent({ x: 2, y: 0 }), tile);
}

function skipsTakenCells() {
  const grid = new Grid(4, 4);
  grid.insertTile(new Tile({ x: 0, y: 0 }, 8));

  const tile = new TileSpawner(() => 0).spawn(grid);

  assert.deepEqual({ x: tile.x, y: tile.y }, { x: 1, y: 0 });
}

function spawnsNothingWhenTheTopRowIsFull() {
  const grid = new Grid(4, 6);
  [0, 1, 2, 3].forEach((x) => grid.insertTile(new Tile({ x, y: 0 }, 8)));

  assert.equal(new TileSpawner(() => 0).spawn(grid), null);
  assert.equal(grid.availableCells().length, 20);
}

function tileSpawnerTests() {
  it("spawns in the top row, value first and then column",
    spawnsInTheTopRow);
  it("skips the cells that are taken", skipsTakenCells);
  it("spawns nothing when the top row is full",
    spawnsNothingWhenTheTopRowIsFull);
}

describe("TileSpawner", tileSpawnerTests);
