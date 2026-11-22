import { CHANCE_OF_TWO } from "./rules.js";
import { Tile } from "./tile.js";

// Brings new tiles into the game. They come in at the top row of the board.
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

  // Add a new tile to a free cell of the grid's top row and return it.
  // Returns null when that row is full. The value is chosen before the
  // cell.
  spawn(grid) {
    const cells = this.freeCells(grid);

    if (!cells.length) return null;

    const value = this.random() < CHANCE_OF_TWO ? 2 : 4;
    const cell = cells[Math.floor(this.random() * cells.length)];

    const tile = new Tile(cell, value);
    grid.insertTile(tile);
    return tile;
  }
}
