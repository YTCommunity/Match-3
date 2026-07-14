import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';

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

        //  Bring our UI Scene to the top
        this.scene.bringToTop('UI');

        const view = this.scale.getViewPort(this.cameras.main);

        const cx = view.centerX;
        const cy = view.centerY;

        this.add.text(cx, cy - 300, `You scored ${this.registry.get('score')}`, {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 140, `Select a ball`, {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        //  Show the selection of 6 basketballs
        const ball1 = this.add.image(cx - 100, cy - 30, 'assets', 'ball-locked');
        const ball2 = this.add.image(cx, cy - 30, 'assets', 'ball-locked');
        const ball3 = this.add.image(cx + 100, cy - 30, 'assets', 'ball-locked');
        const ball4 = this.add.image(cx - 100, cy + 70, 'assets', 'ball-locked');
        const ball5 = this.add.image(cx, cy + 70, 'assets', 'ball-locked');
        const ball6 = this.add.image(cx + 100, cy + 70, 'assets', 'ball-locked');

        this.add.text(cx, cy + 220, `Score Super Shots to unlock more!`, {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        if (this.registry.get('ball1'))
        {
            ball1.setFrame('ball1');
            ball1.setInteractive();
            ball1.on('pointerdown', () => this.selectedBall(1));
        }

        if (this.registry.get('ball2'))
        {
            ball2.setFrame('ball2');
            ball2.setInteractive();
            ball2.on('pointerdown', () => this.selectedBall(2));
        }

        if (this.registry.get('ball3'))
        {
            ball3.setFrame('ball3');
            ball3.setInteractive();
            ball3.on('pointerdown', () => this.selectedBall(3));
        }

        if (this.registry.get('ball4'))
        {
            ball4.setFrame('ball4');
            ball4.setInteractive();
            ball4.on('pointerdown', () => this.selectedBall(4));
        }

        if (this.registry.get('ball5'))
        {
            ball5.setFrame('ball5');
            ball5.setInteractive();
            ball5.on('pointerdown', () => this.selectedBall(5));
        }

        if (this.registry.get('ball6'))
        {
            ball6.setFrame('ball6');
            ball6.setInteractive();
            ball6.on('pointerdown', () => this.selectedBall(6));
        }

        if (window.ytgame) {
            //  Send the score to YouTube
            try {
                window.ytgame.engagement.sendScore({ value: this.registry.get('scr') });
            } catch(e) {}

            const gameData = {
                lvl: this.registry.get('lvl'),
                scr: this.registry.get('scr')
            };

            //  Save the data to YouTube
            try {
                window.ytgame.game.saveData(JSON.stringify(gameData));
            } catch(e) {}
        }

        // Start next level or menu on interaction
        this.input.once('pointerdown', () => {
            this.scene.stop('GameBackground');
            this.scene.start('MainMenu');
        });
    }
}
