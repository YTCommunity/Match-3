import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        this.createLoadingBar();
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets

        //  Audio from:
        //  https://opengameart.org/content/sfxthrow
        //  https://opengameart.org/content/inventory-sound-effects
        //  https://opengameart.org/content/85-short-music-jingles
        //  https://opengameart.org/content/magic-sfx-sample
        this.load.setPath('assets/fx');
        this.load.audio('throw', [ 'throw.wav', 'throw.mp3' ]);
        this.load.audio('net', [ 'net.wav',' net.mp3' ]);
        this.load.audio('ricochet', [ 'ricochet.wav', 'ricochet.mp3' ]);
        this.load.audio('super-shot', [ 'super-shot.wav', 'super-shot.mp3' ]);
        this.load.audio('next-stage', [ 'next-stage.wav', 'next-stage.mp3' ]);
    }

    create ()
    {
        //  Launch our UI Scene
        this.scene.launch('UI');

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }

    createLoadingBar ()
    {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0, 0);

        const cx = width / 2;
        const cy = height / 2;

        const barOuterWidth = width * 0.70;
        const barWidth = barOuterWidth - 4;

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(cx, cy, barOuterWidth, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(cx - (barWidth / 2) + 2, cy, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = barWidth * progress;

        });

        //  Now we have displayed all of our loader graphics, we need to tell the YouTube Playables API that we are first-frame ready:
        YouTubePlayables.firstFrameReady();
    }
}
