export default class GridManager {
    constructor(numTypes = 6) {
        this.grid = [];
        this.rows = 0;
        this.cols = 0;
        this.numTypes = numTypes;
    }

    generateGrid(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];

        for (let i = 0; i < rows; i++) {
            this.grid[i] = [];
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
