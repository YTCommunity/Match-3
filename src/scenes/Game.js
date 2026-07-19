import { Scene } from 'phaser';
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

        // Generate halal vector graphics for game
        this.generateGraphics();

        // Notify YouTube Playables immediately
        YouTubePlayables.gameReady();

        this.view = this.scale.getViewPort(this.cameras.main);

        // Background elements (Sky, Sun, Buildings)
        this.add.rectangle(this.view.centerX, this.view.centerY, this.view.width, this.view.height, 0x87CEEB); // Sky Blue

        this.add.circle(this.view.width * 0.8, this.view.height * 0.2, 80, 0xFFD700); // Bright Sun

        // Simple abstract building rectangles on sides
        this.add.rectangle(this.view.width * 0.1, this.view.height * 0.6, this.view.width * 0.2, this.view.height * 0.8, 0x555555);
        this.add.rectangle(this.view.width * 0.9, this.view.height * 0.7, this.view.width * 0.2, this.view.height * 0.6, 0x666666);
        this.add.rectangle(this.view.width * 0.05, this.view.height * 0.8, this.view.width * 0.15, this.view.height * 0.4, 0x444444);
        this.add.rectangle(this.view.width * 0.95, this.view.height * 0.5, this.view.width * 0.15, this.view.height * 0.5, 0x777777);


        // Initialize player entity
        this.player = this.physics.add.sprite(this.view.centerX, this.view.height - 200, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Lane setup
        this.laneWidth = this.view.width / 3;
        this.lanes = [
            this.laneWidth / 2,
            this.laneWidth + this.laneWidth / 2,
            this.laneWidth * 2 + this.laneWidth / 2
        ];
        this.currentLane = 1;
        this.player.x = this.lanes[this.currentLane];
        this.player.setOrigin(0.5, 1);

        // State variables
        this.isAirborne = false;
        this.isRolling = false;
        this.swipeStartX = 0;
        this.swipeStartY = 0;

        // Graphics for web
        this.webGraphics = this.add.graphics();
        this.webGraphics.setDepth(9);

        // Input handling for swipes
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointerup', this.handlePointerUp, this);

        // Pools for obstacles and coins
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        this.baseSpeed = 400;

        // Scoring
        this.score = 0;
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });
        this.scoreText.setDepth(20);

        // Physics overlaps
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);

        this.spawnTimer = 0;


    }


    handlePointerDown(pointer) {
        this.swipeStartX = pointer.x;
        this.swipeStartY = pointer.y;
    }

    handlePointerUp(pointer) {
        const swipeEndX = pointer.x;
        const swipeEndY = pointer.y;

        const dx = swipeEndX - this.swipeStartX;
        const dy = swipeEndY - this.swipeStartY;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) > 30) {
            // Horizontal swipe
            if (absDx > absDy) {
                if (dx > 0) {
                    this.moveLane(1); // Right
                } else {
                    this.moveLane(-1); // Left
                }
            }
            // Vertical swipe
            else {
                if (dy < 0) {
                    this.swing(); // Up
                } else {
                    this.roll(); // Down
                }
            }
        }
    }

    moveLane(direction) {
        let newLane = this.currentLane + direction;
        if (newLane >= 0 && newLane < 3) {
            this.currentLane = newLane;
            this.tweens.add({
                targets: this.player,
                x: this.lanes[this.currentLane],
                duration: 150,
                ease: 'Power2'
            });
        }
    }

    swing() {
        if (this.isAirborne || this.isRolling) return;
        this.isAirborne = true;

        // Visual swing animation
        this.tweens.add({
            targets: this.player,
            y: this.view.height - 350,
            duration: 400,
            yoyo: true,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.isAirborne = false;
            }
        });
    }

    roll() {
        if (this.isAirborne || this.isRolling) return;
        this.isRolling = true;

        this.tweens.add({
            targets: this.player,
            scaleY: 0.5,
            duration: 250,
            yoyo: true,
            onComplete: () => {
                this.isRolling = false;
            }
        });
    }

    update(time, delta) {
        this.webGraphics.clear();

        // Handle spawning

        if (!this.physics.world.isPaused) {
            this.score += (delta / 1000) * 10; // 10 points per second
            this.scoreText.setText('Score: ' + Math.floor(this.score));
        }

        this.spawnTimer += delta;
        if (this.spawnTimer > 1000) {
            this.spawnEntity();
            this.spawnTimer = 0;
            this.baseSpeed += 5; // Gradually increase speed
        }

        // Move and cleanup obstacles
        this.obstacles.getChildren().forEach(obstacle => {
            obstacle.y += (this.baseSpeed * delta) / 1000;
            if (obstacle.y > this.view.height + 100) {
                obstacle.setActive(false);
                obstacle.setVisible(false);
                obstacle.body.enable = false;
            }
        });

        // Move and cleanup coins
        this.coins.getChildren().forEach(coin => {
            coin.y += (this.baseSpeed * delta) / 1000;
            if (coin.y > this.view.height + 100) {
                coin.setActive(false);
                coin.setVisible(false);
                coin.body.enable = false;
            }
        });

        if (this.isAirborne) {
            this.webGraphics.lineStyle(4, 0xffffff, 1);
            this.webGraphics.beginPath();
            this.webGraphics.moveTo(this.view.centerX, 0);
            this.webGraphics.lineTo(this.player.x, this.player.y - this.player.displayHeight / 2);
            this.webGraphics.strokePath();
        }
    }



    collectCoin(player, coin) {
        if (!coin.active) return;
        coin.setActive(false);
        coin.setVisible(false);
        coin.body.enable = false;
        this.score += 50;
        this.scoreText.setText('Score: ' + Math.floor(this.score));
    }

    hitObstacle(player, obstacle) {
        if (!obstacle.active) return;

        // Collision logic depending on state
        if (obstacle.obstacleType === 'high' && this.isRolling) {
            return; // Successfully dodged by rolling
        }
        if (obstacle.obstacleType === 'low' && this.isAirborne) {
            return; // Successfully dodged by swinging
        }

        // Hit!
        this.physics.pause();
        this.player.setTint(0xff0000);

        // Save score to registry and go to Game Over
        this.registry.set('score', Math.floor(this.score));

        this.time.delayedCall(1000, () => {
            this.scene.stop('GameBackground');
            this.scene.start('GameOver');
        });
    }

    spawnEntity() {
        // Decide what to spawn
        const isCoin = Phaser.Math.Between(0, 100) > 70;
        const laneIndex = Phaser.Math.Between(0, 2);
        const xPos = this.lanes[laneIndex];

        if (isCoin) {
            let coin = this.coins.getFirstDead(false);
            if (!coin) {
                coin = this.physics.add.sprite(xPos, -100, 'coin');
                this.coins.add(coin);
            }
            coin.setPosition(xPos, -100);
            coin.setActive(true);
            coin.setVisible(true);
            coin.body.enable = true;
            coin.setDepth(5);
        } else {
            let obstacle = this.obstacles.getFirstDead(false);
            const isHigh = Phaser.Math.Between(0, 100) > 50; // High obstacle requires roll, low requires swing
            const texture = isHigh ? 'obstacle_high' : 'obstacle_low';

            if (!obstacle) {
                obstacle = this.physics.add.sprite(xPos, -100, texture);
                this.obstacles.add(obstacle);
            } else {
                obstacle.setTexture(texture);
            }
            obstacle.obstacleType = isHigh ? 'high' : 'low';
            obstacle.setPosition(xPos, -100);
            obstacle.setActive(true);
            obstacle.setVisible(true);
            obstacle.body.enable = true;
            obstacle.setDepth(5);
            // Adjust body size depending on type
            if (isHigh) {
                obstacle.body.setSize(64, 64);
                obstacle.body.setOffset(0, 0); // Simulate floating
            } else {
                obstacle.body.setSize(64, 64);
                obstacle.body.setOffset(0, 0); // Ground level
            }
        }
    }

    generateGraphics() {
        const graphics = this.make.graphics();
        const size = 64;
        const half = size / 2;

        // Player Graphic: Abstract geometric circle (red and blue halves)
        graphics.clear();
        graphics.fillStyle(0xff0000, 1);
        graphics.beginPath();
        graphics.arc(half, half, half, Math.PI / 2, Math.PI * 1.5, false);
        graphics.fillPath();

        graphics.fillStyle(0x0000ff, 1);
        graphics.beginPath();
        graphics.arc(half, half, half, Math.PI * 1.5, Math.PI / 2, false);
        graphics.fillPath();
        graphics.generateTexture('player', size, size);


        // Coin Graphic
        graphics.clear();
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(half, half, 20);
        graphics.generateTexture('coin', size, size);

        // Low Obstacle Graphic (Ground Block)
        graphics.clear();
        graphics.fillStyle(0x8B4513, 1); // Brown
        graphics.fillRect(0, size/2, size, size/2);
        graphics.generateTexture('obstacle_low', size, size);

        // High Obstacle Graphic (Floating Beam)
        graphics.clear();
        graphics.fillStyle(0x696969, 1); // Dim Gray
        graphics.fillRect(0, 0, size, size/2);
        graphics.generateTexture('obstacle_high', size, size);

        graphics.destroy();
    }
}
