import { describe, it } from "node:test";
import assert from "node:assert";
import { Grid } from "../js/grid.js";
import { HTMLActuator } from "../js/html_actuator.js";
import { Tile } from "../js/tile.js";
import { Page, indexHtml } from "./helpers/page.js";

function setup() {
  const page = new Page({ html: indexHtml() });
  const grid = new Grid(4, 4);
  const actuator = new HTMLActuator();

  return {
    page,
    actuator,

    addTile(x, y, value) {
      const tile = new Tile({ x, y }, value);
      grid.insertTile(tile);
      return tile;
    },

    draw(metadata = {}) {
      actuator.actuate(grid, { score: 0, bestScore: 0, ...metadata });
      page.flushFrames();
    },

    // Number of drawn tiles matching a selector, e.g. count(".tile-2")
    count(selector) {
      return page.document
        .querySelectorAll(`.tile-container ${selector}`).length;
    }
  };
}

function drawsTilesWithValueAndPosition() {
  const t = setup();
  t.addTile(0, 0, 2);
  t.addTile(3, 1, 64);

  t.draw();

  // Positions on the page count from 1
  assert.equal(t.count(".tile"), 2);
  assert.equal(t.count(".tile-2.tile-position-1-1"), 1);
  assert.equal(t.count(".tile-64.tile-position-4-2"), 1);

  const inner = t.page.document.querySelector(".tile-64 .tile-inner");
  assert.equal(inner.textContent, "64");
}

function clearsOldTiles() {
  const t = setup();
  t.addTile(0, 0, 2);

  t.draw();
  t.draw();

  assert.equal(t.count(".tile"), 1);
}

function marksNewTiles() {
  const t = setup();
  t.addTile(1, 1, 2);

  t.draw();

  assert.equal(t.count(".tile-new"), 1);
}

function drawsMovedTileAtNewPosition() {
  const t = setup();
  const tile = t.addTile(3, 0, 2);
  tile.previousPosition = { x: 0, y: 0 };

  t.draw();

  assert.equal(t.count(".tile-position-4-1"), 1);
  assert.equal(t.count(".tile-new"), 0);
}

function marksMergedTiles() {
  const t = setup();
  const merged = t.addTile(0, 0, 4);
  merged.mergedFrom = [
    new Tile({ x: 0, y: 0 }, 2),
    new Tile({ x: 0, y: 0 }, 2)
  ];

  t.draw();

  assert.equal(t.count(".tile-4.tile-merged"), 1);
  assert.equal(t.count(".tile-2"), 2);
}

function marksSuperTiles() {
  const t = setup();
  t.addTile(0, 0, 2048);
  t.addTile(1, 0, 4096);

  t.draw();

  assert.equal(t.count(".tile-super"), 1);
  assert.equal(t.count(".tile-4096.tile-super"), 1);
}

function showsScoreAndBestScore() {
  const t = setup();
  const { document } = t.page;

  t.draw({ score: 128, bestScore: 2048 });

  const score = document.querySelector(".score-container");
  assert.equal(score.firstChild.textContent, "128");
  assert.equal(document.querySelector(".best-container").textContent, "2048");
}

function drawsTheBoard() {
  const t = setup();
  const { document } = t.page;

  t.actuator.showBoard({ columns: 6, rows: 5 });
  t.actuator.showBoard({ columns: 7, rows: 4 });

  const rows = [...document.querySelectorAll(".grid-container .grid-row")];
  assert.deepEqual(rows.map((row) => row.children.length), [7, 7, 7, 7]);
  const { style } = document.querySelector(".container");
  assert.equal(style.getPropertyValue("--columns"), "7");
  assert.equal(style.getPropertyValue("--rows"), "4");
}

// The button shows what pressing it does: pause, or play when paused
function showsWhetherTheGameIsPaused() {
  const t = setup();
  const button = t.page.document.querySelector(".pause-button");

  t.actuator.setPaused(true);
  assert.ok(button.classList.contains("paused"));
  assert.equal(button.getAttribute("aria-label"), "Play");

  t.actuator.setPaused(false);
  assert.ok(!button.classList.contains("paused"));
  assert.equal(button.getAttribute("aria-label"), "Pause");
}

function htmlActuatorTests() {
  it("draws each tile with its value and position",
    drawsTilesWithValueAndPosition);
  it("clears the old tiles on every draw", clearsOldTiles);
  it("marks new tiles", marksNewTiles);
  it("draws a moved tile at its new position", drawsMovedTileAtNewPosition);
  it("marks merged tiles and draws the tiles they came from",
    marksMergedTiles);
  it("marks tiles above 2048 as super", marksSuperTiles);
  it("shows the score and the best score", showsScoreAndBestScore);
  it("draws a board of any size and tells the stylesheet its size",
    drawsTheBoard);
  it("turns the pause button into a play button while paused",
    showsWhetherTheGameIsPaused);
}

describe("HTMLActuator", htmlActuatorTests);
