// End-to-end tests: load index.html, start the game from its entry module
// and play with the clock, the keyboard and the buttons.

import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { savedGame } from "./helpers/game.js";
import { openGamePage as openPage } from "./helpers/page.js";

const KEY = { right: "ArrowRight", down: "ArrowDown" };
const EMPTY = [0, 0, 0, 0];

// The page starts the real game, which uses Math.random. Fixing it at 0
// makes every new tile a 2 in the first free cell: the two tiles a game
// starts with at the top of the left column, and the moving tile next to
// them in the top row.
mock.method(Math, "random", () => 0);

// A saved game on the default board, 4 columns and 6 rows, with a moving
// tile at the top of the left column and a tile of the same value at the
// bottom.
function savedPair(value, extra = {}) {
  const rows = [
    [value, 0, 0, 0], EMPTY, EMPTY, EMPTY, EMPTY, [value, 0, 0, 0]
  ];

  return savedGame(rows, { movingTile: { x: 0, y: 0 }, ...extra });
}

function press(page, key) {
  page.fire(page.document, "keydown", { key });
  page.flushFrames();
}

function click(page, selector) {
  page.fire(page.document.querySelector(selector), "click");
  page.flushFrames();
}

function count(page, selector) {
  return page.document.querySelectorAll(`.tile-container ${selector}`).length;
}

function text(page, selector) {
  return page.document.querySelector(selector).firstChild.textContent;
}

function message(page) {
  return page.document.querySelector(".game-message");
}

async function startsWithTwoTilesAndAMovingTile() {
  const page = await openPage();

  // Two tiles, and a third one that is moving
  assert.equal(count(page, ".tile"), 3);
  assert.equal(count(page, ".tile-2.tile-moving.tile-position-2-1"), 1);
  assert.equal(text(page, ".score-container"), "0");
}

async function movesTheTileOnEveryTick() {
  const page = await openPage();

  page.tick();
  assert.equal(count(page, ".tile-moving.tile-position-2-2"), 1);

  // 4 more ticks take it down the rest of the 6 rows
  for (let ticks = 0; ticks < 4; ticks += 1) {
    page.tick();
  }
  assert.equal(count(page, ".tile-moving.tile-position-2-6"), 1);

  // At the bottom edge the tile lands, and a new one comes in at the top
  page.tick();
  assert.equal(count(page, ".tile"), 4);
  assert.equal(count(page, ".tile-position-2-6"), 1);
  assert.equal(count(page, ".tile-moving.tile-position-2-1"), 1);
}

async function steersAndLandsWithTheArrowKeys() {
  const page = await openPage();

  press(page, KEY.right);
  assert.equal(count(page, ".tile-moving.tile-position-3-1"), 1);

  press(page, KEY.down);
  assert.equal(count(page, ".tile-position-3-6"), 1);
  assert.equal(count(page, ".tile-moving.tile-position-1-1"), 1);
}

async function mergesAndScores() {
  const page = await openPage(savedPair(2));

  press(page, KEY.down);

  assert.equal(count(page, ".tile-4.tile-merged.tile-position-1-6"), 1);
  assert.equal(text(page, ".score-container"), "4");
  assert.equal(text(page, ".best-container"), "4");
}

async function restoresGameAfterReload() {
  const first = await openPage();
  first.tick();
  first.tick();

  const second = await openPage(first.window.localStorage);
  const cells = (row) => second.document
    .querySelectorAll(`.grid-row:${row} .grid-cell`).length;

  assert.equal(count(second, ".tile"), 3);
  assert.equal(count(second, ".tile-moving.tile-position-2-3"), 1);
  assert.equal(second.document.querySelectorAll(".grid-row").length, 6);
  assert.equal(cells("first-child"), 4);
}

// The "+" pop-up is for points scored by a move, not for a loaded score.
async function showsScorePopUpOnlyForNewPoints() {
  const page = await openPage(savedPair(2, { score: 20 }));
  const popUp = () => page.document.querySelector(".score-addition");

  assert.equal(text(page, ".score-container"), "20");
  assert.equal(popUp(), null);

  press(page, KEY.down);

  assert.equal(text(page, ".score-container"), "24");
  assert.equal(popUp().textContent, "+4");
}

async function newGameKeepsBestScore() {
  const page = await openPage(savedPair(2));
  press(page, KEY.down);

  click(page, ".restart-button");

  assert.equal(count(page, ".tile"), 3);
  assert.equal(text(page, ".score-container"), "0");
  assert.equal(text(page, ".best-container"), "4");
}

async function showsWinAndKeepsGoing() {
  const page = await openPage(savedPair(1024));

  press(page, KEY.down);

  assert.ok(message(page).classList.contains("game-won"));
  assert.equal(message(page).querySelector("p").textContent, "You win!");

  click(page, ".keep-playing-button");
  press(page, KEY.right);

  assert.ok(!message(page).classList.contains("game-won"));
  assert.equal(count(page, ".tile-2048.tile-position-4-6"), 1);
}

async function showsGameOverAndTriesAgain() {
  // The board is full and no two neighbours are equal
  const page = await openPage(savedGame([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2]
  ], { movingTile: { x: 0, y: 0 } }));

  page.tick();

  assert.ok(message(page).classList.contains("game-over"));
  assert.equal(message(page).querySelector("p").textContent, "Game over!");

  click(page, ".retry-button");

  assert.ok(!message(page).classList.contains("game-over"));
  assert.equal(count(page, ".tile"), 3);
}

function pageTests() {
  it("starts a game with two tiles and a moving tile",
    startsWithTwoTilesAndAMovingTile);
  it("moves the tile on every tick", movesTheTileOnEveryTick);
  it("steers and lands the tile with the arrow keys",
    steersAndLandsWithTheArrowKeys);
  it("merges tiles and adds them to the score", mergesAndScores);
  it("restores the game after a reload", restoresGameAfterReload);
  it("shows the score pop-up only for new points",
    showsScorePopUpOnlyForNewPoints);
  it("starts over with New Game but keeps the best score",
    newGameKeepsBestScore);
  it("shows 'You win!' at 2048 and can keep going", showsWinAndKeepsGoing);
  it("shows 'Game over!' and starts again with Try again",
    showsGameOverAndTriesAgain);
}

describe("the page", pageTests);
