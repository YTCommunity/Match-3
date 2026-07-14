import { Scene } from 'phaser';
import GridManager from '../gameobjects/GridManager';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.scene.launch('GameBackground');
        this.scene.bringToTop();

        // Instantiate GridManager
        this.gridManager = new GridManager(6); // 6 tile types
        this.gridManager.generateGrid(8, 8); // 8x8 grid

        // Ensure there is at least one valid move, if not regenerate until solvable
        while (!this.gridManager.hasValidMove()) {
            this.gridManager.generateGrid(8, 8);
        }

        // Render the generated tiles onto the screen
        this.renderGrid();
    }

    renderGrid()
    {
        this.tileSize = 64;
        this.offsetX = (this.scale.width - (this.gridManager.cols * this.tileSize)) / 2 + this.tileSize / 2;
        this.offsetY = (this.scale.height - (this.gridManager.rows * this.tileSize)) / 2 + this.tileSize / 2;

        this.tileSprites = Array(this.gridManager.rows).fill(null).map(() => Array(this.gridManager.cols).fill(null));

        for (let row = 0; row < this.gridManager.rows; row++) {
            for (let col = 0; col < this.gridManager.cols; col++) {
                const type = this.gridManager.grid[row][col];
                const x = this.offsetX + col * this.tileSize;
                const y = this.offsetY + row * this.tileSize;

                const tile = this.add.image(x, y, 'assets', 'ball' + type);
                tile.setDisplaySize(this.tileSize - 4, this.tileSize - 4);
                tile.setInteractive();

                tile.on('pointerdown', () => this.handleTileClick(row, col));

                this.tileSprites[row][col] = tile;
            }
        }
    }

    handleTileClick(row, col) {
        if (this.isAnimating) return; // Prevent clicks while animating

        if (!this.selectedTile) {
            this.selectedTile = { row, col };
            this.tileSprites[row][col].setAlpha(0.5); // Highlight selected
        } else {
            const r1 = this.selectedTile.row;
            const c1 = this.selectedTile.col;

            // Deselect visually
            if (this.tileSprites[r1][c1]) {
                this.tileSprites[r1][c1].setAlpha(1);
            }

            // Check if adjacent
            const isAdjacent = (Math.abs(r1 - row) === 1 && c1 === col) || (Math.abs(c1 - col) === 1 && r1 === row);

            if (isAdjacent) {
                this.swapTiles(r1, c1, row, col);
            } else {
                // If not adjacent, just select the new one
                this.selectedTile = { row, col };
                this.tileSprites[row][col].setAlpha(0.5);
                return;
            }

            this.selectedTile = null;
        }
    }

    swapTiles(r1, c1, r2, c2, isRevert = false) {
        this.isAnimating = true;

        const sprite1 = this.tileSprites[r1][c1];
        const sprite2 = this.tileSprites[r2][c2];

        // Logical swap in GridManager
        this.gridManager.swap(r1, c1, r2, c2);

        // Logical swap in Game.js sprite array
        this.tileSprites[r1][c1] = sprite2;
        this.tileSprites[r2][c2] = sprite1;

        const x1 = this.offsetX + c1 * this.tileSize;
        const y1 = this.offsetY + r1 * this.tileSize;
        const x2 = this.offsetX + c2 * this.tileSize;
        const y2 = this.offsetY + r2 * this.tileSize;

        let tweensCompleted = 0;
        const onComplete = () => {
            tweensCompleted++;
            if (tweensCompleted === 2) {
                this.isAnimating = false;
                if (!isRevert) {
                    this.resolveMatches(r1, c1, r2, c2);
                }
            }
        };

        this.tweens.add({
            targets: sprite1,
            x: x2,
            y: y2,
            duration: 200,
            onComplete: onComplete
        });

        this.tweens.add({
            targets: sprite2,
            x: x1,
            y: y1,
            duration: 200,
            onComplete: onComplete
        });
    }

    resolveMatches(r1 = null, c1 = null, r2 = null, c2 = null) {
        const matches = this.gridManager.findAllMatches();

        if (matches.length > 0) {
            this.isAnimating = true;

            let tweensCompleted = 0;
            const onComplete = () => {
                tweensCompleted++;
                if (tweensCompleted === matches.length) {
                    this.isAnimating = false;
                    this.applyGravity();
                }
            };

            matches.forEach(match => {
                const r = match.row;
                const c = match.col;
                const sprite = this.tileSprites[r][c];

                if (sprite) {
                    // Logically remove
                    this.gridManager.grid[r][c] = null;
                    this.tileSprites[r][c] = null;

                    this.tweens.add({
                        targets: sprite,
                        scaleX: 0,
                        scaleY: 0,
                        duration: 200,
                        onComplete: () => {
                            sprite.destroy();
                            onComplete();
                        }
                    });
                } else {
                    onComplete(); // If sprite is already gone, just count it
                }
            });
        } else if (r1 !== null && c1 !== null && r2 !== null && c2 !== null) {
            // No matches found after a user swap, swap back
            this.swapTiles(r2, c2, r1, c1, true); // true indicates a revert swap
        }
    }

    applyGravity() {
        this.isAnimating = true;

        let tweensToRun = 0;
        let tweensCompleted = 0;

        const checkGravityComplete = () => {
            tweensCompleted++;
            if (tweensCompleted === tweensToRun) {
                this.isAnimating = false;
                // Wait briefly before resolving new matches from the cascade
                this.time.delayedCall(100, () => {
                    this.resolveMatches();
                });
            }
        };

        // 1. Move existing tiles down
        for (let col = 0; col < this.gridManager.cols; col++) {
            for (let row = this.gridManager.rows - 1; row >= 0; row--) {
                if (this.gridManager.grid[row][col] === null) {
                    // Find the nearest tile above
                    for (let r = row - 1; r >= 0; r--) {
                        if (this.gridManager.grid[r][col] !== null) {
                            // Move logically
                            this.gridManager.grid[row][col] = this.gridManager.grid[r][col];
                            this.gridManager.grid[r][col] = null;

                            const sprite = this.tileSprites[r][col];
                            this.tileSprites[row][col] = sprite;
                            this.tileSprites[r][col] = null;

                            // Animate falling
                            tweensToRun++;
                            const newY = this.offsetY + row * this.tileSize;
                            this.tweens.add({
                                targets: sprite,
                                y: newY,
                                duration: 200,
                                ease: 'Bounce.easeOut',
                                onComplete: checkGravityComplete
                            });

                            break; // Moved a tile down, move on to the next empty space in the main loop
                        }
                    }
                }
            }
        }

        // 2. Spawn new tiles for the remaining empty spaces at the top
        for (let col = 0; col < this.gridManager.cols; col++) {
            for (let row = 0; row < this.gridManager.rows; row++) {
                if (this.gridManager.grid[row][col] === null) {
                    const type = Math.floor(Math.random() * this.gridManager.numTypes) + 1;
                    this.gridManager.grid[row][col] = type;

                    const x = this.offsetX + col * this.tileSize;
                    const finalY = this.offsetY + row * this.tileSize;
                    const startY = this.offsetY - (this.gridManager.rows * this.tileSize); // Start way above

                    const tile = this.add.image(x, startY, 'assets', 'ball' + type);
                    tile.setDisplaySize(this.tileSize - 4, this.tileSize - 4);
                    tile.setInteractive();
                    tile.on('pointerdown', () => this.handleTileClick(row, col));

                    this.tileSprites[row][col] = tile;

                    tweensToRun++;
                    this.tweens.add({
                        targets: tile,
                        y: finalY,
                        duration: 300,
                        delay: row * 50, // Slight delay for stagger effect
                        ease: 'Bounce.easeOut',
                        onComplete: checkGravityComplete
                    });
                }
            }
        }

        // If no tweens were added (e.g., edge case), just resolve immediately
        if (tweensToRun === 0) {
            this.isAnimating = false;
            this.resolveMatches();
        }
    }
}
