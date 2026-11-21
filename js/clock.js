import { TICK_INTERVAL } from "./rules.js";

// Calls onTick once every interval while it is running. Starting a clock
// that is running doesn't make it tick faster. After stop() it is silent
// until it is started again, and the next tick is a full interval later.
export class Clock {
  constructor(onTick, interval = TICK_INTERVAL) {
    this.onTick = onTick;
    this.interval = interval;
    this.timer = null;
  }

  start() {
    if (this.timer !== null) return;

    this.timer = window.setInterval(() => this.onTick(), this.interval);
  }

  stop() {
    if (this.timer === null) return;

    window.clearInterval(this.timer);
    this.timer = null;
  }
}
