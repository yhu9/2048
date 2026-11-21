// The game's modules expect a browser: they use the global window and
// document. A Page is a jsdom page installed as those globals, so the
// modules can be imported and used under Node.

import fs from "node:fs";
import { JSDOM } from "jsdom";

const INDEX_HTML = new URL("../../index.html", import.meta.url);

export function indexHtml() {
  return fs.readFileSync(INDEX_HTML, "utf8");
}

// options.html: page markup (defaults to an empty page)
// options.storage: initial localStorage contents, as an object
export function Page(options = {}) {
  const html = options.html ?? "<!DOCTYPE html><body></body>";
  const storage = options.storage ?? {};

  this.dom = new JSDOM(html, { url: "http://localhost/" });
  this.window = this.dom.window;
  this.document = this.window.document;

  Object.entries(storage).forEach(([key, value]) => {
    this.window.localStorage.setItem(key, value);
  });

  // Queue animation frames instead of running them on a timer, so a test
  // can draw the page when it wants to with flushFrames().
  this.frames = [];
  this.window.requestAnimationFrame = (callback) => {
    this.frames.push(callback);
  };

  // The game's clock doesn't run by itself either. tick() runs what the
  // page asked to run on every tick, until it is cleared.
  this.intervals = new Map();
  let timers = 0;
  this.window.setInterval = (callback) => {
    timers += 1;
    this.intervals.set(timers, callback);
    return timers;
  };
  this.window.clearInterval = (id) => {
    this.intervals.delete(id);
  };

  globalThis.window = this.window;
  globalThis.document = this.document;
}

// Let the game's clock tick once, then draw the page
Page.prototype.tick = function tick() {
  [...this.intervals.values()].forEach((callback) => callback());
  this.flushFrames();
};

let pagesOpened = 0;

// Open index.html and start the game from its entry module. Pass the
// localStorage of an earlier page as `storage` to reload it.
export async function openGamePage(storage) {
  const page = new Page({ html: indexHtml(), storage });

  // A module only runs the first time it is imported. A new query string
  // makes the entry module run again and start a game on this page.
  pagesOpened += 1;
  await import(`../../js/application.js?page=${pagesOpened}`);

  page.flushFrames();
  return page;
}

// Run the queued animation frames, including any they queue themselves
Page.prototype.flushFrames = function flushFrames() {
  while (this.frames.length) {
    const callback = this.frames.shift();
    callback();
  }
};

// Dispatch an event, e.g. page.fire(document, "keydown", { key: "ArrowUp" })
Page.prototype.fire = function fire(target, type, props = {}) {
  const event = new this.window.Event(type, {
    bubbles: true,
    cancelable: true
  });
  Object.assign(event, props);
  target.dispatchEvent(event);
  return event;
};
