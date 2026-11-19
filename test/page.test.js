"use strict";

// End-to-end tests: load index.html with all of its scripts and play the
// game with the keyboard and the buttons.

const { describe, it } = require("node:test");
const assert = require("node:assert");
const { Sandbox, indexHtml } = require("./helpers/sandbox");
const { savedGame } = require("./helpers/game");

const KEY = { left: 37, up: 38, right: 39, down: 40 };
const EMPTY = [0, 0, 0, 0];

// Pass the localStorage of an earlier page as `storage` to reload it.
function openPage(storage) {
  const page = new Sandbox({ html: indexHtml(), storage });

  // application.js starts the real game, which uses Math.random. Fixing it
  // at 0 makes new tiles always a 2 in the first free cell, so a new game
  // starts with two 2s at the top of the left column.
  page.window.Math.random = () => 0;

  page.document.querySelectorAll("script[src]").forEach((script) => {
    page.load(script.getAttribute("src"));
  });
  page.flushFrames();
  return page;
}

function press(page, keyCode) {
  page.fire(page.document, "keydown", { which: keyCode });
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

function startsWithTwoTiles() {
  const page = openPage();

  assert.equal(count(page, ".tile"), 2);
  assert.equal(text(page, ".score-container"), "0");
}

function mergesWithArrowKeys() {
  const page = openPage();

  press(page, KEY.up);

  assert.equal(count(page, ".tile-4.tile-merged.tile-position-1-1"), 1);
  assert.equal(count(page, ".tile-2.tile-new"), 1);
  assert.equal(text(page, ".score-container"), "4");
  assert.equal(text(page, ".best-container"), "4");
}

function restoresGameAfterReload() {
  const first = openPage();
  press(first, KEY.up);

  const second = openPage(first.window.localStorage);

  assert.equal(count(second, ".tile"), 2);
  assert.equal(count(second, ".tile-4.tile-position-1-1"), 1);
  assert.equal(text(second, ".score-container"), "4");
}

function newGameKeepsBestScore() {
  const page = openPage();
  press(page, KEY.up);

  click(page, ".restart-button");

  assert.equal(count(page, ".tile"), 2);
  assert.equal(text(page, ".score-container"), "0");
  assert.equal(text(page, ".best-container"), "4");
}

function showsWinAndKeepsGoing() {
  const rows = [[1024, 1024, 0, 0], EMPTY, EMPTY, EMPTY];
  const page = openPage(savedGame(rows));

  press(page, KEY.left);

  assert.ok(message(page).classList.contains("game-won"));
  assert.equal(message(page).querySelector("p").textContent, "You win!");

  click(page, ".keep-playing-button");
  press(page, KEY.right);

  assert.ok(!message(page).classList.contains("game-won"));
  assert.equal(count(page, ".tile-2048.tile-position-4-1"), 1);
}

function showsGameOverAndTriesAgain() {
  const page = openPage(savedGame([
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
