export default class GridManager {
    constructor(numTypes = 6) {
        this.grid = Array.from({ length: 12 }, () => Array(12).fill(null));
        this.matchedCells = Array.from({ length: 144 }, () => ({ row: 0, col: 0 }));
        this.uniqueMatches = Array.from({ length: 144 }, () => ({ row: 0, col: 0 }));
        this.matchedCellsCount = 0;
        this.uniqueMatchesCount = 0;
        this.rows = 0;
        this.cols = 0;
        this.numTypes = numTypes;
    }

    generateGrid(rows, cols) {
        this.rows = rows;
        this.cols = cols;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let isValid = false;
                let type;

                while (!isValid) {
                    type = Math.floor(Math.random() * this.numTypes) + 1;
                    let hasVerticalMatch = false;
                    let hasHorizontalMatch = false;

                    if (i >= 2) {
                        if (this.grid[i - 1][j] === type && this.grid[i - 2][j] === type) {
                            hasVerticalMatch = true;
                        }
                    }

                    if (j >= 2) {
                        if (this.grid[i][j - 1] === type && this.grid[i][j - 2] === type) {
                            hasHorizontalMatch = true;
                        }
                    }

                    if (!hasVerticalMatch && !hasHorizontalMatch) {
                        isValid = true;
                    }
                }

                this.grid[i][j] = type;
            }
        }
    }

    hasValidMove() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                // Check horizontal swap (j with j + 1)
                if (j < this.cols - 1) {
                    // Swap
                    let temp = this.grid[i][j];
                    this.grid[i][j] = this.grid[i][j + 1];
                    this.grid[i][j + 1] = temp;

                    let matchFound = this.checkMatchesAt(i, j) || this.checkMatchesAt(i, j + 1);

                    // Swap back
                    temp = this.grid[i][j];
                    this.grid[i][j] = this.grid[i][j + 1];
                    this.grid[i][j + 1] = temp;

                    if (matchFound) {
                        return true;
                    }
                }

                // Check vertical swap (i with i + 1)
                if (i < this.rows - 1) {
                    // Swap
                    let temp = this.grid[i][j];
                    this.grid[i][j] = this.grid[i + 1][j];
                    this.grid[i + 1][j] = temp;

                    let matchFound = this.checkMatchesAt(i, j) || this.checkMatchesAt(i + 1, j);

                    // Swap back
                    temp = this.grid[i][j];
                    this.grid[i][j] = this.grid[i + 1][j];
                    this.grid[i + 1][j] = temp;

                    if (matchFound) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    swap(r1, c1, r2, c2) {
        let temp = this.grid[r1][c1];
        this.grid[r1][c1] = this.grid[r2][c2];
        this.grid[r2][c2] = temp;
    }

    findAllMatches() {
        this.matchedCellsCount = 0;
        this.uniqueMatchesCount = 0;

        // Check horizontal matches
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 2; c++) {
                let type1 = this.grid[r][c];
                if (type1 !== null && type1 !== undefined) {
                    let matchLength = 1;
                    while (c + matchLength < this.cols && this.grid[r][c + matchLength] === type1) {
                        matchLength++;
                    }
                    if (matchLength >= 3) {
                        for (let k = 0; k < matchLength; k++) {
                            if (this.matchedCellsCount < this.matchedCells.length) {
                                this.matchedCells[this.matchedCellsCount].row = r;
                                this.matchedCells[this.matchedCellsCount].col = c + k;
                                this.matchedCellsCount++;
                            }
                        }
                    }
                }
            }
        }

        // Check vertical matches
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows - 2; r++) {
                let type1 = this.grid[r][c];
                if (type1 !== null && type1 !== undefined) {
                    let matchLength = 1;
                    while (r + matchLength < this.rows && this.grid[r + matchLength][c] === type1) {
                        matchLength++;
                    }
                    if (matchLength >= 3) {
                        for (let k = 0; k < matchLength; k++) {
                            if (this.matchedCellsCount < this.matchedCells.length) {
                                this.matchedCells[this.matchedCellsCount].row = r + k;
                                this.matchedCells[this.matchedCellsCount].col = c;
                                this.matchedCellsCount++;
                            }
                        }
                    }
                }
            }
        }

        // Remove duplicates manually
        for (let i = 0; i < this.matchedCellsCount; i++) {
            let cell = this.matchedCells[i];
            let isDuplicate = false;

            for (let j = 0; j < this.uniqueMatchesCount; j++) {
                if (this.uniqueMatches[j].row === cell.row && this.uniqueMatches[j].col === cell.col) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate && this.uniqueMatchesCount < this.uniqueMatches.length) {
                this.uniqueMatches[this.uniqueMatchesCount].row = cell.row;
                this.uniqueMatches[this.uniqueMatchesCount].col = cell.col;
                this.uniqueMatchesCount++;
            }
        }

        return { matches: this.uniqueMatches, count: this.uniqueMatchesCount };
    }

    checkMatchesAt(row, col) {
        let type = this.grid[row][col];
        if (type === null || type === undefined) return false;

        // Check horizontal matches around (row, col)
        let count = 1;
        // Check left
        let c = col - 1;
        while (c >= 0 && this.grid[row][c] === type) {
            count++;
            c--;
        }
        // Check right
        c = col + 1;
        while (c < this.cols && this.grid[row][c] === type) {
            count++;
            c++;
        }
        if (count >= 3) return true;

        // Check vertical matches around (row, col)
        count = 1;
        // Check up
        let r = row - 1;
        while (r >= 0 && this.grid[r][col] === type) {
            count++;
            r--;
        }
        // Check down
        r = row + 1;
        while (r < this.rows && this.grid[r][col] === type) {
            count++;
            r++;
        }
        if (count >= 3) return true;

        return false;
    }
}
