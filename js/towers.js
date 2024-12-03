// Turret Types based on League of Legends Champions
const TURRET_TYPES = {
    LUX: {
        name: 'Lux Turret',
        cost: 300,
        damage: 150,
        range: 200,
        attackSpeed: 1,
        color: '#E8D661',
        special: 'Light Binding',
        description: 'Long range mage turret that deals magic damage',
        specialAbility: function(target) {
            // Root effect
            target.speed = 0;
            setTimeout(() => {
                if (target) target.speed = target.originalSpeed;
            }, 2000);
        }
    },
    ASHE: {
        name: 'Ashe Turret',
        cost: 250,
        damage: 100,
        range: 250,
        attackSpeed: 1.5,
        color: '#A1DBF1',
        special: 'Frost Shot',
        description: 'Slows enemies with each attack',
        specialAbility: function(target) {
            // Slow effect
            target.speed = target.originalSpeed * 0.7;
            setTimeout(() => {
                if (target) target.speed = target.originalSpeed;
            }, 1500);
        }
    },
    BRAND: {
        name: 'Brand Turret',
        cost: 400,
        damage: 200,
        range: 150,
        attackSpeed: 0.8,
        color: '#FF4C4C',
        special: 'Blaze',
        description: 'Area damage turret with burn effect',
        specialAbility: function(target) {
            // Burn effect
            const burnDamage = this.damage * 0.2;
            const burnInterval = setInterval(() => {
                if (target && target.health > 0) {
                    target.health -= burnDamage;
                } else {
                    clearInterval(burnInterval);
                }
            }, 500);
            setTimeout(() => clearInterval(burnInterval), 3000);
        }
    },
    THRESH: {
        name: 'Thresh Turret',
        cost: 350,
        damage: 80,
        range: 175,
        attackSpeed: 0.9,
        color: '#50C878',
        special: 'Death Sentence',
        description: 'Hooks and holds enemies in place',
        specialAbility: function(target) {
            // Hook effect
            target.speed = 0;
            target.isHooked = true;
            setTimeout(() => {
                if (target) {
                    target.speed = target.originalSpeed;
                    target.isHooked = false;
                }
            }, 2500);
        }
    }
};

class Turret {
    constructor(type, x, y) {
        const turretData = TURRET_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.name = turretData.name;
        this.damage = turretData.damage;
        this.range = turretData.range;
        this.attackSpeed = turretData.attackSpeed;
        this.color = turretData.color;
        this.special = turretData.special;
        this.description = turretData.description;
        this.specialAbility = turretData.specialAbility;
        this.lastAttack = 0;
        this.level = 1;
        this.target = null;
        this.cost = turretData.cost;
        this.selected = false;
        this.angle = 0;
        
        // Track investments for selling
        this.investments = {
            initial: turretData.cost,
            damage: 0,
            range: 0,
            speed: 0
        };
    }

    getTotalInvestment() {
        return this.investments.initial + 
               this.investments.damage + 
               this.investments.range + 
               this.investments.speed;
    }

    upgradeDamage() {
        this.damage *= 1.5;
        this.investments.damage += 100;
        this.level++;
    }

    upgradeRange() {
        this.range *= 1.2;
        this.investments.range += 75;
        this.level++;
    }

    upgradeSpeed() {
        this.attackSpeed *= 1.3;
        this.investments.speed += 125;
        this.level++;
    }

    canAttack() {
        return Date.now() - this.lastAttack > 1000 / this.attackSpeed;
    }

    findTarget(enemies) {
        if (this.target && this.target.health <= 0) {
            this.target = null;
        }

        if (!this.target) {
            for (let enemy of enemies) {
                const distance = Math.hypot(this.x - enemy.x, this.y - enemy.y);
                if (distance <= this.range && enemy.health > 0) {
                    this.target = enemy;
                    break;
                }
            }
        }
    }

    attack(enemies) {
        if (enemies.length === 0) {
            this.target = null;
            return null;
        }

        const now = Date.now();
        if (now - this.lastAttack < 1000 / this.attackSpeed) {
            // Update angle even when not attacking
            if (this.target && this.target.health > 0) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                this.angle = Math.atan2(dy, dx);
            }
            return null;
        }

        // Find target
        if (!this.target || this.target.health <= 0) {
            this.target = enemies.find(enemy => {
                const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                return distance <= this.range;
            });
        }

        if (this.target) {
            const distance = Math.hypot(this.target.x - this.x, this.target.y - this.y);
            if (distance <= this.range) {
                // Update angle
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                this.angle = Math.atan2(dy, dx);

                // Attack
                this.lastAttack = now;
                this.target.health -= this.damage;
                this.specialAbility(this.target);

                // Return projectile data
                return {
                    x: this.x,
                    y: this.y,
                    targetX: this.target.x,
                    targetY: this.target.y,
                    color: this.color,
                    reached: false
                };
            } else {
                this.target = null;
            }
        }

        return null;
    }

    draw(ctx) {
        // Draw base
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#666';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw turret top
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();

        // Draw gun barrel
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20);
        ctx.lineWidth = 4;
        ctx.strokeStyle = this.color;
        ctx.stroke();

        // Draw range circle when selected
        if (this.selected) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}
