import { isClassicBoardSize } from "./board_size.js";

const BEST_SCORE_KEY = "bestScore";
const GAME_STATE_KEY = "gameState";

// Stands in for localStorage when the browser doesn't allow it, for example
// in private browsing. Nothing is kept after the page closes.
class MemoryStorage {
  constructor() {
    this.data = {};
  }

  setItem(id, value) {
    this.data[id] = String(value);
  }

  getItem(id) {
    return Object.hasOwn(this.data, id) ? this.data[id] : null;
  }

  removeItem(id) {
    delete this.data[id];
  }
}

function localStorageSupported() {
  const testKey = "test";

  try {
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

// Every board size has its own best score. The classic 4x4 board keeps the
// key it always had, so players keep the best score they already have.
function bestScoreKey(boardSize) {
  if (isClassicBoardSize(boardSize)) {
    return BEST_SCORE_KEY;
  }
  return `${BEST_SCORE_KEY}-${boardSize.columns}x${boardSize.rows}`;
}

// A saved grid can be used if its cells are complete: as many columns as
// the grid says, with as many cells in each as it has rows. Games saved
// before boards could be rectangular have one size for both.
function isCompleteGrid(grid) {
  if (!grid || !Array.isArray(grid.cells)) return false;

  const { size, columns = size, rows = size, cells } = grid;

  return cells.length === columns && cells.every((column) => (
    Array.isArray(column) && column.length === rows
  ));
}

export class LocalStorageManager {
  constructor() {
    this.storage = localStorageSupported()
      ? window.localStorage
      : new MemoryStorage();
  }

  getBestScore(boardSize) {
    return Number(this.storage.getItem(bestScoreKey(boardSize))) || 0;
  }

  setBestScore(score, boardSize) {
    this.storage.setItem(bestScoreKey(boardSize), score);
  }

  // The saved game, or null if there is none or it can't be used
  getGameState() {
    const stateJSON = this.storage.getItem(GAME_STATE_KEY);
    let state;

    try {
      state = stateJSON ? JSON.parse(stateJSON) : null;
    } catch (error) {
      return null; // The saved text isn't JSON
    }

    return state && isCompleteGrid(state.grid) ? state : null;
  }

  setGameState(gameState) {
    this.storage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
  }

  clearGameState() {
    this.storage.removeItem(GAME_STATE_KEY);
  }
}
