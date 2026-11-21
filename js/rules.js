// The numbers that set the rules of the game. They are written here and
// nowhere else.

// A merge that makes this tile wins the game
export const WINNING_VALUE = 2048;

// A new tile is a 2 this often, and a 4 otherwise
export const CHANCE_OF_TWO = 0.9;

// Milliseconds between two ticks
export const TICK_INTERVAL = 500;

// A new game starts with this many tiles on the board, before the moving
// tile comes in.
export const START_TILES = 2;
