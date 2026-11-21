import { Clock } from "./clock.js";
import { Direction } from "./direction.js";
import { Grid } from "./grid.js";
import {
  advanceTile, mergeIntoNext, movesAvailable, slideTiles, stepTile
} from "./moves.js";
import { START_TILES } from "./rules.js";
import { TileSpawner } from "./tile_spawner.js";

// Runs a game. One tile at a time is the moving tile: it comes in at the
// top and takes a step down on every tick, until it can't go further and
// lands. Every other tile has landed.
export class GameManager {
  // defaultBoardSize: the board size new games are played on (see
  // board_size.js)
  // random is optional: a function returning a number in [0, 1), like
  // Math.random (the default). It decides where new tiles go and their value.
  constructor(defaultBoardSize, InputManager, Actuator, StorageManager,
    random = Math.random) {
    this.defaultBoardSize = defaultBoardSize;
    this.inputManager = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator = new Actuator();
    this.spawner = new TileSpawner(random);
    this.clock = new Clock(() => this.tick());

    this.inputManager.on("move", (direction) => this.move(direction));
    this.inputManager.on("restart", () => this.restart());
    this.inputManager.on("keepPlaying", () => this.continuePlaying());

    this.setup();
    this.clock.start();
  }

  // The size of the board in play
  boardSize() {
    return { columns: this.grid.columns, rows: this.grid.rows };
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

  // The columns and rows of a saved grid. Games saved before boards could
  // be rectangular only have a size.
  savedBoardSize({ size, columns = size, rows = size }) {
    return { columns, rows };
  }

  // Continue the saved game if there is one, on the board it was saved
  // with. Otherwise start a new game on the default board.
  setup() {
    const savedState = this.storageManager.getGameState();

    if (savedState) {
      const { columns, rows } = this.savedBoardSize(savedState.grid);

      this.grid = new Grid(columns, rows, savedState.grid.cells);
      this.score = savedState.score;
      this.over = savedState.over;
      this.won = savedState.won;
      this.keepPlaying = savedState.keepPlaying;

      // The moving tile is saved by its position
      this.movingTile = savedState.movingTile
        ? this.grid.cellContent(savedState.movingTile)
        : null;
    } else {
      const { columns, rows } = this.defaultBoardSize;

      this.grid = new Grid(columns, rows);
      this.score = 0;
      this.over = false;
      this.won = false;
      this.keepPlaying = false;
      this.movingTile = null;

      // A new game starts with two tiles anywhere on the board
      for (let i = 0; i < START_TILES; i += 1) {
        this.spawner.spawnAnywhere(this.grid);
      }
    }

    // Then the moving tile comes in. A game that was saved before tiles
    // moved by themselves gets one too.
    this.settle();

    this.actuator.showBoard(this.boardSize());

    // The points of a loaded game were scored earlier, so they get no pop-up
    this.actuator.setScore(this.score);

    this.actuate();
  }

  // Bring in a new moving tile. When the top row is full there is no moving
  // tile for now.
  spawnTile() {
    this.movingTile = this.spawner.spawn(this.grid);
  }

  // The moving tile stops where it is, and a new one takes its place
  landTile() {
    this.movingTile = null;
    this.settle();
  }

  // Bring in a moving tile when there is none and the top row has room.
  // The game is over when no tile can come in and the player has no move
  // left.
  settle() {
    if (!this.movingTile) this.spawnTile();

    if (!this.movingTile && !movesAvailable(this.grid)) {
      this.over = true; // Game over!
    }
  }

  // Count the points of a tick or a move
  addOutcome({ score, won }) {
    this.score += score;

    if (won) this.won = true;
  }

  // One step of the clock for the moving tile
  tick() {
    if (this.isGameTerminated() || !this.movingTile) return;

    const result = advanceTile(this.grid, this.movingTile);
    this.addOutcome(result);

    if (result.landed) this.landTile();

    this.actuate();
  }

  // Move tiles on the grid in the given Direction:
  // - down moves every tile as far as it can go, and lands the moving tile
  // - left and right move the landed tiles as far as they can go, and then
  //   the moving tile one cell, or into an equal tile next to it
  // - up moves nothing, because tiles only ever go down
  move(direction) {
    if (this.isGameTerminated()) return; // Don't do anything if it's over

    if (direction === Direction.up) return;

    const moved = direction === Direction.down
      ? this.moveDown()
      : this.moveSideways(direction);

    if (moved) {
      // A move can make room for a tile that was waiting to come in
      this.settle();
      this.actuate();
    }
  }

  moveDown() {
    const result = slideTiles(this.grid, Direction.down);
    this.addOutcome(result);

    // The moving tile has gone as far as it can
    if (result.moved) this.landTile();

    return result.moved;
  }

  moveSideways(direction) {
    const result = slideTiles(this.grid, direction, this.movingTile);
    this.addOutcome(result);

    const steered = this.steerTile(direction);

    return result.moved || steered;
  }

  // Move the moving tile one cell left or right. When an equal tile is in
  // its way the two merge, and the merged tile has landed. Returns whether
  // the tile moved or merged.
  steerTile(direction) {
    if (!this.movingTile) return false;

    if (stepTile(this.grid, this.movingTile, direction)) return true;

    const result = mergeIntoNext(this.grid, this.movingTile, direction);
    this.addOutcome(result);

    if (result.merged) this.landTile();

    return result.merged;
  }

  // Saves the game and sends the updated grid to the actuator
  actuate() {
    const boardSize = this.boardSize(); // Each size has its own best score

    if (this.storageManager.getBestScore(boardSize) < this.score) {
      this.storageManager.setBestScore(this.score, boardSize);
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
      bestScore: this.storageManager.getBestScore(boardSize),
      movingTile: this.movingTile,
      terminated: this.isGameTerminated()
    });
  }

  // Represent the current game as an object
  serialize() {
    const tile = this.movingTile;

    return {
      grid: this.grid.serialize(),
      score: this.score,
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlaying,
      movingTile: tile ? { x: tile.x, y: tile.y } : null
    };
  }
}
