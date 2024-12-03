// Tower Types based on League of Legends Champions
const TOWER_TYPES = {
    LUX: {
        name: 'Lux Tower',
        cost: 300,
        damage: 150,
        range: 200,
        attackSpeed: 1,
        color: '#E8D661',
        special: 'Light Binding',
        description: 'Long range mage tower that deals magic damage',
        specialAbility: function(target) {
            // Root effect
            target.speed = 0;
            setTimeout(() => {
                if (target) target.speed = target.originalSpeed;
            }, 2000);
        }
    },
    ASHE: {
        name: 'Ashe Tower',
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
        name: 'Brand Tower',
        cost: 400,
        damage: 200,
        range: 150,
        attackSpeed: 0.8,
        color: '#FF4C4C',
        special: 'Blaze',
        description: 'Area damage tower with burn effect',
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
        name: 'Thresh Tower',
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

class Tower {
    constructor(type, x, y) {
        const towerData = TOWER_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.name = towerData.name;
        this.damage = towerData.damage;
        this.range = towerData.range;
        this.attackSpeed = towerData.attackSpeed;
        this.color = towerData.color;
        this.special = towerData.special;
        this.description = towerData.description;
        this.specialAbility = towerData.specialAbility;
        this.lastAttack = 0;
        this.level = 1;
        this.target = null;
        this.cost = towerData.cost;
        this.selected = false;
        
        // Track investments for selling
        this.investments = {
            initial: towerData.cost,
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
        this.findTarget(enemies);
        
        if (this.target && this.canAttack()) {
            const distance = Math.hypot(this.x - this.target.x, this.y - this.target.y);
            
            if (distance <= this.range) {
                this.target.health -= this.damage;
                this.specialAbility(this.target);
                this.lastAttack = Date.now();
                
                // Create visual effect for attack
                return {
                    from: { x: this.x, y: this.y },
                    to: { x: this.target.x, y: this.target.y },
                    color: this.color
                };
            } else {
                this.target = null;
            }
        }
        return null;
    }

    draw(ctx) {
        // Draw cat tower
        // Body
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ears
        // Left ear
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - 15);
        ctx.lineTo(this.x - 20, this.y - 25);
        ctx.lineTo(this.x - 10, this.y - 15);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();

        // Right ear
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y - 15);
        ctx.lineTo(this.x + 20, this.y - 25);
        ctx.lineTo(this.x + 10, this.y - 15);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();

        // Whiskers
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y);
        ctx.lineTo(this.x - 30, this.y - 5);
        ctx.moveTo(this.x - 20, this.y);
        ctx.lineTo(this.x - 30, this.y + 5);
        ctx.moveTo(this.x + 20, this.y);
        ctx.lineTo(this.x + 30, this.y - 5);
        ctx.moveTo(this.x + 20, this.y);
        ctx.lineTo(this.x + 30, this.y + 5);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Eyes
        ctx.beginPath();
        ctx.arc(this.x - 7, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 7, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        // Draw level indicator
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.level, this.x, this.y + 15);

        // Draw range circle when selected
        if (this.selected) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();
        }
    }
}
