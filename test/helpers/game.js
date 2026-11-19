"use strict";

const { Sandbox } = require("./sandbox");

const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;

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
FakeActuator.prototype.actuate = function actuate() {};
FakeActuator.prototype.continueGame = function continueGame() {};

// storage: initial localStorage contents (see savedGame)
// random: the game's random source. Defines what new tiles are added and
// where. 0.9 or more means a 4, less than 0.9 means a 2.
function newGame({ storage, random = () => 0 } = {}) {
  const sandbox = new Sandbox({ storage });
  sandbox.load(
    "js/grid.js",
    "js/tile.js",
    "js/local_storage_manager.js",
    "js/game_manager.js"
  );

  const { window } = sandbox;
  const game = new window.GameManager(
    4, FakeInput, FakeActuator, window.LocalStorageManager, random
  );
  game.window = window;
  return game;
}

// Boards are written as rows, top to bottom, with 0 for an empty cell.
// (The grid itself is indexed cells[x][y].)
function setBoard(game, rows) {
  const { Grid, Tile } = game.window;

  game.grid = new Grid(rows.length);
  rows.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) game.grid.insertTile(new Tile({ x, y }, value));
    });
  });
}

function board(game) {
  const rows = [];
  for (let y = 0; y < game.grid.size; y += 1) {
    rows.push([]);
    for (let x = 0; x < game.grid.size; x += 1) {
      const tile = game.grid.cells[x][y];
      rows[y].push(tile ? tile.value : 0);
    }
  }
  return rows;
}

// A game on the given board that doesn't add a random tile after each move,
// so the board after a move is predictable.
function gameWithBoard(rows) {
  const game = newGame();
  setBoard(game, rows);
  game.addRandomTile = () => {};
  return game;
}

// localStorage contents for a game saved with the given board
function savedGame(rows, extra = {}) {
  const cells = rows.map((_, x) => rows.map((row, y) => (
    row[x] ? { position: { x, y }, value: row[x] } : null
  )));

  return {
    gameState: JSON.stringify({
      grid: { size: rows.length, cells },
      score: 0,
      over: false,
      won: false,
      keepPlaying: false,
      ...extra
    })
  };
}

module.exports = {
  UP, RIGHT, DOWN, LEFT,
  newGame, gameWithBoard, setBoard, board, savedGame
};
