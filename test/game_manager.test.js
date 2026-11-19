"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  UP, RIGHT, LEFT, newGame, gameWithBoard, setBoard, board, savedGame
} = require("./helpers/game");

const EMPTY = [0, 0, 0, 0];

// Moving left fills the last free cell. If the new tile is a 2 the game is
// over; if it's a 4 it can still merge with the 4 above it.
const ALMOST_FULL = [
  [2, 4, 2, 4],
  [4, 2, 4, 2],
  [2, 4, 2, 4],
  [0, 8, 16, 32]
];

function tileCount(game) {
  return board(game).flat().filter(Boolean).length;
}

// A game that has just been won by merging two 1024s
function wonGame() {
  const game = gameWithBoard([[1024, 1024, 0, 0], EMPTY, EMPTY, EMPTY]);

  game.move(LEFT);

  return game;
}

// Starting the game with 2 tiles
function startsWithTwoTiles() {
  const game = newGame();

  assert.equal(tileCount(game), 2);
  assert.equal(game.score, 0);
  assert.ok(!game.over);
}

// Winning a game
function winsAt2048() {
  const game = wonGame();

  assert.ok(game.won);
  assert.ok(game.isGameTerminated());
}

// Moves ignored after winning a game
function ignoresMovesAfterWinning() {
  const game = wonGame();

  game.move(RIGHT);

  assert.deepEqual(board(game)[0], [2048, 0, 0, 0]);
}

// Game moves if keep playing is pressed
function canKeepPlaying() {
  const game = wonGame();

  game.inputManager.emit("keepPlaying");
  game.move(RIGHT);

  assert.ok(!game.isGameTerminated());
  assert.deepEqual(board(game)[0], [0, 0, 0, 2048]);
}

// Game over
function endsWhenNothingCanMerge() {
  const game = newGame();
  setBoard(game, ALMOST_FULL);

  game.move(LEFT);

  assert.deepEqual(board(game)[3], [8, 16, 32, 2]);
  assert.ok(game.over);
  assert.ok(game.isGameTerminated());
}

// Game not over while a merge is still possible
function continuesWhileAMergeIsPossible() {
  const game = newGame({ random: () => 0.95 }); // 0.9 or more means a 4
  setBoard(game, ALMOST_FULL);

  game.move(LEFT);

  assert.deepEqual(board(game)[3], [8, 16, 32, 4]);
  assert.ok(!game.over);
}

function ignoresMovesAfterGameOver() {
  const game = newGame();
  setBoard(game, ALMOST_FULL);
  game.move(LEFT);
  const before = board(game);

  game.move(RIGHT);
  game.move(UP);

  assert.deepEqual(board(game), before);
}

// Restarting
function restartsWithAFreshBoard() {
  const game = newGame();
  setBoard(game, [[8, 8, 0, 0], EMPTY, EMPTY, EMPTY]);
  game.move(LEFT);
  assert.equal(game.score, 16);

  game.restart();

  assert.equal(game.score, 0);
  assert.equal(tileCount(game), 2);
}

// Best scores
function updatesBestScore() {
  const game = gameWithBoard([[8, 8, 0, 0], EMPTY, EMPTY, EMPTY]);

  game.move(LEFT);

  assert.equal(game.storageManager.getBestScore(), 16);
}

function keepsHigherBestScore() {
  const game = newGame({ storage: { bestScore: "100" } });
  setBoard(game, [[2, 2, 0, 0], EMPTY, EMPTY, EMPTY]);

  game.move(LEFT);

  assert.equal(game.score, 4);
  assert.equal(game.storageManager.getBestScore(), 100);
}

function keepsBestScoreOnRestart() {
  const game = newGame();
  setBoard(game, [[8, 8, 0, 0], EMPTY, EMPTY, EMPTY]);
  game.move(LEFT);

  game.restart();

  assert.equal(game.storageManager.getBestScore(), 16);
}

// Saved game
function savesAfterEveryMove() {
  const game = gameWithBoard([[2, 2, 0, 0], EMPTY, EMPTY, EMPTY]);

  game.move(LEFT);

  const saved = game.storageManager.getGameState();
  assert.equal(saved.score, 4);
  assert.deepEqual(saved, game.serialize());
}

function loadsSavedGameOnStart() {
  const first = gameWithBoard([[2, 2, 0, 0], EMPTY, EMPTY, [0, 0, 0, 8]]);
  first.move(LEFT);

  const second = newGame({ storage: first.storageManager.storage });

  assert.deepEqual(board(second), [
    [4, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [8, 0, 0, 0]
  ]);
  assert.equal(second.score, 4);
}

function remembersAWonGame() {
  const rows = [[2048, 0, 0, 0], EMPTY, EMPTY, EMPTY];
  const game = newGame({ storage: savedGame(rows, { won: true }) });

  game.move(RIGHT);

  assert.ok(game.isGameTerminated());
  assert.deepEqual(board(game), rows);
}

function clearsSavedGameOnGameOver() {
  const game = newGame();
  setBoard(game, ALMOST_FULL);

  game.move(LEFT);

  assert.equal(game.storageManager.getGameState(), null);
}

function winningTests() {
  it("wins when a 2048 tile is made", winsAt2048);
  it("ignores moves after winning", ignoresMovesAfterWinning);
  it("can keep playing", canKeepPlaying);
}

function gameOverTests() {
  it("ends when the board is full and nothing can merge",
    endsWhenNothingCanMerge);
  it("doesn't end while a merge is still possible",
    continuesWhileAMergeIsPossible);
  it("ignores moves once it's over", ignoresMovesAfterGameOver);
}

function bestScoreTests() {
  it("is updated when the score beats it", updatesBestScore);
  it("is kept when the score is lower", keepsHigherBestScore);
  it("survives a restart", keepsBestScoreOnRestart);
}

function savedGameTests() {
  it("is saved after every move", savesAfterEveryMove);
  it("is loaded when the game starts", loadsSavedGameOnStart);
  it("remembers that the game was won", remembersAWonGame);
  it("is cleared on game over", clearsSavedGameOnGameOver);
}

function gameManagerTests() {
  it("starts with two tiles and a score of 0", startsWithTwoTiles);
  describe("winning", winningTests);
  describe("game over", gameOverTests);
  it("restarts with a fresh board", restartsWithAFreshBoard);
  describe("best score", bestScoreTests);
  describe("saved game", savedGameTests);
}

describe("GameManager", gameManagerTests);
