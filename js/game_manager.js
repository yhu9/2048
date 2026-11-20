import { Direction } from "./direction.js";
import { Grid } from "./grid.js";
import { Tile } from "./tile.js";

const START_TILES = 2;
const WINNING_VALUE = 2048;

// A new tile is a 2 most of the time and a 4 otherwise.
const CHANCE_OF_TWO = 0.9;

// How far a tile moves in each direction
const VECTORS = {
  [Direction.up]: { x: 0, y: -1 },
  [Direction.right]: { x: 1, y: 0 },
  [Direction.down]: { x: 0, y: 1 },
  [Direction.left]: { x: -1, y: 0 }
};

export class GameManager {
  // size: the number of columns and rows of the board
  // random is optional: a function returning a number in [0, 1), like
  // Math.random (the default). It decides where new tiles go and their value.
  constructor(size, InputManager, Actuator, StorageManager,
    random = Math.random) {
    this.size = size;
    this.inputManager = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator = new Actuator();
    this.random = random;

    this.inputManager.on("move", (direction) => this.move(direction));
    this.inputManager.on("restart", () => this.restart());
    this.inputManager.on("keepPlaying", () => this.continuePlaying());

    this.setup();
  }

  // Start a new game
  restart() {
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Clear the game won/lost message
    this.setup();
  }

  // Keep playing after winning (allows going over 2048)
  continuePlaying() {
    this.keepPlaying = true;
    this.actuator.continueGame(); // Clear the game won/lost message
  }

  // Return true if the game is lost, or has won and the user hasn't kept
  // playing
  isGameTerminated() {
    return this.over || (this.won && !this.keepPlaying);
  }

  // Continue the saved game if there is one. Otherwise start a new game.
  setup() {
    const savedState = this.storageManager.getGameState();

    if (savedState) {
      this.grid = new Grid(savedState.grid.size, savedState.grid.cells);
      this.score = savedState.score;
      this.over = savedState.over;
      this.won = savedState.won;
      this.keepPlaying = savedState.keepPlaying;
    } else {
      this.grid = new Grid(this.size);
      this.score = 0;
      this.over = false;
      this.won = false;
      this.keepPlaying = false;

      this.addStartTiles();
    }

    this.actuate();
  }

  addStartTiles() {
    for (let i = 0; i < START_TILES; i += 1) {
      this.addRandomTile();
    }
  }

  // Adds a tile in a random position
  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      const value = this.random() < CHANCE_OF_TWO ? 2 : 4;
      const cell = this.grid.randomAvailableCell(this.random);

      this.grid.insertTile(new Tile(cell, value));
    }
  }

  // Saves the game and sends the updated grid to the actuator
  actuate() {
    if (this.storageManager.getBestScore() < this.score) {
      this.storageManager.setBestScore(this.score);
    }

    // Clear the state when the game is over (game over only, not win)
    if (this.over) {
      this.storageManager.clearGameState();
    } else {
      this.storageManager.setGameState(this.serialize());
    }

    this.actuator.actuate(this.grid, {
      score: this.score,
      over: this.over,
      won: this.won,
      bestScore: this.storageManager.getBestScore(),
      terminated: this.isGameTerminated()
    });
  }

  // Represent the current game as an object
  serialize() {
    return {
      grid: this.grid.serialize(),
      score: this.score,
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlaying
    };
  }

  // Save all tile positions and remove merger info
  prepareTiles() {
    this.grid.eachCell((x, y, tile) => {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }

  // Move a tile and its representation
  moveTile(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }

  // Move tiles on the grid in the given Direction
  move(direction) {
    if (this.isGameTerminated()) return; // Don't do anything if it's over

    const vector = VECTORS[direction];
    const traversals = this.buildTraversals(vector);
    let moved = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        const cell = { x, y };
        const tile = this.grid.cellContent(cell);

        if (!tile) return;

        const positions = this.findFarthestPosition(cell, vector);
        const next = this.grid.cellContent(positions.next);

        // A tile that was just merged can't merge again in the same move.
        if (next && next.value === tile.value && !next.mergedFrom) {
          const merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          this.grid.insertTile(merged);
          this.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          this.score += merged.value;

          if (merged.value === WINNING_VALUE) this.won = true;
        } else {
          this.moveTile(tile, positions.farthest);
        }

        if (!this.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      });
    });

    if (moved) {
      this.addRandomTile();

      if (!this.movesAvailable()) {
        this.over = true; // Game over!
      }

      this.actuate();
    }
  }

  // Build a list of positions to traverse in the right order
  buildTraversals(vector) {
    const positions = Array.from({ length: this.size }, (_, index) => index);
    const traversals = { x: [...positions], y: [...positions] };

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();

    return traversals;
  }

  findFarthestPosition(cell, vector) {
    let previous;
    let next = cell;

    // Progress towards the vector direction until an obstacle is found
    do {
      previous = next;
      next = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(next) && this.grid.cellAvailable(next));

    return {
      farthest: previous,
      next // Used to check if a merge is required
    };
  }

  movesAvailable() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }

  // Check for available matches between tiles (more expensive check)
  tileMatchesAvailable() {
    let matches = false;

    this.grid.eachCell((x, y, tile) => {
      if (!tile) return;

      Object.values(VECTORS).forEach((vector) => {
        const other = this.grid.cellContent({
          x: x + vector.x,
          y: y + vector.y
        });

        if (other && other.value === tile.value) {
          matches = true; // These two tiles can be merged
        }
      });
    });

    return matches;
  }

  positionsEqual(first, second) {
    return first.x === second.x && first.y === second.y;
  }
}
