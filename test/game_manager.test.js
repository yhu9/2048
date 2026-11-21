import { describe, it } from "node:test";
import assert from "node:assert";
import { Direction } from "../js/direction.js";
import {
  newGame, gameWithBoard, setBoard, board, movingTile, savedGame, leftColumn
} from "./helpers/game.js";

const { right: RIGHT, down: DOWN } = Direction;

const EMPTY = [0, 0, 0, 0];

// The moving tile at the top left can't go down, and the rest of the top
// row is taken. When it lands there is no room for a new tile, but the
// landed tiles can still move.
const FULL_TOP_ROW = [
  [2, 8, 16, 32],
  [4, 0, 0, 0],
  EMPTY,
  EMPTY
];

// A full board on which no two neighbours are equal. When the moving tile at
// the top left lands, no tile can come in and no move is left.
const STUCK = [
  [2, 4, 2, 4],
  [4, 2, 4, 2],
  [2, 4, 2, 4],
  [4, 2, 4, 2]
];

function tileCount(game) {
  return board(game).flat().filter(Boolean).length;
}

// A game that has just been won by merging two 1024s
function wonGame() {
  const game = gameWithBoard(leftColumn([1024, 1024, 0, 0]));

  game.move(DOWN);

  return game;
}

// A game whose moving tile has just landed on the given board
function landedGame(rows) {
  const game = newGame();
  setBoard(game, rows, [0, 0]);

  game.tick();

  return game;
}

// A game that has just ended: no tile can come in and no move is left
function lostGame() {
  return landedGame(STUCK);
}

// Starting the game with two tiles and a third, moving tile
function startsWithTwoTilesAndAMovingTile() {
  const game = newGame();

  // The random source returns 0: two 2s at the top of the left column, and
  // the moving 2 in the first free cell of the top row
  assert.deepEqual(board(game), [[2, 2, 0, 0], [2, 0, 0, 0], EMPTY, EMPTY]);
  assert.deepEqual(movingTile(game), [1, 0]);
  assert.equal(game.score, 0);
  assert.ok(!game.over);
}

// Winning a game
function winsAt2048() {
  const game = wonGame();

  assert.ok(game.won);
  assert.ok(game.isGameTerminated());
}

// Moves and ticks ignored after winning a game
function waitsAfterWinning() {
  const game = wonGame();
  const rows = leftColumn([2, 0, 0, 2048]);
  setBoard(game, rows, [0, 0]);

  game.move(RIGHT);
  game.tick();

  assert.deepEqual(board(game), rows);
}

function continuePlayingKeepsTheGameGoing() {
  const game = wonGame();

  game.continuePlaying();

  assert.equal(game.keepPlaying, true);
  assert.ok(!game.isGameTerminated());
}

// Game moves if keep playing is pressed
function canKeepPlaying() {
  const game = wonGame();

  game.inputManager.emit("keepPlaying");
  game.move(RIGHT);

  assert.ok(!game.isGameTerminated());
  assert.deepEqual(board(game)[3], [0, 0, 0, 2048]);
}

// Game over
function endsWhenNoTileCanComeInAndNoMoveIsLeft() {
  const game = lostGame();

  assert.ok(game.over);
  assert.ok(game.isGameTerminated());
  assert.equal(movingTile(game), null);
}

// A full top row alone doesn't end the game
function waitsWhenTheTopRowIsFull() {
  const game = landedGame(FULL_TOP_ROW);

  assert.ok(!game.over);
  assert.equal(movingTile(game), null);

  // Ticks do nothing while there is no moving tile
  game.tick();
  game.tick();

  assert.ok(!game.over);
  assert.deepEqual(board(game), FULL_TOP_ROW);
}

function bringsInATileWhenAMoveMakesRoom() {
  const game = landedGame(FULL_TOP_ROW);

  // The 4 moves right, and the top row is still full
  game.move(RIGHT);
  assert.equal(movingTile(game), null);

  game.move(DOWN);
  assert.deepEqual(movingTile(game), [0, 0]);
  assert.deepEqual(board(game),
    [[2, 0, 0, 0], EMPTY, [0, 0, 0, 32], [2, 8, 16, 4]]);
}

// A merge in the top row makes room there too
function bringsInATileAfterAMergeInTheTopRow() {
  const game = landedGame([
    [2, 2, 8, 16],
    [4, 0, 0, 0],
    EMPTY,
    EMPTY
  ]);

  game.move(RIGHT);

  assert.deepEqual(board(game),
    [[2, 4, 8, 16], [0, 0, 0, 4], EMPTY, EMPTY]);
  assert.deepEqual(movingTile(game), [0, 0]);
}

// The board is full, but the two 4s at the bottom of the right column can
// merge
function continuesWhileTilesCanMerge() {
  const game = landedGame([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 4]
  ]);

  game.tick();
  assert.ok(!game.over);

  game.move(DOWN);
  assert.deepEqual(board(game).map((row) => row[3]), [2, 4, 2, 8]);
  assert.deepEqual(movingTile(game), [3, 0]);
}

// Game not over while the top row has a free cell
function continuesWhileATileCanComeIn() {
  const game = newGame();
  setBoard(game, [[2, 8, 16, 0], [4, 0, 0, 0], EMPTY, EMPTY], [0, 0]);

  game.tick();

  assert.ok(!game.over);
  assert.deepEqual(movingTile(game), [3, 0]);
}

function ignoresMovesAndTicksAfterGameOver() {
  const game = lostGame();
  const before = board(game);

  game.move(DOWN);
  game.move(RIGHT);
  game.tick();

  assert.deepEqual(board(game), before);
}

// Restarting
function restartsWithAFreshBoard() {
  const game = newGame();
  setBoard(game, leftColumn([8, 8, 0, 0]));
  game.move(DOWN);
  assert.equal(game.score, 16);

  game.restart();

  assert.equal(game.score, 0);
  assert.equal(tileCount(game), 3);
  assert.deepEqual(movingTile(game), [1, 0]);
}

// Best scores
function updatesBestScore() {
  const game = gameWithBoard(leftColumn([8, 8, 0, 0]));

  game.move(DOWN);

  assert.equal(game.storageManager.getBestScore(game.boardSize()), 16);
}

function keepsHigherBestScore() {
  const game = newGame({ storage: { bestScore: "100" } });
  setBoard(game, leftColumn([2, 2, 0, 0]));

  game.move(DOWN);

  assert.equal(game.score, 4);
  assert.equal(game.storageManager.getBestScore(game.boardSize()), 100);
}

function keepsBestScoreOnRestart() {
  const game = newGame();
  setBoard(game, leftColumn([8, 8, 0, 0]));
  game.move(DOWN);

  game.restart();

  assert.equal(game.storageManager.getBestScore(game.boardSize()), 16);
}

// Saved game
function savesAfterEveryMove() {
  const game = gameWithBoard(leftColumn([2, 2, 0, 0]));

  game.move(DOWN);

  const saved = game.storageManager.getGameState();
  assert.equal(saved.score, 4);
  assert.deepEqual(saved, game.serialize());
}

function savesAfterEveryTick() {
  const game = newGame();

  game.tick();

  const saved = game.storageManager.getGameState();
  assert.deepEqual(saved.movingTile, { x: 1, y: 1 });
  assert.deepEqual(saved, game.serialize());
}

function loadsSavedGameOnStart() {
  const rows = [[0, 0, 0, 4], [2, 0, 0, 0], EMPTY, [0, 0, 0, 8]];
  const storage = savedGame(rows, { score: 4, movingTile: { x: 0, y: 1 } });

  const game = newGame({ storage });

  assert.deepEqual(board(game), rows);
  assert.deepEqual(movingTile(game), [0, 1]);
  assert.equal(game.score, 4);
}

// A game saved before tiles moved by themselves has no moving tile.
function addsAMovingTileToAnOlderSavedGame() {
  const game = newGame({
    storage: savedGame([[8, 0, 0, 4], EMPTY, EMPTY, [0, 0, 0, 8]])
  });

  // It comes in at the first free cell of the top row
  assert.deepEqual(board(game),
    [[8, 2, 0, 4], EMPTY, EMPTY, [0, 0, 0, 8]]);
  assert.deepEqual(movingTile(game), [1, 0]);
}

function remembersAWonGame() {
  const rows = [[0, 0, 0, 2048], [2, 0, 0, 0], EMPTY, EMPTY];
  const storage = savedGame(rows, {
    won: true,
    movingTile: { x: 0, y: 1 }
  });
  const game = newGame({ storage });

  game.move(RIGHT);
  game.move(DOWN);
  game.tick();

  assert.ok(game.isGameTerminated());
  assert.deepEqual(board(game), rows);
}

function clearsSavedGameOnGameOver() {
  const game = lostGame();

  assert.equal(game.storageManager.getGameState(), null);
}

function winningTests() {
  it("wins when a 2048 tile is made", winsAt2048);
  it("ignores moves and ticks after winning", waitsAfterWinning);
  it("goes on after continuePlaying()", continuePlayingKeepsTheGameGoing);
  it("can keep playing", canKeepPlaying);
}

function gameOverTests() {
  it("ends when no tile can come in and no move is left",
    endsWhenNoTileCanComeInAndNoMoveIsLeft);
  it("waits with no moving tile when the top row is full",
    waitsWhenTheTopRowIsFull);
  it("brings in a tile when a move makes room",
    bringsInATileWhenAMoveMakesRoom);
  it("brings in a tile after a merge in the top row",
    bringsInATileAfterAMergeInTheTopRow);
  it("doesn't end while tiles can merge", continuesWhileTilesCanMerge);
  it("doesn't end while a new tile can come in",
    continuesWhileATileCanComeIn);
  it("ignores moves and ticks once it's over",
    ignoresMovesAndTicksAfterGameOver);
}

function bestScoreTests() {
  it("is updated when the score beats it", updatesBestScore);
  it("is kept when the score is lower", keepsHigherBestScore);
  it("survives a restart", keepsBestScoreOnRestart);
}

function savedGameTests() {
  it("is saved after every move", savesAfterEveryMove);
  it("is saved after every tick", savesAfterEveryTick);
  it("is loaded when the game starts", loadsSavedGameOnStart);
  it("gets a moving tile if it was saved without one",
    addsAMovingTileToAnOlderSavedGame);
  it("remembers that the game was won", remembersAWonGame);
  it("is cleared on game over", clearsSavedGameOnGameOver);
}

function gameManagerTests() {
  it("starts with two tiles, a moving tile and a score of 0",
    startsWithTwoTilesAndAMovingTile);
  describe("winning", winningTests);
  describe("game over", gameOverTests);
  it("restarts with a fresh board", restartsWithAFreshBoard);
  describe("best score", bestScoreTests);
  describe("saved game", savedGameTests);
}

describe("GameManager", gameManagerTests);
