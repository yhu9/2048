"use strict";

// The game's scripts are plain <script> files that define globals (Grid,
// Tile, GameManager...) and expect a browser. A Sandbox loads them into a
// jsdom page so the tests can run under Node.

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..", "..");

function indexHtml() {
  return fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
}

// options.html: page markup (defaults to an empty page)
// options.storage: initial localStorage contents, as an object
function Sandbox(options = {}) {
  const html = options.html ?? "<!DOCTYPE html><body></body>";
  const storage = options.storage ?? {};

  this.dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "outside-only"
  });
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
}

// Run scripts in the page, e.g. sandbox.load("js/grid.js", "js/tile.js")
Sandbox.prototype.load = function load(...files) {
  const context = this.dom.getInternalVMContext();

  files.forEach((file) => {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    const script = new vm.Script(source, { filename: file });
    script.runInContext(context);
  });
};

// Run the queued animation frames, including any they queue themselves
Sandbox.prototype.flushFrames = function flushFrames() {
  while (this.frames.length) {
    const callback = this.frames.shift();
    callback();
  }
};

// Dispatch an event, e.g. sandbox.fire(document, "keydown", { which: 38 })
Sandbox.prototype.fire = function fire(target, type, props = {}) {
  const event = new this.window.Event(type, {
    bubbles: true,
    cancelable: true
  });
  Object.assign(event, props);
  target.dispatchEvent(event);
  return event;
};

module.exports = { Sandbox, indexHtml };
