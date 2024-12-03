class Enemy {
    constructor(type, path, wave) {
        const enemyData = ENEMY_TYPES[type];
        this.type = type;
        this.x = path[0].x;
        this.y = path[0].y;
        this.path = [...path];
        this.pathIndex = 0;
        this.speed = enemyData.speed * (1 + wave * 0.1); // Enemies get faster each wave
        this.health = enemyData.health * (1 + wave * 0.2); // Enemies get more health each wave
        this.maxHealth = this.health;
        this.reward = Math.floor(enemyData.reward * (1 + wave * 0.1)); // Rewards increase with waves
        this.damage = enemyData.damage;
        this.color = enemyData.color;
        this.size = enemyData.size || 15;
        this.isBoss = enemyData.isBoss || false;
        this.isNinja = enemyData.isNinja || false;
        this.isGhost = enemyData.isGhost || false;
        this.effects = [];
    }

    update() {
        if (this.pathIndex >= this.path.length - 1) return true;

        const targetPoint = this.path[this.pathIndex + 1];
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            this.pathIndex++;
            if (this.pathIndex >= this.path.length - 1) return true;
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
            this.y - this.path[this.pathIndex].y,
            this.x - this.path[this.pathIndex].x
        );
        ctx.translate(this.x, this.y);
        ctx.rotate(angle + Math.PI);

        // Draw ghost mouse with special effects
        if (this.type === 'ghost') {
            // Ghost floating effect
            const floatOffset = Math.sin(Date.now() / 200) * 5;
            ctx.translate(0, floatOffset);
            
            // Ghost trail effect
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(-i * 8, 0, this.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw ninja mouse effects
        if (this.type === 'ninja') {
            ctx.fillStyle = 'red';
            ctx.fillRect(-this.size/2, -this.size/2 - 3, this.size, 3);
            
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(-10, 0, this.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw mouse body
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
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

        // Draw eyes (red for ghost mice)
        ctx.fillStyle = this.type === 'ghost' ? 'red' : 'black';
        ctx.beginPath();
        ctx.arc(this.size/3, -this.size/4, this.size/6, 0, Math.PI * 2);
        ctx.arc(-this.size/3, -this.size/4, this.size/6, 0, Math.PI * 2);
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

const ENEMY_TYPES = {
    regular: {
        health: 100,
        speed: 1,
        reward: 15,
        damage: 1,
        color: 'gray',
        size: 15
    },
    fast: {
        health: 75,
        speed: 2,
        reward: 25,
        damage: 1,
        color: 'lightblue',
        size: 12
    },
    tank: {
        health: 300,
        speed: 0.7,
        reward: 35,
        damage: 2,
        color: 'darkgreen',
        size: 20
    },
    ninja: {
        health: 150,
        speed: 1.5,
        reward: 40,
        damage: 2,
        color: 'black',
        size: 13,
        isNinja: true
    },
    ghost: {  
        health: 200,
        speed: 1.3,
        reward: 45,
        damage: 3,
        color: 'rgba(255, 255, 255, 0.7)',
        size: 16,
        isGhost: true
    },
    boss: {
        health: 1000,
        speed: 0.5,
        reward: 200,
        damage: 5,
        color: 'purple',
        size: 30,
        isBoss: true
    }
};
