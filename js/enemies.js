class Enemy {
    constructor(path, type = 'MINION') {
        this.path = [...path];
        this.x = path[0].x;
        this.y = path[0].y;
        this.currentPathIndex = 0;
        
        // Enemy types based on LoL minions and monsters
        const types = {
            MINION: {
                health: 100,
                speed: 1,
                value: 10,
                size: 15,
                color: '#8B8B8B' // Gray mouse
            },
            CANNON_MINION: {
                health: 200,
                speed: 0.8,
                value: 20,
                size: 20,
                color: '#A0522D' // Brown mouse
            },
            SUPER_MINION: {
                health: 400,
                speed: 0.6,
                value: 30,
                size: 25,
                color: '#696969' // Dark gray mouse
            },
            BARON: {
                health: 1000,
                speed: 0.3,
                value: 100,
                size: 35,
                color: '#2F4F4F' // Dark slate gray mouse (boss)
            }
        };

        const enemyType = types[type];
        this.maxHealth = enemyType.health;
        this.health = enemyType.health;
        this.speed = enemyType.speed;
        this.originalSpeed = enemyType.speed;
        this.value = enemyType.value;
        this.size = enemyType.size;
        this.color = enemyType.color;
        this.type = type;
        this.effects = [];
    }

    update() {
        if (this.currentPathIndex >= this.path.length - 1) return true;

        const targetPoint = this.path[this.currentPathIndex + 1];
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.path.length - 1) return true;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        return false;
    }

    draw(ctx) {
        // Save current context state
        ctx.save();
        
        // Rotate the mouse based on movement direction
        const angle = Math.atan2(
            this.y - this.path[this.currentPathIndex].y,
            this.x - this.path[this.currentPathIndex].x
        );
        ctx.translate(this.x, this.y);
        ctx.rotate(angle + Math.PI);
        
        // Draw mouse body
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw ears
        // Left ear
        ctx.beginPath();
        ctx.arc(-this.size/2, -this.size/2, this.size/3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right ear
        ctx.beginPath();
        ctx.arc(this.size/2, -this.size/2, this.size/3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw nose
        ctx.beginPath();
        ctx.arc(this.size * 0.8, 0, this.size/4, 0, Math.PI * 2);
        ctx.fillStyle = '#FF9999';
        ctx.fill();
        ctx.stroke();

        // Draw eyes
        ctx.beginPath();
        ctx.arc(this.size/3, -this.size/4, this.size/6, 0, Math.PI * 2);
        ctx.arc(-this.size/3, -this.size/4, this.size/6, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        // Draw tail
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.quadraticCurveTo(
            -this.size * 1.5,
            -this.size/2,
            -this.size * 2,
            0
        );
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Restore context state
        ctx.restore();

        // Draw health bar
        const healthBarWidth = this.size * 2;
        const healthBarHeight = 4;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.size - 10, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.size - 10, healthBarWidth * healthPercentage, healthBarHeight);
    }
}
