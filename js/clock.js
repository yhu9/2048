import { TICK_INTERVAL } from "./rules.js";

// Calls onTick once every interval, from the moment it is started. A clock
// only starts once: starting it again doesn't make it tick faster.
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
}
