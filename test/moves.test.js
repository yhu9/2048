"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  UP, RIGHT, DOWN, LEFT, newGame, gameWithBoard, setBoard, board
} = require("./helpers/game");

const EMPTY = [0, 0, 0, 0];

function move(rows, direction) {
  const game = gameWithBoard(rows);
  game.move(direction);
  return board(game);
}

// Most rules only need one row: put it at the top of an empty board, move,
// and read it back.
function moveRow(row, direction) {
  return move([row, EMPTY, EMPTY, EMPTY], direction)[0];
}

function tileValues(game) {
  return board(game).flat().filter(Boolean).sort((a, b) => a - b);
}

// Moving

function slidesTilesToTheEdge() {
  const rows = [
    [0, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 4, 0],
    [0, 0, 0, 0]
  ];

  assert.deepEqual(move(rows, LEFT), [
    [0, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [0, 0, 0, 0]
  ]);
  assert.deepEqual(move(rows, RIGHT), [
    [0, 0, 0, 0],
    [0, 0, 0, 2],
    [0, 0, 0, 4],
    [0, 0, 0, 0]
  ]);
  assert.deepEqual(move(rows, UP), [
    [0, 2, 4, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);
  assert.deepEqual(move(rows, DOWN), [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 2, 4, 0]
  ]);
}

function keepsTilesInOrder() {
  assert.deepEqual(moveRow([2, 0, 4, 0], LEFT), [2, 4, 0, 0]);
  assert.deepEqual(moveRow([2, 0, 4, 0], RIGHT), [0, 0, 2, 4]);
}

function mergesTwoEqualTiles() {
  assert.deepEqual(moveRow([2, 2, 0, 0], LEFT), [4, 0, 0, 0]);
  assert.deepEqual(moveRow([2, 0, 0, 2], LEFT), [4, 0, 0, 0]);
  assert.deepEqual(moveRow([0, 8, 8, 0], RIGHT), [0, 0, 0, 16]);
}

function doesNotMergeDifferentTiles() {
  assert.deepEqual(moveRow([2, 0, 0, 4], LEFT), [2, 4, 0, 0]);
  assert.deepEqual(moveRow([2, 4, 2, 4], LEFT), [2, 4, 2, 4]);
}

function mergesFromTheLeadingSide() {
  assert.deepEqual(moveRow([2, 2, 2, 0], LEFT), [4, 2, 0, 0]);
  assert.deepEqual(moveRow([2, 2, 2, 0], RIGHT), [0, 0, 2, 4]);
}

function mergesTwoPairsInOneRow() {
  assert.deepEqual(moveRow([2, 2, 2, 2], LEFT), [4, 4, 0, 0]);
  assert.deepEqual(moveRow([2, 2, 4, 4], RIGHT), [0, 0, 4, 8]);
}

function mergesEachTileOnce() {
  assert.deepEqual(moveRow([2, 2, 4, 0], LEFT), [4, 4, 0, 0]);
  assert.deepEqual(moveRow([4, 4, 8, 0], LEFT), [8, 8, 0, 0]);
}

function mergesUpAndDown() {
  const rows = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0]
  ];

  assert.deepEqual(move(rows, UP), [
    [4, 0, 0, 0],
    [8, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);
  assert.deepEqual(move(rows, DOWN), [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [4, 0, 0, 0],
    [8, 0, 0, 0]
  ]);
}

// Score

function addsEveryMergedTile() {
  const game = gameWithBoard([[2, 2, 4, 4], EMPTY, EMPTY, EMPTY]);

  game.move(LEFT);
  assert.equal(game.score, 12);

  game.move(LEFT);
  assert.equal(game.score, 12);
}

function staysTheSameWhenTilesSlide() {
  const game = gameWithBoard([[0, 2, 0, 4], EMPTY, EMPTY, EMPTY]);

  game.move(LEFT);

  assert.equal(game.score, 0);
}

// New tiles

function addsOneTileAfterAMove() {
  const game = newGame();
  setBoard(game, [[0, 0, 0, 2], EMPTY, EMPTY, EMPTY]);

  game.move(LEFT);

  assert.deepEqual(tileValues(game), [2, 2]);
  assert.equal(board(game)[0][0], 2);
}

function addsAFourAtPointNine() {
  const game = newGame({ random: () => 0.9 });
  setBoard(game, [[0, 0, 0, 2], EMPTY, EMPTY, EMPTY]);

  game.move(LEFT);

  assert.deepEqual(tileValues(game), [2, 4]);
}

function addsNothingIfNothingMoved() {
  const rows = [[2, 4, 0, 0], EMPTY, EMPTY, EMPTY];
  const game = newGame();
  setBoard(game, rows);

  game.move(LEFT);
  game.move(UP);

  assert.deepEqual(board(game), rows);
}

function movingTests() {
  it("slides tiles to the edge", slidesTilesToTheEdge);
  it("keeps tiles in order", keepsTilesInOrder);
  it("merges two equal tiles", mergesTwoEqualTiles);
  it("doesn't merge different tiles", doesNotMergeDifferentTiles);
  it("merges from the side the tiles are moving to",
    mergesFromTheLeadingSide);
  it("merges two pairs in the same row", mergesTwoPairsInOneRow);
  it("only merges a tile once per move", mergesEachTileOnce);
  it("merges up and down too", mergesUpAndDown);
}

function scoreTests() {
  it("adds the value of every merged tile", addsEveryMergedTile);
  it("stays the same when tiles only slide", staysTheSameWhenTilesSlide);
}

function newTileTests() {
  it("adds one tile after a move", addsOneTileAfterAMove);
  it("adds a 4 when the random number is 0.9 or higher",
    addsAFourAtPointNine);
  it("doesn't add a tile if nothing moved", addsNothingIfNothingMoved);
}

describe("moving", movingTests);
describe("score", scoreTests);
describe("new tiles", newTileTests);
