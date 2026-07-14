import { Scene } from 'phaser';
import GridManager from '../gameobjects/GridManager';
import { YouTubePlayables } from '../YouTubePlayables';

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

        // Generate halal vector graphics for tokens
        this.generateTokenGraphics();

        // Pre-allocate object pool for tokens
        this.tokenPool = [];
        for (let i = 0; i < 128; i++) {
            const token = this.add.image(0, 0, 'token1');
            token.setActive(false);
            token.setVisible(false);
            this.tokenPool.push(token);
        }

        // Notify YouTube Playables immediately
        YouTubePlayables.gameReady();

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

    generateTokenGraphics() {
        const graphics = this.make.graphics();
        const size = 64;
        const half = size / 2;

        // Token 1: Red Cross
        graphics.clear();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(half - 10, 10, 20, size - 20);
        graphics.fillRect(10, half - 10, size - 20, 20);
        graphics.generateTexture('token1', size, size);

        // Token 2: Blue Water Droplet (approximated with a circle and triangle)
        graphics.clear();
        graphics.fillStyle(0x0088ff, 1);
        graphics.fillCircle(half, half + 10, 20);
        graphics.fillTriangle(half, 10, half - 20, half + 10, half + 20, half + 10);
        graphics.generateTexture('token2', size, size);

        // Token 3: Yellow Energy Bolt
        graphics.clear();
        graphics.fillStyle(0xffcc00, 1);
        graphics.beginPath();
        graphics.moveTo(half + 10, 10);
        graphics.lineTo(15, half + 5);
        graphics.lineTo(half, half + 5);
        graphics.lineTo(half - 10, size - 10);
        graphics.lineTo(size - 15, half - 5);
        graphics.lineTo(half, half - 5);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('token3', size, size);

        // Token 4: Green Diamond
        graphics.clear();
        graphics.fillStyle(0x00cc00, 1);
        graphics.beginPath();
        graphics.moveTo(half, 10);
        graphics.lineTo(size - 10, half);
        graphics.lineTo(half, size - 10);
        graphics.lineTo(10, half);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('token4', size, size);

        // Token 5: Purple Circle
        graphics.clear();
        graphics.fillStyle(0xaa00cc, 1);
        graphics.fillCircle(half, half, 22);
        graphics.generateTexture('token5', size, size);

        // Token 6: Orange Square
        graphics.clear();
        graphics.fillStyle(0xff6600, 1);
        graphics.fillRect(12, 12, size - 24, size - 24);
        graphics.generateTexture('token6', size, size);

        graphics.destroy();
    }

    getFreeToken(type, x, y) {
        for (let i = 0; i < this.tokenPool.length; i++) {
            const token = this.tokenPool[i];
            if (!token.active) {
                token.setTexture('token' + type);
                token.setPosition(x, y);
                token.setActive(true);
                token.setVisible(true);
                token.setAlpha(1);
                token.setScale(1);
                return token;
            }
        }
        // Fallback if pool exhausted (shouldn't happen with 128 tokens for 8x8 grid)
        return this.add.image(x, y, 'token' + type);
    }

    releaseToken(sprite) {
        if (sprite) {
            sprite.setActive(false);
            sprite.setVisible(false);
            this.tweens.killTweensOf(sprite);
        }
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

                const tile = this.getFreeToken(type, x, y);
                tile.setDisplaySize(this.tileSize - 4, this.tileSize - 4);
                tile.setInteractive();

                tile.removeAllListeners('pointerdown');
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
        const matchData = this.gridManager.findAllMatches();

        if (matchData.count > 0) {
            this.isAnimating = true;

            let tweensCompleted = 0;
            const onComplete = () => {
                tweensCompleted++;
                if (tweensCompleted === matchData.count) {
                    this.isAnimating = false;
                    this.applyGravity();
                }
            };

            for (let i = 0; i < matchData.count; i++) {
                const match = matchData.matches[i];
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
                            this.releaseToken(sprite);
                            onComplete();
                        }
                    });
                } else {
                    onComplete(); // If sprite is already gone, just count it
                }
            }
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

                    const tile = this.getFreeToken(type, x, startY);
                    tile.setDisplaySize(this.tileSize - 4, this.tileSize - 4);
                    tile.setInteractive();
                    tile.removeAllListeners('pointerdown');
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
