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
        const tileSize = 64;
        const offsetX = (this.scale.width - (this.gridManager.cols * tileSize)) / 2 + tileSize / 2;
        const offsetY = (this.scale.height - (this.gridManager.rows * tileSize)) / 2 + tileSize / 2;

        const colors = [
            0xff0000, // Type 1: Red
            0x00ff00, // Type 2: Green
            0x0000ff, // Type 3: Blue
            0xffff00, // Type 4: Yellow
            0xff00ff, // Type 5: Magenta
            0x00ffff  // Type 6: Cyan
        ];

        for (let row = 0; row < this.gridManager.rows; row++) {
            for (let col = 0; col < this.gridManager.cols; col++) {
                const type = this.gridManager.grid[row][col];
                const x = offsetX + col * tileSize;
                const y = offsetY + row * tileSize;

                // Create a colored square to represent the tile
                const color = colors[type - 1] || 0xffffff;
                const tile = this.add.rectangle(x, y, tileSize - 4, tileSize - 4, color);
                tile.setStrokeStyle(2, 0xffffff);
            }
        }
    }
}
