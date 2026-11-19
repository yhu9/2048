"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");
const { Sandbox, indexHtml } = require("./helpers/sandbox");
const { UP, RIGHT, DOWN, LEFT } = require("./helpers/game");

// Loads the input manager into the real page and records what it emits.
function setup() {
  const page = new Sandbox({ html: indexHtml() });
  page.load("js/keyboard_input_manager.js");

  const input = new page.window.KeyboardInputManager();
  const events = [];
  input.on("move", (direction) => events.push(direction));
  input.on("restart", () => events.push("restart"));
  input.on("keepPlaying", () => events.push("keepPlaying"));

  return { page, events };
}

function press(page, keyCode, modifiers = {}) {
  return page.fire(page.document, "keydown", { which: keyCode, ...modifiers });
}

function click(page, selector) {
  page.fire(page.document.querySelector(selector), "click");
}

function swipe(page, from, to) {
  const container = page.document.querySelector(".game-container");

  page.fire(container, "touchstart", {
    touches: [{ clientX: from[0], clientY: from[1] }],
    targetTouches: [{}]
  });
  page.fire(container, "touchend", {
    touches: [],
    targetTouches: [],
    changedTouches: [{ clientX: to[0], clientY: to[1] }]
  });
}

function movesWithArrowKeys() {
  const { page, events } = setup();

  [38, 39, 40, 37].forEach((key) => press(page, key));

  assert.deepEqual(events, [UP, RIGHT, DOWN, LEFT]);
}

function movesWithWasdAndVimKeys() {
  const { page, events } = setup();

  [87, 68, 83, 65].forEach((key) => press(page, key)); // W D S A
  [75, 76, 74, 72].forEach((key) => press(page, key)); // K L J H

  assert.deepEqual(events, [UP, RIGHT, DOWN, LEFT, UP, RIGHT, DOWN, LEFT]);
}

function stopsScrollingOnMoveKeys() {
  const { page } = setup();

  assert.ok(press(page, 38).defaultPrevented);
  assert.ok(!press(page, 32).defaultPrevented); // space
}

function ignoresOtherKeysAndModifiers() {
  const { page, events } = setup();

  press(page, 32);
  press(page, 38, { ctrlKey: true });
  press(page, 37, { shiftKey: true });
  press(page, 82, { metaKey: true });

  assert.deepEqual(events, []);
}

function restartsWithR() {
  const { page, events } = setup();

  press(page, 82);

  assert.deepEqual(events, ["restart"]);
}

function restartsFromButtons() {
  const { page, events } = setup();

  click(page, ".restart-button");
  click(page, ".retry-button");

  assert.deepEqual(events, ["restart", "restart"]);
}

function keepsPlayingFromButton() {
  const { page, events } = setup();

  click(page, ".keep-playing-button");

  assert.deepEqual(events, ["keepPlaying"]);
}

function movesWithSwipes() {
  const { page, events } = setup();

  swipe(page, [100, 100], [180, 110]);
  swipe(page, [100, 100], [20, 90]);
  swipe(page, [100, 100], [110, 180]);
  swipe(page, [100, 100], [90, 20]);

  assert.deepEqual(events, [RIGHT, LEFT, DOWN, UP]);
}

function ignoresShortSwipes() {
  const { page, events } = setup();

  swipe(page, [100, 100], [110, 100]);
  swipe(page, [100, 100], [100, 95]);

  assert.deepEqual(events, []);
}

function keyboardInputManagerTests() {
  it("moves with the arrow keys", movesWithArrowKeys);
  it("moves with WASD and the vim keys", movesWithWasdAndVimKeys);
  it("stops the browser from scrolling on a move key",
    stopsScrollingOnMoveKeys);
  it("ignores other keys and keys held with a modifier",
    ignoresOtherKeysAndModifiers);
  it("restarts with R", restartsWithR);
  it("restarts from the New Game and Try again buttons", restartsFromButtons);
  it("keeps playing from the Keep going button", keepsPlayingFromButton);
  it("moves in the direction of a swipe", movesWithSwipes);
  it("ignores swipes of 10px or less", ignoresShortSwipes);
}

describe("KeyboardInputManager", keyboardInputManagerTests);
