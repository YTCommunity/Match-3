import { Scene } from 'phaser';

export class GameBackground extends Scene
{
    constructor ()
    {
        super('GameBackground');
    }

    create ()
    {
        const view = this.scale.getViewPort();

        this.bg = this.add.rectangle(0, 0, view.width, view.height, 0x222222);

        this.bg.setOrigin(0, 0);
        this.bg.setDisplaySize(view.width, view.height);

        this.scale.on('resize', this.resize, this);
    }

    resize ()
    {
        const view = this.scale.getViewPort();

        this.bg.setDisplaySize(view.width, view.height);
    }
}
