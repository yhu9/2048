import { Direction } from "./direction.js";

// event.key values that move the tiles
const MOVE_KEYS = {
  ArrowUp: Direction.up,
  ArrowRight: Direction.right,
  ArrowDown: Direction.down,
  ArrowLeft: Direction.left,
  w: Direction.up,
  d: Direction.right,
  s: Direction.down,
  a: Direction.left,
  k: Direction.up, // Vim keys
  l: Direction.right,
  j: Direction.down,
  h: Direction.left
};

const RESTART_KEY = "r";
const PAUSE_KEY = "p";

// A swipe has to be longer than this many pixels to count as a move.
const MIN_SWIPE_DISTANCE = 10;

export class KeyboardInputManager {
  constructor() {
    this.events = {};

    this.listen();
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    const callbacks = this.events[event] || [];

    callbacks.forEach((callback) => {
      callback(data);
    });
  }

  listen() {
    document.addEventListener("keydown", (event) => {
      this.handleKey(event);
    });

    this.bindButtonPress(".retry-button", this.restart);
    this.bindButtonPress(".restart-button", this.restart);
    this.bindButtonPress(".keep-playing-button", this.keepPlaying);
    this.bindButtonPress(".pause-button", this.pause);

    this.listenForSwipes();
  }

  handleKey(event) {
    const modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                      event.shiftKey;
    if (modifiers) return;

    // Letters are matched in either case, so Caps Lock doesn't matter.
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (Object.hasOwn(MOVE_KEYS, key)) {
      event.preventDefault();
      this.emit("move", MOVE_KEYS[key]);
    } else if (key === RESTART_KEY) {
      this.restart(event);
    } else if (key === PAUSE_KEY) {
      this.pause(event);
    }
  }

  listenForSwipes() {
    const gameContainer = document.querySelector(".game-container");
    let startX;
    let startY;

    gameContainer.addEventListener("touchstart", (event) => {
      if (event.touches.length > 1 || event.targetTouches.length > 1) {
        return; // Ignore if touching with more than 1 finger
      }

      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;

      event.preventDefault();
    });

    gameContainer.addEventListener("touchmove", (event) => {
      event.preventDefault();
    });

    gameContainer.addEventListener("touchend", (event) => {
      if (event.touches.length > 0 || event.targetTouches.length > 0) {
        return; // Ignore if still touching with one or more fingers
      }

      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;

      if (Math.max(Math.abs(dx), Math.abs(dy)) > MIN_SWIPE_DISTANCE) {
        this.emit("move", this.swipeDirection(dx, dy));
      }
    });
  }

  swipeDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? Direction.right : Direction.left;
    }
    return dy > 0 ? Direction.down : Direction.up;
  }

  restart(event) {
    event.preventDefault();
    this.emit("restart");
  }

  keepPlaying(event) {
    event.preventDefault();
    this.emit("keepPlaying");
  }

  // Pauses the game, or goes on with it if it is paused
  pause(event) {
    event.preventDefault();
    this.emit("pause");
  }

  bindButtonPress(selector, handler) {
    const button = document.querySelector(selector);
    const listener = (event) => handler.call(this, event);

    button.addEventListener("click", listener);
    button.addEventListener("touchend", listener);
  }
}
