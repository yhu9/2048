"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");
const { Sandbox } = require("./helpers/sandbox");

function loadPage() {
  const sandbox = new Sandbox();
  sandbox.load("js/local_storage_manager.js");
  return sandbox.window;
}

function newManager() {
  return new (loadPage().LocalStorageManager)();
}

function bestScoreStartsAtZero() {
  const storage = newManager();

  assert.equal(storage.getBestScore(), 0);

  storage.setBestScore(1200);
  assert.equal(storage.getBestScore(), 1200);
}

function savesAndLoadsGameState() {
  const storage = newManager();
  const state = { grid: { size: 4, cells: [] }, score: 12, over: false };

  assert.equal(storage.getGameState(), null);

  storage.setGameState(state);
  assert.deepEqual(storage.getGameState(), state);
}

function clearsGameStateOnly() {
  const storage = newManager();
  storage.setBestScore(300);
  storage.setGameState({ score: 300 });

  storage.clearGameState();

  assert.equal(storage.getGameState(), null);
  assert.equal(storage.getBestScore(), 300);
}

function usesLocalStorage() {
  const window = loadPage();
  const storage = new window.LocalStorageManager();

  storage.setBestScore(64);

  assert.equal(storage.storage, window.localStorage);
  assert.equal(window.localStorage.getItem("bestScore"), "64");
}

function fallsBackToMemory() {
  const window = loadPage();
  Object.defineProperty(window, "localStorage", { value: undefined });

  const storage = new window.LocalStorageManager();
  storage.setBestScore(20);
  storage.setGameState({ score: 20 });

  assert.equal(storage.storage, window.fakeStorage);
  assert.equal(storage.getBestScore(), 20);
  assert.equal(storage.getGameState().score, 20);
}

function localStorageManagerTests() {
  it("has a best score of 0 until one is saved", bestScoreStartsAtZero);
  it("saves and loads the game state", savesAndLoadsGameState);
  it("clears the game state but keeps the best score", clearsGameStateOnly);
  it("uses localStorage when it's available", usesLocalStorage);
  it("falls back to in-memory storage without localStorage",
    fallsBackToMemory);
}

describe("LocalStorageManager", localStorageManagerTests);
