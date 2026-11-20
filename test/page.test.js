// End-to-end tests: load index.html, start the game from its entry module
// and play with the keyboard and the buttons.

import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { savedGame } from "./helpers/game.js";
import { Page, indexHtml } from "./helpers/page.js";

const KEY = { left: "ArrowLeft", up: "ArrowUp", right: "ArrowRight" };
const ENTRY_MODULE = "../js/application.js";

// The page starts the real game, which uses Math.random. Fixing it at 0
// makes new tiles always a 2 in the first free cell, so a new game starts
// with two 2s at the top of the left column.
mock.method(Math, "random", () => 0);

let pagesOpened = 0;
const EMPTY = [0, 0, 0, 0];

// Pass the localStorage of an earlier page as `storage` to reload it.
async function openPage(storage) {
  const page = new Page({ html: indexHtml(), storage });

  // A module only runs the first time it is imported. A new query string
  // makes the entry module run again and start a game on this page.
  pagesOpened += 1;
  await import(`${ENTRY_MODULE}?page=${pagesOpened}`);

  page.flushFrames();
  return page;
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

async function startsWithTwoTiles() {
  const page = await openPage();

  assert.equal(count(page, ".tile"), 2);
  assert.equal(text(page, ".score-container"), "0");
}

async function mergesWithArrowKeys() {
  const page = await openPage();

  press(page, KEY.up);

  assert.equal(count(page, ".tile-4.tile-merged.tile-position-1-1"), 1);
  assert.equal(count(page, ".tile-2.tile-new"), 1);
  assert.equal(text(page, ".score-container"), "4");
  assert.equal(text(page, ".best-container"), "4");
}

async function restoresGameAfterReload() {
  const first = await openPage();
  press(first, KEY.up);

  const second = await openPage(first.window.localStorage);

  assert.equal(count(second, ".tile"), 2);
  assert.equal(count(second, ".tile-4.tile-position-1-1"), 1);
  assert.equal(text(second, ".score-container"), "4");
}

async function newGameKeepsBestScore() {
  const page = await openPage();
  press(page, KEY.up);

  click(page, ".restart-button");

  assert.equal(count(page, ".tile"), 2);
  assert.equal(text(page, ".score-container"), "0");
  assert.equal(text(page, ".best-container"), "4");
}

async function showsWinAndKeepsGoing() {
  const rows = [[1024, 1024, 0, 0], EMPTY, EMPTY, EMPTY];
  const page = await openPage(savedGame(rows));

  press(page, KEY.left);

  assert.ok(message(page).classList.contains("game-won"));
  assert.equal(message(page).querySelector("p").textContent, "You win!");

  click(page, ".keep-playing-button");
  press(page, KEY.right);

  assert.ok(!message(page).classList.contains("game-won"));
  assert.equal(count(page, ".tile-2048.tile-position-4-1"), 1);
}

async function showsGameOverAndTriesAgain() {
  const page = await openPage(savedGame([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [0, 8, 16, 32]
  ]));

  press(page, KEY.left);

  assert.ok(message(page).classList.contains("game-over"));
  assert.equal(message(page).querySelector("p").textContent, "Game over!");

  click(page, ".retry-button");

  assert.ok(!message(page).classList.contains("game-over"));
  assert.equal(count(page, ".tile"), 2);
}

function pageTests() {
  it("starts a game with two tiles", startsWithTwoTiles);
  it("merges tiles with the arrow keys", mergesWithArrowKeys);
  it("restores the game after a reload", restoresGameAfterReload);
  it("starts over with New Game but keeps the best score",
    newGameKeepsBestScore);
  it("shows 'You win!' at 2048 and can keep going", showsWinAndKeepsGoing);
  it("shows 'Game over!' and starts again with Try again",
    showsGameOverAndTriesAgain);
}

describe("the page", pageTests);
