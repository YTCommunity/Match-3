import { Scene } from 'phaser';

export class Background extends Scene
{
    constructor ()
    {
        super('Background');
    }

    create ()
    {
        const view = this.scale.getViewPort(this.cameras.main);

        this.bg = this.add.rectangle(0, 0, view.width, view.height, 0x000000);
        this.bg.setOrigin(0, 0);

        this.scale.on('resize', this.resize, this);
    }

    update ()
    {
    }

    resize ()
    {
        const view = this.scale.getViewPort();
        this.bg.setDisplaySize(view.width, view.height);
    }
}
