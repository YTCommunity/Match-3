import { Scene } from 'phaser';

export class ActionPhase extends Scene {
    constructor() {
        super({
            key: 'ActionPhase',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 600 },
                    debug: false
                }
            }
        });
    }

    init(data) {
        // Tie player's initial swing velocity to Momentum Tokens earned during Match-3 phase
        this.momentumTokens = data.momentumTokens || 5;
    }

    create() {
        // Create halal vector graphics for the player and anchors
        this.generateGraphics();

        // Add player entity
        this.player = this.physics.add.sprite(200, 300, 'player_shape');
        this.player.setCollideWorldBounds(true);
        this.player.setVelocityX(this.momentumTokens * 50); // initial velocity based on momentum tokens

        // Add random environmental anchor points
        this.anchors = this.physics.add.staticGroup();
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(100, 800);
            const y = Phaser.Math.Between(100, 400);
            this.anchors.create(x, y, 'anchor_shape');
        }

        // Setup rope graphics renderer
        this.ropeGraphics = this.add.graphics();

        // State variables for grappling
        this.isGrappling = false;
        this.activeAnchor = null;
        this.ropeRadius = 0;
        this.swingAngle = 0;

        // Input listener for tapping
        this.input.on('pointerdown', this.handleGrappleStart, this);
        this.input.on('pointerup', this.handleGrappleEnd, this);
    }

    generateGraphics() {
        const graphics = this.make.graphics();

        // Player graphic (Circle)
        graphics.clear();
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('player_shape', 32, 32);

        // Anchor graphic (Square)
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('anchor_shape', 16, 16);

        graphics.destroy();
    }

    handleGrappleStart(pointer) {
        // Find the closest anchor
        let closestAnchor = null;
        let minDistance = Infinity;

        this.anchors.getChildren().forEach(anchor => {
            const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, anchor.x, anchor.y);
            // Allow selecting if tap is near anchor, or just find overall closest
            if (dist < minDistance) {
                minDistance = dist;
                closestAnchor = anchor;
            }
        });

        // Only grapple if tapping reasonably close to an anchor (e.g. within 100px)
        if (closestAnchor && minDistance < 100) {
            this.isGrappling = true;
            this.activeAnchor = closestAnchor;

            // Calculate Euclidean distance to lock the rope radius
            this.ropeRadius = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.activeAnchor.x, this.activeAnchor.y);

            // Disable standard gravity on the player
            this.player.body.allowGravity = false;
        }
    }

    handleGrappleEnd(pointer) {
        if (this.isGrappling) {
            this.isGrappling = false;
            this.activeAnchor = null;

            // Re-enable standard gravity
            this.player.body.allowGravity = true;
        }
    }

    update(time, delta) {
        // Clear rope graphics every frame
        this.ropeGraphics.clear();

        if (this.isGrappling && this.activeAnchor) {
            // Find dynamic angle between player and anchor
            this.swingAngle = Math.atan2(this.player.y - this.activeAnchor.y, this.player.x - this.activeAnchor.x);

            // Calculate vector from anchor to player
            const dx = this.player.x - this.activeAnchor.x;
            const dy = this.player.y - this.activeAnchor.y;

            // Calculate tangent to the swing arc (perpendicular to the rope vector)
            // Normalized tangent vector
            const length = Math.sqrt(dx * dx + dy * dy);
            const tangentX = dy / length; // Cosine of (angle - PI/2)
            const tangentY = -dx / length; // Sine of (angle - PI/2)

            // Current velocity
            const vx = this.player.body.velocity.x;
            const vy = this.player.body.velocity.y;

            // Add pseudo gravity for pendulum motion manually since arcade gravity is off
            const dt = delta / 1000;
            const pseudoGravity = 600 * dt;
            const vy_new = vy + pseudoGravity;

            // Dot product to project velocity onto the tangent vector
            const dot = vx * tangentX + vy_new * tangentY;

            // The new velocity vector along the tangent
            const projVx = tangentX * dot;
            const projVy = tangentY * dot;

            // Apply dampening or friction if necessary, here just using the projection
            this.player.setVelocity(projVx, projVy);

            // To enforce the rigid rope (kinematic constraint), manually set the position
            // using Sine and Cosine based on the swing angle. The physics engine will move
            // the player tangentially next frame, and we will snap them back to the radius here.

            // Calculate new X and Y positions per frame using Cosine and Sine
            const newX = this.activeAnchor.x + Math.cos(this.swingAngle) * this.ropeRadius;
            const newY = this.activeAnchor.y + Math.sin(this.swingAngle) * this.ropeRadius;

            // Update player position
            this.player.x = newX;
            this.player.y = newY;

            // Draw the active rope dynamically using highly efficient Line Renderer (Graphics)
            this.ropeGraphics.lineStyle(2, 0xffffff, 1);
            this.ropeGraphics.beginPath();
            this.ropeGraphics.moveTo(this.activeAnchor.x, this.activeAnchor.y);
            this.ropeGraphics.lineTo(this.player.x, this.player.y);
            this.ropeGraphics.strokePath();
        }
    }
}
