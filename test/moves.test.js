// How tiles move. One tile at a time is the moving tile: it takes a step
// down on every tick and lands when it can't go further. The other tiles
// have landed.

import { describe, it } from "node:test";
import assert from "node:assert";
import { Direction } from "../js/direction.js";
import {
  newGame, gameWithBoard, setBoard, board, movingTile, leftColumn
} from "./helpers/game.js";

const { up: UP, right: RIGHT, down: DOWN, left: LEFT } = Direction;

const EMPTY = [0, 0, 0, 0];

// What a move does to a board where every tile has landed
function move(rows, direction) {
  const game = gameWithBoard(rows);
  game.move(direction);
  return board(game);
}

// Most rules only need one column: put it at the left of an empty board,
// move down, and read it back from top to bottom.
function moveColumnDown(column) {
  return move(leftColumn(column), DOWN).map((row) => row[0]);
}

// A game where the tile at `moving` is the moving tile. No new tile is
// added when it lands.
function play(rows, moving, action) {
  const game = gameWithBoard(rows, moving);
  action(game);
  return game;
}

// Landed tiles

function slidesLandedTilesToTheEdge() {
  const rows = [
    [0, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 4, 0],
    [0, 0, 0, 0]
  ];

  assert.deepEqual(move(rows, DOWN), [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 2, 4, 0]
  ]);
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
}

function movesNothingUp() {
  const rows = [EMPTY, [2, 0, 0, 0], [0, 4, 0, 0], [0, 4, 0, 0]];

  assert.deepEqual(move(rows, UP), rows);

  const game = play(rows, [0, 1], (g) => g.move(UP));
  assert.deepEqual(board(game), rows);
  assert.deepEqual(movingTile(game), [0, 1]);
}

function keepsTilesInOrder() {
  assert.deepEqual(moveColumnDown([2, 0, 4, 0]), [0, 0, 2, 4]);
}

function mergesTwoEqualTiles() {
  assert.deepEqual(moveColumnDown([2, 2, 0, 0]), [0, 0, 0, 4]);
  assert.deepEqual(moveColumnDown([2, 0, 0, 2]), [0, 0, 0, 4]);
  assert.deepEqual(moveColumnDown([0, 8, 8, 0]), [0, 0, 0, 16]);
}

function doesNotMergeDifferentTiles() {
  assert.deepEqual(moveColumnDown([2, 0, 0, 4]), [0, 0, 2, 4]);
  assert.deepEqual(moveColumnDown([2, 4, 2, 4]), [2, 4, 2, 4]);
}

function mergesFromTheBottom() {
  assert.deepEqual(moveColumnDown([2, 2, 2, 0]), [0, 0, 2, 4]);
}

function mergesTwoPairsInOneColumn() {
  assert.deepEqual(moveColumnDown([2, 2, 2, 2]), [0, 0, 4, 4]);
  assert.deepEqual(moveColumnDown([2, 2, 4, 4]), [0, 0, 4, 8]);
}

function mergesEachTileOnce() {
  assert.deepEqual(moveColumnDown([0, 4, 2, 2]), [0, 0, 4, 4]);
  assert.deepEqual(moveColumnDown([0, 8, 4, 4]), [0, 0, 8, 8]);
}

function mergesLeftAndRight() {
  const rows = [[2, 2, 4, 4], EMPTY, EMPTY, EMPTY];

  assert.deepEqual(move(rows, LEFT), [[4, 8, 0, 0], EMPTY, EMPTY, EMPTY]);
  assert.deepEqual(move(rows, RIGHT), [[0, 0, 4, 8], EMPTY, EMPTY, EMPTY]);
}

// The moving tile on a move

function stepsOneCellLeftOrRight() {
  const rows = [[0, 2, 0, 0], EMPTY, EMPTY, EMPTY];

  assert.deepEqual(movingTile(play(rows, [1, 0], (g) => g.move(LEFT))),
    [0, 0]);
  assert.deepEqual(movingTile(play(rows, [1, 0], (g) => g.move(RIGHT))),
    [2, 0]);
}

function stepsWhileLandedTilesGoAllTheWay() {
  const game = play([[0, 0, 0, 2], EMPTY, EMPTY, [0, 2, 0, 2]], [3, 0],
    (g) => g.move(LEFT));

  assert.deepEqual(board(game), [[0, 0, 2, 0], EMPTY, EMPTY, [4, 0, 0, 0]]);
  assert.deepEqual(movingTile(game), [2, 0]);
  assert.equal(game.score, 4);
}

function staysInsideTheBoard() {
  const left = play([[2, 0, 0, 0], EMPTY, EMPTY, EMPTY], [0, 0],
    (g) => g.move(LEFT));
  assert.deepEqual(movingTile(left), [0, 0]);

  const right = play([[0, 0, 0, 2], EMPTY, EMPTY, EMPTY], [3, 0],
    (g) => g.move(RIGHT));
  assert.deepEqual(movingTile(right), [3, 0]);
}

function stopsAtALandedTile() {
  const rows = [[8, 2, 0, 0], EMPTY, EMPTY, EMPTY];
  const game = play(rows, [1, 0], (g) => g.move(LEFT));

  assert.deepEqual(board(game), rows);
  assert.deepEqual(movingTile(game), [1, 0]);
}

// The landed tiles move first, and the moving tile is in their way.
function isInTheWayOfLandedTiles() {
  const left = play([[0, 2, 0, 2], EMPTY, EMPTY, EMPTY], [1, 0],
    (g) => g.move(LEFT));
  assert.deepEqual(board(left), [[2, 0, 2, 0], EMPTY, EMPTY, EMPTY]);
  assert.deepEqual(movingTile(left), [0, 0]);
  assert.equal(left.score, 0);

  const right = play([[2, 2, 0, 0], EMPTY, EMPTY, EMPTY], [1, 0],
    (g) => g.move(RIGHT));
  assert.deepEqual(board(right), [[2, 0, 2, 0], EMPTY, EMPTY, EMPTY]);
  assert.deepEqual(movingTile(right), [2, 0]);
  assert.equal(right.score, 0);
}

// Moved into an equal tile, the moving tile merges with it and has landed.
function mergesWithAnEqualTileLeftOrRight() {
  const left = play([[2, 2, 0, 0], EMPTY, EMPTY, EMPTY], [1, 0],
    (g) => g.move(LEFT));
  assert.deepEqual(board(left), [[4, 0, 0, 0], EMPTY, EMPTY, EMPTY]);
  assert.equal(movingTile(left), null);
  assert.equal(left.score, 4);

  const right = play([EMPTY, [0, 0, 2, 2], EMPTY, EMPTY], [2, 1],
    (g) => g.move(RIGHT));
  assert.deepEqual(board(right), [EMPTY, [0, 0, 0, 4], EMPTY, EMPTY]);
  assert.equal(movingTile(right), null);
  assert.equal(right.score, 4);
}

// The landed 2 moves away first, so the moving tile only follows it.
function mergesOnlyWithATileNextToIt() {
  const game = play([[0, 2, 2, 0], EMPTY, EMPTY, EMPTY], [1, 0],
    (g) => g.move(RIGHT));

  assert.deepEqual(board(game), [[0, 0, 2, 2], EMPTY, EMPTY, EMPTY]);
  assert.deepEqual(movingTile(game), [2, 0]);
  assert.equal(game.score, 0);
}

// A new tile takes the place of the one that merged and landed.
function bringsInATileAfterAMergeLeft() {
  const game = newGame();
  setBoard(game, [[2, 2, 0, 0], EMPTY, EMPTY, EMPTY], [1, 0]);

  game.move(LEFT);

  assert.deepEqual(board(game), [[4, 2, 0, 0], EMPTY, EMPTY, EMPTY]);
  assert.deepEqual(movingTile(game), [1, 0]);
}

function landsOnAMoveDown() {
  const game = play([[2, 0, 0, 0], [0, 4, 0, 0], EMPTY, EMPTY], [0, 0],
    (g) => g.move(DOWN));

  assert.deepEqual(board(game), [EMPTY, EMPTY, EMPTY, [2, 4, 0, 0]]);
  assert.equal(movingTile(game), null);
}

function mergesOnAMoveDown() {
  const game = play(leftColumn([2, 0, 0, 2]), [0, 0], (g) => g.move(DOWN));

  assert.deepEqual(board(game), leftColumn([0, 0, 0, 4]));
  assert.equal(game.score, 4);
}

// The moving 4 stops above the 4 that the two landed 2s made. It lands
// there, even though the two are equal: a tile merges once per move.
function landsOnATileThatJustMerged() {
  const game = play(leftColumn([4, 0, 2, 2]), [0, 0], (g) => g.move(DOWN));

  assert.deepEqual(board(game), leftColumn([0, 0, 4, 4]));
  assert.equal(movingTile(game), null);
  assert.equal(game.score, 4);
}

function keepsMovingWhenNothingCanMoveDown() {
  const rows = leftColumn([2, 4, 8, 16]);
  const game = play(rows, [0, 0], (g) => g.move(DOWN));

  assert.deepEqual(board(game), rows);
  assert.deepEqual(movingTile(game), [0, 0]);
}

// Ticks

function movesOneCellDownOnATick() {
  const game = play([[2, 0, 0, 0], [0, 8, 0, 0], EMPTY, EMPTY], [0, 0],
    (g) => g.tick());

  // The 8 has landed, so it stays where it is
  assert.deepEqual(board(game), [EMPTY, [2, 8, 0, 0], EMPTY, EMPTY]);
  assert.deepEqual(movingTile(game), [0, 1]);
}

function landsAtTheBottomEdge() {
  const rows = leftColumn([0, 0, 0, 2]);
  const game = play(rows, [0, 3], (g) => g.tick());

  assert.deepEqual(board(game), rows);
  assert.equal(movingTile(game), null);
}

function landsAgainstADifferentTile() {
  const rows = leftColumn([0, 2, 4, 0]);
  const game = play(rows, [0, 1], (g) => g.tick());

  assert.deepEqual(board(game), rows);
  assert.equal(movingTile(game), null);
  assert.equal(game.score, 0);
}

function mergesWithAnEqualTileOnATick() {
  const game = play(leftColumn([2, 2, 0, 0]), [0, 0], (g) => g.tick());

  // The 4 has landed where the two 2s met
  assert.deepEqual(board(game), leftColumn([0, 4, 0, 0]));
  assert.equal(movingTile(game), null);
  assert.equal(game.score, 4);
}

// Only the player can merge the moving tile with a tile beside it
function doesNotMergeSidewaysOnATick() {
  const game = play([[2, 2, 0, 0], EMPTY, EMPTY, EMPTY], [0, 0],
    (g) => g.tick());

  assert.deepEqual(board(game), [[0, 2, 0, 0], [2, 0, 0, 0], EMPTY, EMPTY]);
  assert.deepEqual(movingTile(game), [0, 1]);
  assert.equal(game.score, 0);
}

// Score

function addsEveryMergedTile() {
  const game = gameWithBoard(leftColumn([2, 2, 4, 4]));

  game.move(DOWN);
  assert.equal(game.score, 12);

  game.move(DOWN);
  assert.equal(game.score, 12);
}

function staysTheSameWhenTilesOnlySlide() {
  const game = gameWithBoard(leftColumn([2, 0, 4, 0]));

  game.move(DOWN);

  assert.equal(game.score, 0);
}

// New tiles

function startsWithOnlyAMovingTile() {
  const game = newGame();

  // The random source returns 0: a 2 in the first cell of the top row
  assert.deepEqual(board(game), [[2, 0, 0, 0], EMPTY, EMPTY, EMPTY]);
  assert.deepEqual(movingTile(game), [0, 0]);

  // 0.99 makes it a 4 in the last cell of the top row
  const last = newGame({ random: () => 0.99 });
  assert.deepEqual(board(last), [[0, 0, 0, 4], EMPTY, EMPTY, EMPTY]);
  assert.deepEqual(movingTile(last), [3, 0]);
}

function picksTheColumnAndValueAtRandom() {
  const rows = leftColumn([0, 0, 0, 2]);

  // The moving tile lands at the bottom edge, and a new tile comes in.
  // 0.5 picks the third of the four free cells, and makes the tile a 2
  const middle = newGame({ random: () => 0.5 });
  setBoard(middle, rows, [0, 3]);
  middle.tick();
  assert.deepEqual(board(middle), [[0, 0, 2, 0], EMPTY, EMPTY, [2, 0, 0, 0]]);

  // 0.95 picks the last free cell, and makes the tile a 4
  const last = newGame({ random: () => 0.95 });
  setBoard(last, rows, [0, 3]);
  last.tick();
  assert.deepEqual(board(last), [[0, 0, 0, 4], EMPTY, EMPTY, [2, 0, 0, 0]]);
}

function addsATileWhenTheMovingTileLands() {
  const game = newGame();
  setBoard(game, [[8, 0, 0, 0], EMPTY, EMPTY, [0, 2, 0, 0]], [1, 3]);

  game.tick();

  // The left end of the top row is taken, so the new tile is next to it
  assert.deepEqual(board(game), [[8, 2, 0, 0], EMPTY, EMPTY, [0, 2, 0, 0]]);
  assert.deepEqual(movingTile(game), [1, 0]);
}

function addsNoTileUntilTheMovingTileLands() {
  const game = newGame();
  setBoard(game, [[2, 0, 0, 0], EMPTY, EMPTY, EMPTY], [0, 0]);

  game.tick();
  game.move(RIGHT);
  game.move(LEFT);
  game.move(UP);

  assert.deepEqual(board(game), [EMPTY, [2, 0, 0, 0], EMPTY, EMPTY]);
}

function landedTileTests() {
  it("slides landed tiles to the edge", slidesLandedTilesToTheEdge);
  it("moves nothing up", movesNothingUp);
  it("keeps tiles in order", keepsTilesInOrder);
  it("merges two equal tiles", mergesTwoEqualTiles);
  it("doesn't merge different tiles", doesNotMergeDifferentTiles);
  it("merges from the bottom", mergesFromTheBottom);
  it("merges two pairs in the same column", mergesTwoPairsInOneColumn);
  it("only merges a tile once per move", mergesEachTileOnce);
  it("merges left and right too", mergesLeftAndRight);
}

function movingTileTests() {
  it("steps one cell left or right", stepsOneCellLeftOrRight);
  it("steps while landed tiles go all the way",
    stepsWhileLandedTilesGoAllTheWay);
  it("stays inside the board", staysInsideTheBoard);
  it("stops at a landed tile", stopsAtALandedTile);
  it("is in the way of landed tiles, without merging",
    isInTheWayOfLandedTiles);
  it("merges with an equal tile it is moved into, and lands",
    mergesWithAnEqualTileLeftOrRight);
  it("merges left or right only with a tile next to it",
    mergesOnlyWithATileNextToIt);
  it("is replaced by a new tile after a merge left",
    bringsInATileAfterAMergeLeft);
  it("lands on a move down", landsOnAMoveDown);
  it("merges on a move down", mergesOnAMoveDown);
  it("lands on a tile that merged in the same move down",
    landsOnATileThatJustMerged);
  it("keeps moving when nothing can move down",
    keepsMovingWhenNothingCanMoveDown);
}

function tickTests() {
  it("moves the moving tile one cell down", movesOneCellDownOnATick);
  it("lands the moving tile at the bottom edge", landsAtTheBottomEdge);
  it("lands the moving tile against a different tile",
    landsAgainstADifferentTile);
  it("merges the moving tile with an equal tile below it",
    mergesWithAnEqualTileOnATick);
  it("doesn't merge the moving tile with a tile beside it",
    doesNotMergeSidewaysOnATick);
}

function scoreTests() {
  it("adds the value of every merged tile", addsEveryMergedTile);
  it("stays the same when tiles only slide", staysTheSameWhenTilesOnlySlide);
}

function newTileTests() {
  it("starts with only a moving tile, in the top row",
    startsWithOnlyAMovingTile);
  it("picks the column and the value at random",
    picksTheColumnAndValueAtRandom);
  it("adds a tile when the moving tile lands",
    addsATileWhenTheMovingTileLands);
  it("adds no tile until the moving tile lands",
    addsNoTileUntilTheMovingTileLands);
}

describe("landed tiles", landedTileTests);
describe("the moving tile", movingTileTests);
describe("ticks", tickTests);
describe("score", scoreTests);
describe("new tiles", newTileTests);
