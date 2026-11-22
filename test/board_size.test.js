// Boards of other sizes: the board a new game is played on, the rules on
// boards that aren't square, and what is saved for each board.

import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { Direction } from "../js/direction.js";
import {
  newGame, gameWithBoard, setBoard, board, movingTile, savedGame
} from "./helpers/game.js";
import { openGamePage as openPage } from "./helpers/page.js";

const { right: RIGHT, down: DOWN, left: LEFT } = Direction;
const KEY = { down: "ArrowDown", r: "r" };

// New tiles are always a 2 in the first free cell (see page.test.js)
mock.method(Math, "random", () => 0);

const EMPTY = [0, 0, 0, 0];
const EMPTY7 = [0, 0, 0, 0, 0, 0, 0];

// 7 columns and 4 rows, full, with no two equal neighbours. When the moving
// tile at the top left lands, no tile can come in and no move is left.
const STUCK_WIDE = [
  [2, 4, 2, 4, 2, 4, 2],
  [4, 2, 4, 2, 4, 2, 4],
  [2, 4, 2, 4, 2, 4, 2],
  [4, 2, 4, 2, 4, 2, 4]
];

function press(page, key) {
  page.fire(page.document, "keydown", { key });
  page.flushFrames();
}

function click(page, selector) {
  page.fire(page.document.querySelector(selector), "click");
  page.flushFrames();
}

// The number of cells in each row of the background grid
function gridShape(page) {
  const rows = page.document.querySelectorAll(".grid-container .grid-row");
  return [...rows].map((row) => row.children.length);
}

function count(page, selector) {
  return page.document.querySelectorAll(`.tile-container ${selector}`).length;
}

function bestScore(page) {
  return page.document.querySelector(".best-container").textContent;
}

function move(rows, direction) {
  const game = gameWithBoard(rows);
  game.move(direction);
  return board(game);
}

// The default board

async function startsOnFourColumnsAndSixRows() {
  const page = await openPage();

  assert.deepEqual(gridShape(page), [4, 4, 4, 4, 4, 4]);
  assert.equal(count(page, ".tile"), 1);
}

async function startsNewGamesOnTheDefaultBoard() {
  const wide = [[2, 0, 0, 0, 0, 0, 0], EMPTY7, EMPTY7, EMPTY7];
  const page = await openPage(savedGame(wide, { movingTile: { x: 0, y: 0 } }));
  assert.deepEqual(gridShape(page), [7, 7, 7, 7]);

  press(page, KEY.r);
  assert.deepEqual(gridShape(page), [4, 4, 4, 4, 4, 4]);
  assert.equal(count(page, ".tile"), 1);

  // Game over on another board, then Try again
  const stuck = await openPage(savedGame(STUCK_WIDE, {
    movingTile: { x: 0, y: 0 }
  }));
  stuck.tick();
  click(stuck, ".retry-button");
  assert.deepEqual(gridShape(stuck), [4, 4, 4, 4, 4, 4]);
}

// Rules

function movesLandedTilesAcrossAWideBoard() {
  const rows = [
    EMPTY7,
    [0, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 4, 0],
    EMPTY7
  ];

  assert.deepEqual(move(rows, DOWN),
    [EMPTY7, EMPTY7, EMPTY7, [0, 2, 0, 0, 0, 4, 0]]);
  assert.deepEqual(move(rows, LEFT), [
    EMPTY7,
    [2, 0, 0, 0, 0, 0, 0],
    [4, 0, 0, 0, 0, 0, 0],
    EMPTY7
  ]);
  assert.deepEqual(move(rows, RIGHT), [
    EMPTY7,
    [0, 0, 0, 0, 0, 0, 2],
    [0, 0, 0, 0, 0, 0, 4],
    EMPTY7
  ]);
}

function movesLandedTilesAcrossATallBoard() {
  const rows = [EMPTY, [0, 2, 0, 0], EMPTY, EMPTY, [0, 0, 0, 4], EMPTY];

  assert.deepEqual(move(rows, DOWN),
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, [0, 2, 0, 4]]);
  assert.deepEqual(move(rows, LEFT),
    [EMPTY, [2, 0, 0, 0], EMPTY, EMPTY, [4, 0, 0, 0], EMPTY]);
  assert.deepEqual(move(rows, RIGHT),
    [EMPTY, [0, 0, 0, 2], EMPTY, EMPTY, [0, 0, 0, 4], EMPTY]);
}

function fallsDownATallBoardOneCellPerTick() {
  const game = gameWithBoard(
    [[2, 0, 0, 0], EMPTY, EMPTY, EMPTY, EMPTY, EMPTY], [0, 0]
  );

  for (let ticks = 1; ticks <= 5; ticks += 1) {
    game.tick();
    assert.deepEqual(movingTile(game), [0, ticks]);
  }

  // At the bottom edge it lands
  game.tick();
  assert.equal(movingTile(game), null);
  assert.deepEqual(board(game)[5], [2, 0, 0, 0]);
}

function stepsLeftAndRightOnAWideBoard() {
  const rows = [[0, 0, 2, 0, 0, 0, 0], EMPTY7, EMPTY7, EMPTY7];

  const left = gameWithBoard(rows, [2, 0]);
  left.move(LEFT);
  assert.deepEqual(movingTile(left), [1, 0]);

  const right = gameWithBoard(rows, [2, 0]);
  right.move(RIGHT);
  right.move(RIGHT);
  right.move(RIGHT);
  right.move(RIGHT);
  assert.deepEqual(movingTile(right), [6, 0]);
}

function bringsTilesInAlongAWideTopRow() {
  const game = newGame({ random: () => 0.99 });
  setBoard(game, [EMPTY7, EMPTY7, EMPTY7, [2, 0, 0, 0, 0, 0, 0]], [0, 3]);

  game.tick();

  // 0.99 picks the last of the seven free cells of the top row
  assert.deepEqual(movingTile(game), [6, 0]);
}

function endsWhenNoMoveIsLeft() {
  const game = newGame();
  setBoard(game, STUCK_WIDE, [0, 0]);

  game.tick();

  assert.ok(game.over);
}

// Saved games and best scores

async function restoresTheBoardAfterAReload() {
  const wide = [[2, 0, 0, 0, 0, 0, 0], EMPTY7, EMPTY7, EMPTY7];
  const first = await openPage(savedGame(wide, { movingTile: { x: 0, y: 0 } }));
  first.tick();
  first.tick();

  const second = await openPage(first.window.localStorage);

  assert.deepEqual(gridShape(second), [7, 7, 7, 7]);
  assert.equal(count(second, ".tile"), 1);
  assert.equal(count(second, ".tile-moving.tile-position-1-3"), 1);
}

function loadsAGameSavedBeforeBoardSizes() {
  const cells = [0, 1, 2, 3].map(() => [null, null, null, null]);
  cells[0][0] = { position: { x: 0, y: 0 }, value: 8 };

  const game = newGame({
    storage: {
      gameState: JSON.stringify({
        grid: { size: 4, cells },
        score: 8,
        over: false,
        won: false,
        keepPlaying: false
      })
    }
  });

  // The moving tile it didn't have comes in next to the 8
  assert.deepEqual(game.boardSize(), { columns: 4, rows: 4 });
  assert.deepEqual(board(game)[0], [8, 2, 0, 0]);
}

async function keepsABestScorePerBoardSize() {
  // A saved game on the classic board: 4 columns and 4 rows
  const rows = [[8, 0, 0, 0], EMPTY, EMPTY, [8, 0, 0, 0]];
  const page = await openPage(savedGame(rows, { movingTile: { x: 0, y: 0 } }));
  press(page, KEY.down);
  assert.equal(bestScore(page), "16");

  // A new game is on the default board, which has its own best score
  click(page, ".restart-button");
  assert.equal(bestScore(page), "0");

  // The first 2 lands at the bottom, and the second one merges with it
  press(page, KEY.down);
  press(page, KEY.down);
  assert.equal(bestScore(page), "4");

  const storage = page.window.localStorage;
  assert.equal(storage.getItem("bestScore"), "16");
  assert.equal(storage.getItem("bestScore-4x6"), "4");
}

function defaultBoardTests() {
  it("starts on 4 columns and 6 rows", startsOnFourColumnsAndSixRows);
  it("starts new games on the default board",
    startsNewGamesOnTheDefaultBoard);
}

function rulesTests() {
  it("moves landed tiles across a wide board",
    movesLandedTilesAcrossAWideBoard);
  it("moves landed tiles across a tall board",
    movesLandedTilesAcrossATallBoard);
  it("falls down a tall board one cell per tick",
    fallsDownATallBoardOneCellPerTick);
  it("steps left and right on a wide board", stepsLeftAndRightOnAWideBoard);
  it("brings tiles in along the top row of a wide board",
    bringsTilesInAlongAWideTopRow);
  it("ends the game when no move is left", endsWhenNoMoveIsLeft);
}

function savingTests() {
  it("restores the board and its size after a reload",
    restoresTheBoardAfterAReload);
  it("loads a game saved before there were board sizes",
    loadsAGameSavedBeforeBoardSizes);
  it("keeps a best score for each board size", keepsABestScorePerBoardSize);
}

describe("the default board", defaultBoardTests);
describe("rules on other board sizes", rulesTests);
describe("saving on other board sizes", savingTests);
