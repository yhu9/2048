// How tiles move on a grid. Every function changes the grid it is given and
// reports what happened.

import { Direction } from "./direction.js";
import { WINNING_VALUE } from "./rules.js";
import { Tile } from "./tile.js";

// How far a tile moves in each direction
const VECTORS = {
  [Direction.up]: { x: 0, y: -1 },
  [Direction.right]: { x: 1, y: 0 },
  [Direction.down]: { x: 0, y: 1 },
  [Direction.left]: { x: -1, y: 0 }
};

// Save all tile positions and remove merger info
function prepareTiles(grid) {
  grid.eachCell((x, y, tile) => {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
}

function moveTile(grid, tile, cell) {
  grid.cells[tile.x][tile.y] = null;
  grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
}

// Merge a tile into the equal tile it has moved up against, and return the
// tile they make
function mergeTiles(grid, tile, next) {
  const position = { x: next.x, y: next.y };
  const merged = new Tile(position, tile.value * 2);
  merged.mergedFrom = [tile, next];

  grid.insertTile(merged);
  grid.removeTile(tile);

  // Converge the two tiles' positions
  tile.updatePosition(position);

  return merged;
}

// The points for a list of merged tiles, and whether one of them wins
function outcome(mergedTiles) {
  return {
    score: mergedTiles.reduce((sum, tile) => sum + tile.value, 0),
    won: mergedTiles.some((tile) => tile.value === WINNING_VALUE)
  };
}

// The positions to traverse, starting from the side the tiles move to
function traversals(grid, vector) {
  const order = {
    x: Array.from({ length: grid.columns }, (_, x) => x),
    y: Array.from({ length: grid.rows }, (_, y) => y)
  };

  if (vector.x === 1) order.x.reverse();
  if (vector.y === 1) order.y.reverse();

  return order;
}

// The last free cell in a direction, and the cell after it
function farthestPosition(grid, cell, vector) {
  let previous;
  let next = cell;

  do {
    previous = next;
    next = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (grid.withinBounds(next) && grid.cellAvailable(next));

  return { farthest: previous, next };
}

// Slide every tile as far as it can go in a direction, merging equal tiles
// that meet. A tile merges once per move. The moving tile, if one is given,
// stays where it is: the other tiles can't pass it or merge with it.
// Returns { moved, score, won }.
export function slideTiles(grid, direction, movingTile = null) {
  const vector = VECTORS[direction];
  const order = traversals(grid, vector);
  const mergedTiles = [];
  let moved = false;

  prepareTiles(grid);

  order.x.forEach((x) => {
    order.y.forEach((y) => {
      const cell = { x, y };
      const tile = grid.cellContent(cell);

      if (!tile || tile === movingTile) return;

      const positions = farthestPosition(grid, cell, vector);
      const next = grid.cellContent(positions.next);
      const mergeable = next && next !== movingTile &&
                        next.value === tile.value && !next.mergedFrom;

      if (mergeable) {
        mergedTiles.push(mergeTiles(grid, tile, next));
      } else {
        moveTile(grid, tile, positions.farthest);
      }

      if (tile.x !== x || tile.y !== y) {
        moved = true;
      }
    });
  });

  return { moved, ...outcome(mergedTiles) };
}

// Move a tile one cell in a direction, if that cell is on the board and
// free. Returns whether it moved.
export function stepTile(grid, tile, direction) {
  const vector = VECTORS[direction];
  const cell = { x: tile.x + vector.x, y: tile.y + vector.y };

  if (!grid.withinBounds(cell) || grid.cellOccupied(cell)) {
    return false;
  }

  moveTile(grid, tile, cell);
  return true;
}

// Whether a move left, right or down would move or merge any tile. Tiles
// never move up.
export function movesAvailable(grid) {
  const directions = [Direction.left, Direction.right, Direction.down];
  let available = false;

  grid.eachCell((x, y, tile) => {
    if (!tile) return;

    directions.forEach((direction) => {
      const vector = VECTORS[direction];
      const cell = { x: x + vector.x, y: y + vector.y };
      const next = grid.cellContent(cell);

      if (grid.withinBounds(cell) && (!next || next.value === tile.value)) {
        available = true;
      }
    });
  });

  return available;
}

// Merge a tile into the tile next to it in a direction, if that tile has the
// same value. Returns { merged, score, won }.
export function mergeIntoNext(grid, tile, direction) {
  const vector = VECTORS[direction];
  const next = grid.cellContent({ x: tile.x + vector.x, y: tile.y + vector.y });
  const mergedTiles = next && next.value === tile.value
    ? [mergeTiles(grid, tile, next)]
    : [];

  return { merged: mergedTiles.length > 0, ...outcome(mergedTiles) };
}

// One tick for the moving tile: it goes one cell down. When it can't, it
// merges with an equal tile in its way or stops, and has landed.
// Returns { landed, score, won }.
export function advanceTile(grid, tile) {
  prepareTiles(grid);

  if (stepTile(grid, tile, Direction.down)) {
    return { landed: false, ...outcome([]) };
  }

  const { score, won } = mergeIntoNext(grid, tile, Direction.down);

  return { landed: true, score, won };
}
