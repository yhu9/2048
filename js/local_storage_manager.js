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

  getGameState() {
    const stateJSON = this.storage.getItem(GAME_STATE_KEY);
    return stateJSON ? JSON.parse(stateJSON) : null;
  }

  setGameState(gameState) {
    this.storage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
  }

  clearGameState() {
    this.storage.removeItem(GAME_STATE_KEY);
  }
}
