import { describe, it } from "node:test";
import assert from "node:assert";
import { Direction } from "../js/direction.js";
import { KeyboardInputManager } from "../js/keyboard_input_manager.js";
import { Page, indexHtml } from "./helpers/page.js";

const { up: UP, right: RIGHT, down: DOWN, left: LEFT } = Direction;

// Loads the input manager into the real page and records what it emits.
function setup() {
  const page = new Page({ html: indexHtml() });

  const input = new KeyboardInputManager();
  const events = [];
  input.on("move", (direction) => events.push(direction));
  input.on("restart", () => events.push("restart"));
  input.on("keepPlaying", () => events.push("keepPlaying"));

  return { page, events };
}

// key is the event.key of the key, e.g. "ArrowUp" or "w"
function press(page, key, modifiers = {}) {
  return page.fire(page.document, "keydown", { key, ...modifiers });
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

  ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"]
    .forEach((key) => press(page, key));

  assert.deepEqual(events, [UP, RIGHT, DOWN, LEFT]);
}

function movesWithWasdAndVimKeys() {
  const { page, events } = setup();

  ["w", "d", "s", "a"].forEach((key) => press(page, key));
  ["k", "l", "j", "h"].forEach((key) => press(page, key));

  assert.deepEqual(events, [UP, RIGHT, DOWN, LEFT, UP, RIGHT, DOWN, LEFT]);
}

function stopsScrollingOnMoveKeys() {
  const { page } = setup();

  assert.ok(press(page, "ArrowUp").defaultPrevented);
  assert.ok(!press(page, " ").defaultPrevented);
}

function ignoresOtherKeysAndModifiers() {
  const { page, events } = setup();

  press(page, " ");
  press(page, "ArrowUp", { ctrlKey: true });
  press(page, "ArrowLeft", { shiftKey: true });
  press(page, "r", { metaKey: true });

  assert.deepEqual(events, []);
}

function restartsWithR() {
  const { page, events } = setup();

  press(page, "r");

  assert.deepEqual(events, ["restart"]);
}

// Caps Lock turns the letters into capitals.
function matchesLettersInEitherCase() {
  const { page, events } = setup();

  ["W", "D", "S", "A", "R"].forEach((key) => press(page, key));

  assert.deepEqual(events, [UP, RIGHT, DOWN, LEFT, "restart"]);
}

// The old event.which code alone isn't a key press any more.
function readsEventKeyOnly() {
  const { page, events } = setup();

  page.fire(page.document, "keydown", { key: "Unidentified", which: 38 });

  assert.deepEqual(events, []);
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
  it("matches letter keys in either case", matchesLettersInEitherCase);
  it("reads event.key, not event.which", readsEventKeyOnly);
  it("restarts from the New Game and Try again buttons", restartsFromButtons);
  it("keeps playing from the Keep going button", keepsPlayingFromButton);
  it("moves in the direction of a swipe", movesWithSwipes);
  it("ignores swipes of 10px or less", ignoresShortSwipes);
}

describe("KeyboardInputManager", keyboardInputManagerTests);
