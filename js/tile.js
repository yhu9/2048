const DEFAULT_VALUE = 2;

export class Tile {
  constructor(position, value = DEFAULT_VALUE) {
    this.x = position.x;
    this.y = position.y;
    this.value = value;

    this.previousPosition = null;
    this.mergedFrom = null; // Tracks tiles that merged together
  }

  savePosition() {
    this.previousPosition = { x: this.x, y: this.y };
  }

  updatePosition(position) {
    this.x = position.x;
    this.y = position.y;
  }

  serialize() {
    return {
      position: { x: this.x, y: this.y },
      value: this.value
    };
  }
}
