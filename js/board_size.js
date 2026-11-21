// The boards the game can be played on. A board size is an object with the
// number of columns and rows: { columns: 4, rows: 6 }

// The board a new game is played on. The game works on any size the
// stylesheet has tile positions for: up to 8 columns and 6 rows.
export const DEFAULT_BOARD_SIZE = Object.freeze({ columns: 4, rows: 6 });

// The board of the classic game, which was the only one there used to be
const CLASSIC_BOARD_SIZE = Object.freeze({ columns: 4, rows: 4 });

export function isClassicBoardSize({ columns, rows }) {
  return columns === CLASSIC_BOARD_SIZE.columns &&
         rows === CLASSIC_BOARD_SIZE.rows;
}
