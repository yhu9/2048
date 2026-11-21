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

function clockTests() {
  it("ticks once per tick, after it is started", ticksOncePerTickOfThePage);
  it("starts only once", startsOnlyOnce);
}

describe("Clock", clockTests);
