import { GameManager } from "./game_manager.js";
import { HTMLActuator } from "./html_actuator.js";
import { KeyboardInputManager } from "./keyboard_input_manager.js";
import { LocalStorageManager } from "./local_storage_manager.js";

const BOARD_SIZE = 4;

// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(() => {
  new GameManager(
    BOARD_SIZE, KeyboardInputManager, HTMLActuator, LocalStorageManager
  );
});
