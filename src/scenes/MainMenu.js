import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.createLogos();
        this.createText();

        this.input.on('pointerdown', (pointer) => {

            this.scene.stop('Background');
            this.scene.start('Game');

        });

        //  Launch our animated background Scene
        this.scene.launch('Background');

        //  Bring our UI Scene to the top
        this.scene.bringToTop('UI');

        //  Our game is now ready to be interacted with,
        //  so we have to notify the YouTube Playables API about this:
        YouTubePlayables.gameReady();
    }

    createLogos ()
    {
        const view = this.scale.getViewPort(this.cameras.main);

        this.add.text(view.centerX, 260, "HALAL MATCH 3", {
            fontFamily: 'Arial Black', fontSize: 60, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(view.centerX, view.centerY, "Tap to Start", {
            fontFamily: 'Arial Black', fontSize: 40, color: '#00ff00',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
    }

    async createText ()
    {
        const view = this.scale.getViewPort(this.cameras.main);

        const language = await YouTubePlayables.loadLanguage();

        const info = [
            `YouTube SDK: ${YouTubePlayables.version}`,
            `In Env: ${YouTubePlayables.inPlayablesEnv}`,
            `Language: ${language}`
        ];

        this.add.text(view.centerX, view.bottom - 150, info, {
            fontFamily: 'Arial Black', fontSize: 30, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
    }
}
