import { describe, it } from "node:test";
import assert from "node:assert";
import { Clock } from "../js/clock.js";
import { Page } from "./helpers/page.js";

function ticksOncePerTickOfThePage() {
  const page = new Page();
  let ticks = 0;
  const clock = new Clock(() => { ticks += 1; });

  page.tick();
  assert.equal(ticks, 0);

  clock.start();
  page.tick();
  page.tick();

  assert.equal(ticks, 2);
}

// Starting a clock again must not make it tick faster.
function startsOnlyOnce() {
  const page = new Page();
  let ticks = 0;
  const clock = new Clock(() => { ticks += 1; });

  clock.start();
  clock.start();
  page.tick();

  assert.equal(ticks, 1);
}

function stopsAndStartsAgain() {
  const page = new Page();
  let ticks = 0;
  const clock = new Clock(() => { ticks += 1; });

  clock.start();
  page.tick();
  clock.stop();
  clock.stop();
  page.tick();
  page.tick();
  assert.equal(ticks, 1);

  clock.start();
  page.tick();
  assert.equal(ticks, 2);
}

function ticksEveryThreeQuartersOfASecond() {
  const page = new Page();
  const intervals = [];
  page.window.setInterval = (callback, interval) => intervals.push(interval);

  new Clock(() => {}).start();
  new Clock(() => {}, 20).start();

  assert.deepEqual(intervals, [750, 20]);
}

function clockTests() {
  it("ticks once per tick, after it is started", ticksOncePerTickOfThePage);
  it("starts only once", startsOnlyOnce);
  it("is silent after stop() until it is started again", stopsAndStartsAgain);
  it("ticks every 750 ms unless it is given another interval",
    ticksEveryThreeQuartersOfASecond);
}

describe("Clock", clockTests);
