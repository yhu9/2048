import { DEFAULT_BOARD_SIZE } from "./board_size.js";
import { GameManager } from "./game_manager.js";
import { HTMLActuator } from "./html_actuator.js";
import { KeyboardInputManager } from "./keyboard_input_manager.js";
import { LocalStorageManager } from "./local_storage_manager.js";

// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(() => {
  new GameManager(
    DEFAULT_BOARD_SIZE, KeyboardInputManager, HTMLActuator, LocalStorageManager
  );
});
