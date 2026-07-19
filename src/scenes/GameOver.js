import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        this.scene.launch('GameBackground');
        this.scene.bringToTop();
        this.scene.bringToTop('UI');

        const view = this.scale.getViewPort(this.cameras.main);
        const cx = view.centerX;
        const cy = view.centerY;

        const score = this.registry.get('score') || 0;

        this.add.text(cx, cy - 100, `GAME OVER`, {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ff0000',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(cx, cy, `Score: ${score}`, {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        const retryText = this.add.text(cx, cy + 150, `Tap to Play Again`, {
            fontFamily: 'Arial Black', fontSize: 32, color: '#00ff00',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setInteractive();

        retryText.on('pointerdown', () => {
            this.scene.stop('GameBackground');
            this.scene.start('MainMenu');
        });

        // Use native YouTube Playables SDK as memory instructed
        if (window.ytgame) {
            try {
                window.ytgame.engagement.sendScore({ value: score });
            } catch (e) {
                console.log("Failed to send score");
            }

            // Must use minified JSON and not exceed 64KiB
            const payload = JSON.stringify({ scr: score });
            try {
                window.ytgame.game.saveData(payload);
            } catch (e) {
                console.log("Failed to save data");
            }
        }
    }
}
