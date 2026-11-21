import { GameManager } from "../../js/game_manager.js";
import { Grid } from "../../js/grid.js";
import { LocalStorageManager } from "../../js/local_storage_manager.js";
import { Tile } from "../../js/tile.js";
import { Page } from "./page.js";

// GameManager needs an input manager and an actuator. These stand in for the
// real ones so the game can run without the page.
function FakeInput() {
  this.handlers = {};
}
FakeInput.prototype.on = function on(event, handler) {
  this.handlers[event] = handler;
};
FakeInput.prototype.emit = function emit(event, data) {
  this.handlers[event](data);
};

function FakeActuator() {}
FakeActuator.prototype.showBoard = function showBoard() {};
FakeActuator.prototype.setScore = function setScore() {};
FakeActuator.prototype.actuate = function actuate() {};
FakeActuator.prototype.continueGame = function continueGame() {};

// The tests play on the classic board unless they set up another one
const CLASSIC_BOARD = { columns: 4, rows: 4 };

// storage: initial localStorage contents (see savedGame)
// random: the game's random source. Defines what new tiles are added and
// where. 0.9 or more means a 4, less than 0.9 means a 2.
export function newGame({ storage, random = () => 0 } = {}) {
  new Page({ storage }); // The storage manager uses its localStorage

  return new GameManager(
    CLASSIC_BOARD, FakeInput, FakeActuator, LocalStorageManager, random
  );
}

// Boards are written as rows, top to bottom, with 0 for an empty cell.
// They can be any shape. (The grid itself is indexed cells[x][y].)
// moving: [column, row] of the moving tile, counted from 0. Without it,
// every tile on the board has landed.
export function setBoard(game, rows, moving) {
  game.grid = new Grid(rows[0].length, rows.length);
  rows.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) game.grid.insertTile(new Tile({ x, y }, value));
    });
  });

  game.movingTile = moving
    ? game.grid.cellContent({ x: moving[0], y: moving[1] })
    : null;
}

// A board with the given tiles in its left column, top to bottom, and
// nothing else: leftColumn([2, 0, 0, 2])
export function leftColumn(values) {
  return values.map((value) => [value, 0, 0, 0]);
}

// Where the moving tile is, as [column, row], or null if there is none
export function movingTile(game) {
  return game.movingTile ? [game.movingTile.x, game.movingTile.y] : null;
}

export function board(game) {
  const rows = [];
  for (let y = 0; y < game.grid.rows; y += 1) {
    rows.push([]);
    for (let x = 0; x < game.grid.columns; x += 1) {
      const tile = game.grid.cells[x][y];
      rows[y].push(tile ? tile.value : 0);
    }
  }
  return rows;
}

// A game on the given board that doesn't add a new tile when the moving
// tile lands, so the board after a move only shows what the move did.
export function gameWithBoard(rows, moving) {
  const game = newGame();
  setBoard(game, rows, moving);
  game.spawnTile = () => {};
  return game;
}

// localStorage contents for a game saved with the given board. Pass
// { movingTile: { x, y } } in extra to say which tile is moving.
export function savedGame(rows, extra = {}) {
  const cells = rows[0].map((_, x) => rows.map((row, y) => (
    row[x] ? { position: { x, y }, value: row[x] } : null
  )));

  return {
    gameState: JSON.stringify({
      grid: { columns: rows[0].length, rows: rows.length, cells },
      score: 0,
      over: false,
      won: false,
      keepPlaying: false,
      movingTile: null,
      ...extra
    })
  };
}
