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

        const createToken = (x, y, i, isUnlocked) => {
            const rect = this.add.rectangle(x, y, 64, 64, isUnlocked ? 0x00ff00 : 0x555555).setInteractive();
            this.add.text(x, y, isUnlocked ? `T${i}` : 'L', {
                fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff'
            }).setOrigin(0.5);

            if (isUnlocked) {
                rect.on('pointerdown', () => this.selectedBall(i));
            }
        };

        //  Show the selection of 6 tokens
        createToken(cx - 100, cy - 30, 1, this.registry.get('ball1'));
        createToken(cx, cy - 30, 2, this.registry.get('ball2'));
        createToken(cx + 100, cy - 30, 3, this.registry.get('ball3'));
        createToken(cx - 100, cy + 70, 4, this.registry.get('ball4'));
        createToken(cx, cy + 70, 5, this.registry.get('ball5'));
        createToken(cx + 100, cy + 70, 6, this.registry.get('ball6'));

        this.add.text(cx, cy + 220, `Score more to unlock tokens!`, {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        //  Send the score to YouTube
        YouTubePlayables.sendScore(this.registry.get('score'));

        //  you can also do:
        // ytgame?.engagement.sendScore({ value: this.registry.get('score') });
    }

    selectedBall (ball)
    {
        this.registry.set('activeBall', `ball${ball}`);

        const gameData = {
            activeBall: `ball${ball}`,
            ball1: this.registry.get('ball1'),
            ball2: this.registry.get('ball2'),
            ball3: this.registry.get('ball3'),
            ball4: this.registry.get('ball4'),
            ball5: this.registry.get('ball5'),
            ball6: this.registry.get('ball6')
        };

        //  Save the data to YouTube
        YouTubePlayables.saveData(gameData);

        //  you can also do:
        // ytgame?.game.saveData(string);

        this.scene.stop('GameBackground');
        this.scene.start('MainMenu');
    }
}
