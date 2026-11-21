import { Tile } from "./tile.js";

// A board of columns x rows cells, indexed cells[x][y]: x is the column,
// counted from the left, and y is the row, counted from the top.
export class Grid {
  // previousCells: the cells of a serialized grid, to restore it
  constructor(columns, rows, previousCells) {
    this.columns = columns;
    this.rows = rows;
    this.cells = previousCells ? this.fromState(previousCells) : this.empty();
  }

  // Build the cells, taking each one from cellAt(x, y)
  build(cellAt) {
    const cells = [];

    for (let x = 0; x < this.columns; x += 1) {
      cells.push([]);

      for (let y = 0; y < this.rows; y += 1) {
        cells[x].push(cellAt(x, y));
      }
    }

    return cells;
  }

  empty() {
    return this.build(() => null);
  }

  fromState(state) {
    return this.build((x, y) => {
      const tile = state[x][y];
      return tile ? new Tile(tile.position, tile.value) : null;
    });
  }

  // Pick an available cell. random works like Math.random (the default).
  randomAvailableCell(random = Math.random) {
    const cells = this.availableCells();

    if (cells.length) {
      return cells[Math.floor(random() * cells.length)];
    }
    return undefined;
  }

  availableCells() {
    const cells = [];

    this.eachCell((x, y, tile) => {
      if (!tile) {
        cells.push({ x, y });
      }
    });

    return cells;
  }

  // Call callback for every cell, column by column and top to bottom
  eachCell(callback) {
    for (let x = 0; x < this.columns; x += 1) {
      for (let y = 0; y < this.rows; y += 1) {
        callback(x, y, this.cells[x][y]);
      }
    }
  }

  cellsAvailable() {
    return this.availableCells().length > 0;
  }

  cellAvailable(cell) {
    return !this.cellOccupied(cell);
  }

  cellOccupied(cell) {
    return Boolean(this.cellContent(cell));
  }

  cellContent(cell) {
    return this.withinBounds(cell) ? this.cells[cell.x][cell.y] : null;
  }

  insertTile(tile) {
    this.cells[tile.x][tile.y] = tile;
  }

  removeTile(tile) {
    this.cells[tile.x][tile.y] = null;
  }

  withinBounds(position) {
    return position.x >= 0 && position.x < this.columns &&
           position.y >= 0 && position.y < this.rows;
  }

  serialize() {
    return {
      columns: this.columns,
      rows: this.rows,
      cells: this.build((x, y) => {
        const tile = this.cells[x][y];
        return tile ? tile.serialize() : null;
      })
    };
  }
}
