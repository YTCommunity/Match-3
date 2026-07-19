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

        // Sky and Sun (Static)
        this.add.rectangle(this.view.centerX, this.view.centerY, this.view.width, this.view.height, 0x87CEEB); // Sky Blue
        this.add.circle(this.view.width * 0.8, this.view.height * 0.2, 80, 0xFFD700); // Bright Sun

        // Dynamic Parallax Buildings Group
        this.buildings = this.add.group();
        for (let i = 0; i < 6; i++) {
            this.spawnBuilding(true); // Initial spawn spread out
        }

        // Initialize player entity
        this.player = this.physics.add.sprite(this.view.centerX, this.view.height - 200, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Lane setup and dashed lines
        this.laneWidth = this.view.width / 3;
        this.lanes = [
            this.laneWidth / 2,
            this.laneWidth + this.laneWidth / 2,
            this.laneWidth * 2 + this.laneWidth / 2
        ];

        // Speed lines group
        this.speedLines = this.add.group();
        for(let i=0; i<10; i++) {
            let line = this.add.rectangle(Phaser.Math.Between(0, this.view.width), Phaser.Math.Between(0, this.view.height), 2, Phaser.Math.Between(50, 150), 0xffffff, 0.3);
            this.speedLines.add(line);
        }

        this.laneGraphics = this.add.graphics();
        this.laneOffset = 0;

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

        // Particle manager
        this.particles = this.add.particles(0, 0, 'particle', {
            speed: { min: 100, max: 250 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            emitting: false
        });
        this.particles.setDepth(15);

        this.trailParticles = this.add.particles(0, 0, 'particle', {
            speed: { min: -50, max: 50 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            follow: this.player,
            followOffset: { y: this.player.height / 2 }
        });
        this.trailParticles.setDepth(9);

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

        if (this.physics.world.isPaused) return; // Stop world on death
        const bgSpeed = (this.baseSpeed * delta) / 1000;

        // Buildings
        this.buildings.getChildren().forEach(b => {
            b.y += bgSpeed * b.depthScale; // depthScale gives parallax
            if (b.y > this.view.height + b.height) {
                b.y = -b.height;
                b.x = b.isLeft ? Phaser.Math.Between(-50, this.view.width * 0.2) : Phaser.Math.Between(this.view.width * 0.8, this.view.width + 50);
                b.fillColor = Phaser.Utils.Array.GetRandom([0x555555, 0x666666, 0x444444, 0x777777, 0x333333]);
            }
        });

        // Speed lines
        this.speedLines.getChildren().forEach(line => {
            line.y += bgSpeed * 1.5;
            if (line.y > this.view.height + line.height) {
                line.y = -line.height;
                line.x = Phaser.Math.Between(0, this.view.width);
            }
        });

        // Moving Dashed Lanes
        this.laneOffset += bgSpeed;
        if (this.laneOffset > 60) this.laneOffset -= 60; // Dash length + gap

        this.laneGraphics.clear();
        this.laneGraphics.lineStyle(4, 0xffffff, 0.4);
        for(let l = 1; l < 3; l++) {
            const lx = this.laneWidth * l;
            for(let y = -60 + this.laneOffset; y < this.view.height; y += 60) {
                this.laneGraphics.beginPath();
                this.laneGraphics.moveTo(lx, y);
                this.laneGraphics.lineTo(lx, y + 30);
                this.laneGraphics.strokePath();
            }
        }

        this.spawnTimer += delta;
        if (this.spawnTimer > 1000) {
            this.spawnEntity();
            this.spawnTimer = 0;
            this.baseSpeed += 5; // Gradually increase speed
        }

        // Move and cleanup obstacles
        this.obstacles.getChildren().forEach(obstacle => {
            obstacle.y += bgSpeed;
            if (obstacle.y > this.view.height + 100) {
                obstacle.setActive(false);
                obstacle.setVisible(false);
                obstacle.body.enable = false;
            }
        });

        // Move and cleanup coins
        this.coins.getChildren().forEach(coin => {
            coin.y += bgSpeed;
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

        // Particle burst
        this.particles.emitParticleAt(coin.x, coin.y, 10);

        // Floating +50 text
        let floatText = this.add.text(coin.x, coin.y, '+50', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffd700',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: floatText,
            y: floatText.y - 100,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => floatText.destroy()
        });
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
        this.trailParticles.stop(); // stop trail

        // Camera shake
        this.cameras.main.shake(200, 0.02);

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

            // Pulsing animation
            this.tweens.killTweensOf(coin);
            this.tweens.add({
                targets: coin,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 400,
                yoyo: true,
                repeat: -1
            });

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

    spawnBuilding(isInitial = false) {
        const isLeft = Phaser.Math.Between(0, 1) === 0;
        const width = Phaser.Math.Between(this.view.width * 0.1, this.view.width * 0.25);
        const height = Phaser.Math.Between(this.view.height * 0.3, this.view.height * 0.7);
        const x = isLeft ? Phaser.Math.Between(-50, this.view.width * 0.2) : Phaser.Math.Between(this.view.width * 0.8, this.view.width + 50);
        const y = isInitial ? Phaser.Math.Between(0, this.view.height) : -height;
        const color = Phaser.Utils.Array.GetRandom([0x555555, 0x666666, 0x444444, 0x777777, 0x333333]);

        let building = this.add.rectangle(x, y, width, height, color);
        building.isLeft = isLeft;
        building.depthScale = Phaser.Math.FloatBetween(0.3, 0.8); // Slower than ground
        building.setDepth(building.depthScale); // visual depth
        this.buildings.add(building);
    }

    generateGraphics() {
        const graphics = this.make.graphics();
        const size = 64;
        const half = size / 2;

        // --- Player Graphic: Faceted Octagon with web lines (Red & Blue) ---
        graphics.clear();
        const points = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            points.push({ x: half + half * Math.cos(angle), y: half + half * Math.sin(angle) });
        }

        // Red half (Left)
        graphics.fillStyle(0xff0000, 1);
        graphics.beginPath();
        graphics.moveTo(points[2].x, points[2].y);
        graphics.lineTo(points[3].x, points[3].y);
        graphics.lineTo(points[4].x, points[4].y);
        graphics.lineTo(points[5].x, points[5].y);
        graphics.lineTo(points[6].x, points[6].y);
        graphics.fillPath();

        // Blue half (Right)
        graphics.fillStyle(0x0000ff, 1);
        graphics.beginPath();
        graphics.moveTo(points[6].x, points[6].y);
        graphics.lineTo(points[7].x, points[7].y);
        graphics.lineTo(points[0].x, points[0].y);
        graphics.lineTo(points[1].x, points[1].y);
        graphics.lineTo(points[2].x, points[2].y);
        graphics.fillPath();

        // White Abstract Web Lines
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y); graphics.lineTo(points[4].x, points[4].y);
        graphics.moveTo(points[1].x, points[1].y); graphics.lineTo(points[5].x, points[5].y);
        graphics.moveTo(points[2].x, points[2].y); graphics.lineTo(points[6].x, points[6].y);
        graphics.moveTo(points[3].x, points[3].y); graphics.lineTo(points[7].x, points[7].y);
        graphics.strokePath();

        // Black border
        graphics.lineStyle(3, 0x000000, 1);
        graphics.strokePoints(points, true, true);
        graphics.generateTexture('player', size, size);


        // --- Coin Graphic: Golden with glow and inner star ---
        graphics.clear();
        // Outer Glow
        graphics.fillStyle(0xffa500, 0.5);
        graphics.fillCircle(half, half, 24);
        // Main Coin
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(half, half, 20);
        // Inner highlight
        graphics.fillStyle(0xfffacd, 1);
        graphics.fillCircle(half, half, 12);
        graphics.generateTexture('coin', size, size);


        // --- Low Obstacle: Ground Block with Caution Stripes ---
        graphics.clear();
        graphics.fillStyle(0x333333, 1); // Dark Gray Base
        graphics.fillRect(0, size/2, size, size/2);
        graphics.fillStyle(0xffff00, 1); // Yellow Stripes
        graphics.beginPath();
        graphics.moveTo(0, size/2); graphics.lineTo(16, size/2); graphics.lineTo(0, size/2 + 16); graphics.fillPath();
        graphics.beginPath();
        graphics.moveTo(32, size/2); graphics.lineTo(64, size/2); graphics.lineTo(64, size/2 + 32); graphics.lineTo(0, size); graphics.lineTo(0, size/2 + 32); graphics.fillPath();
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(0, size/2, size, size/2);
        graphics.generateTexture('obstacle_low', size, size);


        // --- High Obstacle: Floating Beam with Neon Border ---
        graphics.clear();
        graphics.fillStyle(0x222222, 1); // Very Dark Base
        graphics.fillRect(0, 0, size, size/2);
        graphics.lineStyle(4, 0x00ffff, 1); // Cyan Neon Border
        graphics.strokeRect(2, 2, size - 4, size/2 - 4);
        // Inner tech lines
        graphics.lineStyle(1, 0x00ffff, 0.5);
        graphics.beginPath();
        graphics.moveTo(10, size/4); graphics.lineTo(size - 10, size/4);
        graphics.strokePath();
        graphics.generateTexture('obstacle_high', size, size);

        // --- Particle Graphic (Star) ---
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('particle', 16, 16);

        graphics.destroy();
    }
}
