import { CHANCE_OF_TWO } from "./rules.js";
import { Tile } from "./tile.js";

// Brings new tiles into the game: the moving tiles, in the top row of the
// board, and the tiles a game starts with, anywhere on it.
export class TileSpawner {
  // random: a function returning a number in [0, 1), like Math.random (the
  // default)
  constructor(random = Math.random) {
    this.random = random;
  }

  // The free cells of the grid's top row, from left to right
  freeCells(grid) {
    const cells = [];

    for (let x = 0; x < grid.columns; x += 1) {
      if (grid.cellAvailable({ x, y: 0 })) {
        cells.push({ x, y: 0 });
      }
    }

    return cells;
  }

  // Add a new tile to one of the given cells and return it, or return null
  // when there are none. The value is chosen before the cell.
  spawnIn(grid, cells) {
    if (!cells.length) return null;

    const value = this.random() < CHANCE_OF_TWO ? 2 : 4;
    const cell = cells[Math.floor(this.random() * cells.length)];

    const tile = new Tile(cell, value);
    grid.insertTile(tile);
    return tile;
  }

  // Add a new tile to a free cell of the grid's top row and return it.
  // Returns null when that row is full.
  spawn(grid) {
    return this.spawnIn(grid, this.freeCells(grid));
  }

  // Add a new tile to a free cell anywhere on the grid and return it, the
  // way a game gets its first tiles. Returns null when the grid is full.
  spawnAnywhere(grid) {
    return this.spawnIn(grid, grid.availableCells());
  }
}
