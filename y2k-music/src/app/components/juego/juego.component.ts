import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Cell {
  hasMine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

@Component({
  selector: 'app-juego',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './juego.component.html',
  styleUrls: ['./juego.component.css']
})
export class JuegoComponent {
  readonly rows = 8;
  readonly cols = 8;
  readonly minesCount = 10;
  status = signal<'playing' | 'won' | 'lost'>('playing');
  grid = signal<Cell[][]>([]);

  private revealedCount = 0;
  private flagsCount = 0;

  constructor() {
    this.reset();
  }

  get statusText() {
    if (this.status() === 'won') {
      return '¡Ganaste!';
    }
    if (this.status() === 'lost') {
      return 'Has perdido...';
    }
    return 'En juego';
  }

  get flagsLeft() {
    return this.minesCount - this.flagsCount;
  }

  reset() {
    this.status.set('playing');
    this.revealedCount = 0;
    this.flagsCount = 0;
    this.grid.set(this.createGrid());
  }

  createGrid(): Cell[][] {
    const grid: Cell[][] = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({
        hasMine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );

    let placed = 0;
    while (placed < this.minesCount) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);
      if (!grid[row][col].hasMine) {
        grid[row][col].hasMine = true;
        placed += 1;
      }
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!grid[row][col].hasMine) {
          grid[row][col].adjacent = this.countAdjacentMines(grid, row, col);
        }
      }
    }

    return grid;
  }

  countAdjacentMines(grid: Cell[][], row: number, col: number) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && grid[r][c].hasMine) {
          count += 1;
        }
      }
    }
    return count;
  }

  revealCell(row: number, col: number) {
    if (this.status() !== 'playing') {
      return;
    }

    const grid = this.grid();
    const cell = grid[row][col];
    if (cell.revealed || cell.flagged) {
      return;
    }

    cell.revealed = true;
    if (cell.hasMine) {
      this.status.set('lost');
      this.revealMines(grid);
      this.grid.set([...grid]);
      return;
    }

    this.revealedCount += 1;
    if (cell.adjacent === 0) {
      this.revealEmptyNeighbors(grid, row, col);
    }

    if (this.checkWin(grid)) {
      this.status.set('won');
      this.revealMines(grid);
    }

    this.grid.set([...grid]);
  }

  revealEmptyNeighbors(grid: Cell[][], row: number, col: number) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
          continue;
        }
        const neighbor = grid[r][c];
        if (!neighbor.revealed && !neighbor.hasMine && !neighbor.flagged) {
          neighbor.revealed = true;
          this.revealedCount += 1;
          if (neighbor.adjacent === 0) {
            this.revealEmptyNeighbors(grid, r, c);
          }
        }
      }
    }
  }

  revealMines(grid: Cell[][]) {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.hasMine) {
          cell.revealed = true;
        }
      }
    }
  }

  toggleFlag(row: number, col: number) {
    if (this.status() !== 'playing') {
      return;
    }

    const grid = this.grid();
    const cell = grid[row][col];
    if (cell.revealed) {
      return;
    }

    cell.flagged = !cell.flagged;
    this.flagsCount += cell.flagged ? 1 : -1;
    this.grid.set([...grid]);
  }

  checkWin(grid: Cell[][]) {
    const totalSafe = this.rows * this.cols - this.minesCount;
    const revealedSafe = grid.flat().filter(cell => cell.revealed && !cell.hasMine).length;
    return revealedSafe === totalSafe;
  }
}
