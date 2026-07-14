import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/bg.png');
    }

    async create ()
    {
        //  This will load our saved cloud data from the Playables API.

        //  We use the withTimeout wrapper to ensure that the loadData call doesn't hang indefinitely
        //  (which can happen often in the Test Suite if you're using a hot-reloaded setup)

        try
        {
            // Use ytgame directly for data persistence as requested
            let data = {};
            if (window.ytgame) {
                const rawdata = await window.ytgame.game.loadData();
                if (rawdata) {
                    data = JSON.parse(rawdata);
                }
            }

            console.log('loadData() result', data);

            this.registry.set('lvl', Phaser.Utils.Objects.GetFastValue(data, 'lvl', 1));
            this.registry.set('scr', Phaser.Utils.Objects.GetFastValue(data, 'scr', 0));
        }
        catch (error)
        {
            console.error(error);
        }

        if (window.ytgame) {
            // Strictly handle system interrupts directly via ytgame
            window.ytgame.system.onPause(() => {
                console.log('YouTube Playables API has requested game pause');
                this.game.pause();
            });

            window.ytgame.system.onResume(() => {
                console.log('YouTube Playables API has requested game resume');
                this.game.resume();
            });

            // Set up audio change listener directly via ytgame
            window.ytgame.system.onAudioEnabledChange((enabled) => {
                console.log('YouTube Playables API has requested audio change', enabled);
                this.sound.setMute(!enabled);
            });

            // Initially check if audio is enabled via ytgame
            const isAudioEnabled = window.ytgame.system.isAudioEnabled();
            this.sound.setMute(!isAudioEnabled);
        }

        this.scene.start('Preloader');
    }
}
