import { WINNING_VALUE } from "./rules.js";

export class HTMLActuator {
  constructor() {
    this.container = document.querySelector(".container");
    this.gridContainer = document.querySelector(".grid-container");
    this.tileContainer = document.querySelector(".tile-container");
    this.scoreContainer = document.querySelector(".score-container");
    this.bestContainer = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");
    this.pauseButton = document.querySelector(".pause-button");

    this.score = 0;
  }

  // Draw an empty board of the given size
  showBoard({ columns, rows }) {
    // The stylesheet sizes the cells from these, so that the board fits
    // the window
    this.container.style.setProperty("--columns", columns);
    this.container.style.setProperty("--rows", rows);

    this.clearContainer(this.gridContainer);

    for (let y = 0; y < rows; y += 1) {
      const row = document.createElement("div");
      row.classList.add("grid-row");

      for (let x = 0; x < columns; x += 1) {
        const cell = document.createElement("div");
        cell.classList.add("grid-cell");
        row.appendChild(cell);
      }

      this.gridContainer.appendChild(row);
    }
  }

  actuate(grid, metadata) {
    window.requestAnimationFrame(() => {
      this.movingTile = metadata.movingTile;

      this.clearContainer(this.tileContainer);

      grid.eachCell((x, y, tile) => {
        if (tile) {
          this.addTile(tile);
        }
      });

      this.updateScore(metadata.score);
      this.updateBestScore(metadata.bestScore);

      if (metadata.terminated) {
        if (metadata.over) {
          this.message(false); // You lose
        } else if (metadata.won) {
          this.message(true); // You win!
        }
      }
    });
  }

  // Show whether the game is paused: the pause button's icon becomes a play
  // icon, because pressing it then goes on with the game.
  setPaused(paused) {
    const label = paused ? "Play" : "Pause";

    this.pauseButton.classList.toggle("paused", paused);
    this.pauseButton.setAttribute("aria-label", label);
    this.pauseButton.setAttribute("title", `${label} (P)`);
  }

  // Continues the game (both restart and keep playing)
  continueGame() {
    this.clearMessage();
  }

  clearContainer(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  addTile(tile) {
    const wrapper = document.createElement("div");
    const inner = document.createElement("div");
    const position = tile.previousPosition || { x: tile.x, y: tile.y };

    // The classes are set in one go: replacing them one at a time with
    // classList makes the tile animations glitch.
    const classes = [
      "tile",
      `tile-${tile.value}`,
      this.positionClass(position)
    ];

    if (tile.value > WINNING_VALUE) {
      classes.push("tile-super");
    }

    // The tile that is still on its way down
    if (tile === this.movingTile) {
      classes.push("tile-moving");
    }

    this.applyClasses(wrapper, classes);

    inner.classList.add("tile-inner");
    inner.textContent = tile.value;

    if (tile.previousPosition) {
      // Make sure that the tile gets rendered in the previous position first
      window.requestAnimationFrame(() => {
        classes[2] = this.positionClass({ x: tile.x, y: tile.y });
        this.applyClasses(wrapper, classes); // Update the position
      });
    } else if (tile.mergedFrom) {
      classes.push("tile-merged");
      this.applyClasses(wrapper, classes);

      // Render the tiles that merged
      tile.mergedFrom.forEach((merged) => {
        this.addTile(merged);
      });
    } else {
      classes.push("tile-new");
      this.applyClasses(wrapper, classes);
    }

    wrapper.appendChild(inner);
    this.tileContainer.appendChild(wrapper);
  }

  applyClasses(element, classes) {
    element.setAttribute("class", classes.join(" "));
  }

  // Positions in class names count from 1: tile-position-{column}-{row}
  positionClass(position) {
    return `tile-position-${position.x + 1}-${position.y + 1}`;
  }

  updateScore(score) {
    this.clearContainer(this.scoreContainer);

    const difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score;

    if (difference > 0) {
      const addition = document.createElement("div");
      addition.classList.add("score-addition");
      addition.textContent = `+${difference}`;

      this.scoreContainer.appendChild(addition);
    }
  }

  // Set the score without the "+" pop-up that updateScore shows for new
  // points
  setScore(score) {
    this.score = score;
  }

  updateBestScore(bestScore) {
    this.bestContainer.textContent = bestScore;
  }

  message(won) {
    const type = won ? "game-won" : "game-over";
    const text = won ? "You win!" : "Game over!";

    this.messageContainer.classList.add(type);
    this.messageContainer.querySelector("p").textContent = text;
  }

  clearMessage() {
    this.messageContainer.classList.remove("game-won", "game-over");
  }
}
