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

// A saved grid can be used if its cells form a complete square: as many
// cells in every column as there are columns.
function isCompleteGrid(grid) {
  const cells = grid && grid.cells;

  return Array.isArray(cells) && cells.every((column) => (
    Array.isArray(column) && column.length === cells.length
  ));
}

export class LocalStorageManager {
  constructor() {
    this.storage = localStorageSupported()
      ? window.localStorage
      : new MemoryStorage();
  }

  getBestScore() {
    return Number(this.storage.getItem(BEST_SCORE_KEY)) || 0;
  }

  setBestScore(score) {
    this.storage.setItem(BEST_SCORE_KEY, score);
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
