// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
const gameState = {
    score: 0,
    money: 1500,
    lives: 20,
    enemies: [],
    turrets: [],
    projectiles: [],
    selectedTurret: null,
    selectedTurretType: null,
    currentWave: 0,
    gameLoop: null,
    mouseX: 0,
    mouseY: 0,
    path: [
        { x: 0, y: 300 },
        { x: 200, y: 300 },
        { x: 200, y: 100 },
        { x: 600, y: 100 },
        { x: 600, y: 500 },
        { x: 800, y: 500 }
    ],
    waveEnemies: [],
    waveInProgress: false,
    lastSpawnTime: 0,
    gameOver: false,
    enemiesSpawned: 0,
    particles: []
};

// Track mouse position
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mouseX = e.clientX - rect.left;
    gameState.mouseY = e.clientY - rect.top;

    // Update placement preview if placing turret
    if (gameState.selectedTurretType) {
        const preview = document.getElementById('placement-preview');
        if (preview.classList.contains('hidden')) {
            preview.classList.remove('hidden');
            // Create preview if it doesn't exist
            if (!preview.querySelector('.tower-icon')) {
                const selectedTurret = document.querySelector(`.tower-option[data-tower="${gameState.selectedTurretType}"]`);
                preview.innerHTML = selectedTurret.querySelector('.tower-icon').outerHTML;
            }
        }
        
        // Position preview at mouse cursor
        preview.style.left = (e.clientX - 20) + 'px';
        preview.style.top = (e.clientY - 20) + 'px';

        // Check if placement is valid
        const isValidPlacement = checkValidPlacement(gameState.mouseX, gameState.mouseY);
        preview.className = isValidPlacement ? 'placement-valid' : 'placement-invalid';
    }
});

// Right click to cancel turret placement
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameState.selectedTurretType) {
        gameState.selectedTurretType = null;
        canvas.classList.remove('placing-turret');
        document.querySelectorAll('.tower-option').forEach(opt => 
            opt.classList.remove('selected'));
        document.getElementById('placement-preview').classList.add('hidden');
    }
});

// Add turret selection event listeners
document.querySelectorAll('.tower-option').forEach(option => {
    option.addEventListener('click', () => {
        const turretType = option.getAttribute('data-tower');
        gameState.selectedTurretType = turretType;
        
        // Update visual feedback
        document.querySelectorAll('.tower-option').forEach(opt => 
            opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Change cursor style
        canvas.classList.add('placing-turret');

        // Show placement preview
        const preview = document.getElementById('placement-preview');
        preview.innerHTML = option.querySelector('.tower-icon').outerHTML;
        preview.classList.remove('hidden');
    });
});

// Turret placement
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing turret
    const clickedTurret = gameState.turrets.find(turret => {
        const distance = Math.hypot(turret.x - x, turret.y - y);
        return distance < 20;
    });

    if (clickedTurret) {
        if (gameState.selectedTurret === clickedTurret) {
            if (clickedTurret.level >= 6) {
                showMessage("MAXIMUM POWER REACHED!", canvas.width/2, canvas.height/2);
                return;
            }
            // Moderate upgrade cost (75g)
            if (gameState.money >= 75) {
                clickedTurret.damage *= 2.5;  // Same strong upgrades
                clickedTurret.range *= 1.3;   
                clickedTurret.fireRate *= 0.8;
                gameState.money -= 75;  // 75 gold now
                clickedTurret.level++;
                
                showUpgradeEffect(clickedTurret.x, clickedTurret.y);
                showMessage(`Damage: ${Math.round(clickedTurret.damage)}!`, canvas.width/2, canvas.height/2);
            } else {
                showMessage("Need 75 gold!", canvas.width/2, canvas.height/2);
            }
        } else {
            gameState.selectedTurret = clickedTurret;
            showMessage(`Level ${clickedTurret.level} - Click to upgrade (75g)`, canvas.width/2, canvas.height - 50);
        }
    } else if (gameState.selectedTurretType && checkValidPlacement(x, y)) {
        const turretCost = getTurretCost(gameState.selectedTurretType);
        
        if (gameState.money >= turretCost) {
            const newTurret = createTurret(gameState.selectedTurretType, x, y);
            gameState.turrets.push(newTurret);
            gameState.money -= turretCost;
            
            // Reset placement preview but keep placement mode active
            document.getElementById('placement-preview').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('placement-preview').classList.remove('hidden');
            }, 50);
        } else {
            showMessage('Not enough money!', canvas.width/2, canvas.height/2);
            
            // Reset turret placement mode
            gameState.selectedTurretType = null;
            canvas.classList.remove('placing-turret');
            document.getElementById('placement-preview').classList.add('hidden');
            document.querySelectorAll('.tower-option').forEach(opt => 
                opt.classList.remove('selected'));
        }
    } else {
        // Clicked empty space, deselect turret
        gameState.selectedTurret = null;
    }
});

// Show upgrade effect
function showUpgradeEffect(x, y) {
    const texts = ['POWER UP!', 'SUPER!', 'STRONGER!'];
    const colors = ['#ff0', '#f80', '#f00'];
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const text = texts[i];
            const color = colors[i];
            
            // Create floating text
            ctx.save();
            ctx.font = 'bold 22px Arial';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText(text, x, y - 35 - i * 20);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(text, x, y - 35 - i * 20);
            ctx.restore();
            
            // Create more particles
            for (let j = 0; j < 10; j++) {
                const angle = (j / 10) * Math.PI * 2;
                const speed = 2.5;
                const particle = {
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 25
                };
                gameState.particles = gameState.particles || [];
                gameState.particles.push(particle);
            }
        }, i * 200);
    }
}

// Update particles in game loop
function updateParticles() {
    if (!gameState.particles) return;
    
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 0, ${particle.life / 30})`;
        ctx.fill();
        
        // Remove dead particles
        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

// Helper functions for turret placement
function getTurretCost(type) {
    switch(type) {
        case 'SNIPER':
            return 250;  // Was 200
        case 'CANNON':
            return 300;  // Was 250
        case 'FROST':
            return 250;  // Was 200
        default:
            return 200;  // Was 150
    }
}

function createTurret(type, x, y) {
    return {
        type: type,
        x: x,
        y: y,
        level: 1,
        damage: type === 'SNIPER' ? 25 :  // Higher base damage
               type === 'CANNON' ? 18 :   
               type === 'FROST' ? 10 :    
               15,                        
        range: type === 'SNIPER' ? 250 : 180,  
        fireRate: type === 'BASIC' ? 400 : 1000,
        lastShot: 0,
        target: null
    };
}

function checkValidPlacement(x, y) {
    // Check if too close to path
    for (let i = 0; i < gameState.path.length - 1; i++) {
        const start = gameState.path[i];
        const end = gameState.path[i + 1];
        const distance = distanceToLine(x, y, start.x, start.y, end.x, end.y);
        if (distance < 40) return false;
    }

    // Check if too close to other turrets
    for (const turret of gameState.turrets) {
        const distance = Math.hypot(turret.x - x, turret.y - y);
        if (distance < 40) return false;
    }

    return true;
}

function distanceToLine(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq != 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Generate an infinite wave
function generateWave(waveNumber) {
    // Base stats that increase with wave number
    const baseCount = Math.min(5 + waveNumber * 2, 100);  // Reduced max enemies to 100
    const baseInterval = Math.max(2000 - waveNumber * 50, 500);  // Slower spawning, min 500ms
    
    // Special wave types
    const isSpecialWave = waveNumber % 5 === 0;  // Every 5th wave is special
    
    if (isSpecialWave) {
        // Special wave types
        switch(waveNumber % 15) {
            case 0:  // Boss Rush (every 15th wave)
                return {
                    count: 3 + Math.floor(waveNumber / 15),
                    type: 'boss_rush',
                    types: ['boss'],
                    interval: 5000,
                    bosses: [{ type: 'boss', at: 0 }]
                };
            case 5:  // Speed Rush (every 5th wave not divisible by 15)
                return {
                    count: Math.min(20 + waveNumber, 50),
                    type: 'speed_rush',
                    types: ['fast', 'ninja'],
                    interval: 300,
                };
            case 10:  // Tank Parade (every 10th wave not divisible by 15)
                return {
                    count: Math.min(5 + Math.floor(waveNumber/10), 15),
                    type: 'tank_parade',
                    types: ['tank'],
                    interval: 3000,
                    bosses: [{ type: 'tank', at: Math.floor(baseCount * 0.5) }]
                };
        }
    }
    
    // Regular waves with progressive difficulty
    let types = ['regular'];
    if (waveNumber >= 2) types.push('fast');
    if (waveNumber >= 3) types.push('tank');
    if (waveNumber >= 4) types.push('ninja');
    if (waveNumber >= 6) types.push('ghost');

    // Calculate number of mini-bosses based on wave
    const numBosses = Math.min(Math.floor(waveNumber / 8), 3);  // Max 3 bosses in regular waves
    let bosses = [];
    if (numBosses > 0) {
        const bossTypes = ['tank', 'ninja', 'ghost'];
        for (let i = 0; i < numBosses; i++) {
            const bossType = bossTypes[Math.min(Math.floor(waveNumber / 10), bossTypes.length - 1)];
            const position = Math.floor(baseCount * (0.6 + i * 0.15));  // Space out bosses
            bosses.push({ type: bossType, at: position });
        }
    }

    return {
        count: baseCount,
        type: 'mixed',
        types: types,
        interval: baseInterval,
        bosses: bosses.length > 0 ? bosses : undefined
    };
}

// Wave management
function startWave() {
    // Generate the next wave instead of using predefined waves
    const wave = generateWave(gameState.currentWave + 1);
    gameState.enemiesSpawned = 0;
    gameState.waveInProgress = true;
    gameState.currentWave++;  // Increment the wave number!

    // Show wave start message
    showMessage(`Wave ${gameState.currentWave} Starting!`, canvas.width/2, canvas.height/2);

    const spawnEnemy = () => {
        if (gameState.enemiesSpawned >= wave.count || !gameState.waveInProgress) {
            return;
        }

        // Check if we should spawn a boss
        if (wave.bosses && wave.bosses.some(boss => boss.at === gameState.enemiesSpawned)) {
            const boss = wave.bosses.find(boss => boss.at === gameState.enemiesSpawned);
            gameState.enemies.push(new Enemy(boss.type, [...gameState.path], gameState.currentWave));
            showMessage(`${boss.type.toUpperCase()} INCOMING!`, canvas.width/2, canvas.height/2);
        } else {
            // Regular enemy spawn
            let enemyType;
            if (wave.type === 'mixed') {
                enemyType = wave.types[Math.floor(Math.random() * wave.types.length)];
            } else {
                enemyType = wave.type;
            }
            const enemy = new Enemy(enemyType, [...gameState.path], gameState.currentWave);
            
            // Make enemies stronger each wave
            enemy.health *= (1 + gameState.currentWave * 0.1);  // 10% more health each wave
            enemy.speed *= (1 + gameState.currentWave * 0.05);  // 5% faster each wave
            enemy.reward = Math.floor(enemy.reward * (1 + gameState.currentWave * 0.1));  // 10% more reward each wave
            
            gameState.enemies.push(enemy);
        }

        gameState.enemiesSpawned++;

        // Schedule next enemy spawn
        if (gameState.enemiesSpawned < wave.count) {
            setTimeout(spawnEnemy, wave.interval);
        }
    };

    // Start spawning enemies
    spawnEnemy();
}

// Add new wave button
const addWaveBtn = document.createElement('button');
addWaveBtn.textContent = 'Add Wave';
addWaveBtn.style.position = 'absolute';
addWaveBtn.style.top = '10px';
addWaveBtn.style.right = '10px';
addWaveBtn.style.padding = '10px';
addWaveBtn.style.backgroundColor = '#C8AA6E';
addWaveBtn.style.border = 'none';
addWaveBtn.style.borderRadius = '5px';
addWaveBtn.style.cursor = 'pointer';
document.body.appendChild(addWaveBtn);

// Add wave button click handler
addWaveBtn.addEventListener('click', () => {
    const waveNumber = gameState.currentWave + 1;
    
    // Add a new wave based on wave number
    if (waveNumber <= 4) {
        // Waves 3-4: Mix of regular, fast, and tank
        const wave = generateWave(waveNumber);
        gameState.enemiesSpawned = 0;
        gameState.waveInProgress = true;

        // Show wave start message
        showMessage(`Wave ${waveNumber} Starting!`, canvas.width/2, canvas.height/2);

        const spawnEnemy = () => {
            if (gameState.enemiesSpawned >= wave.count || !gameState.waveInProgress) {
                return;
            }

            // Check if we should spawn a boss
            if (wave.bosses && wave.bosses.some(boss => boss.at === gameState.enemiesSpawned)) {
                const boss = wave.bosses.find(boss => boss.at === gameState.enemiesSpawned);
                gameState.enemies.push(new Enemy(boss.type, [...gameState.path], gameState.currentWave));
                showMessage(`${boss.type.toUpperCase()} INCOMING!`, canvas.width/2, canvas.height/2);
            } else {
                // Regular enemy spawn
                let enemyType;
                if (wave.type === 'mixed') {
                    enemyType = wave.types[Math.floor(Math.random() * wave.types.length)];
                } else {
                    enemyType = wave.type;
                }
                const enemy = new Enemy(enemyType, [...gameState.path], gameState.currentWave);
                
                // Make enemies stronger each wave
                enemy.health *= (1 + gameState.currentWave * 0.1);  // 10% more health each wave
                enemy.speed *= (1 + gameState.currentWave * 0.05);  // 5% faster each wave
                enemy.reward = Math.floor(enemy.reward * (1 + gameState.currentWave * 0.1));  // 10% more reward each wave
                
                gameState.enemies.push(enemy);
            }

            gameState.enemiesSpawned++;

            // Schedule next enemy spawn
            if (gameState.enemiesSpawned < wave.count) {
                setTimeout(spawnEnemy, wave.interval);
            }
        };

        // Start spawning enemies
        spawnEnemy();
    } else if (waveNumber <= 7) {
        // Waves 5-7: Add ninja mice
        const wave = generateWave(waveNumber);
        gameState.enemiesSpawned = 0;
        gameState.waveInProgress = true;

        // Show wave start message
        showMessage(`Wave ${waveNumber} Starting!`, canvas.width/2, canvas.height/2);

        const spawnEnemy = () => {
            if (gameState.enemiesSpawned >= wave.count || !gameState.waveInProgress) {
                return;
            }

            // Check if we should spawn a boss
            if (wave.bosses && wave.bosses.some(boss => boss.at === gameState.enemiesSpawned)) {
                const boss = wave.bosses.find(boss => boss.at === gameState.enemiesSpawned);
                gameState.enemies.push(new Enemy(boss.type, [...gameState.path], gameState.currentWave));
                showMessage(`${boss.type.toUpperCase()} INCOMING!`, canvas.width/2, canvas.height/2);
            } else {
                // Regular enemy spawn
                let enemyType;
                if (wave.type === 'mixed') {
                    enemyType = wave.types[Math.floor(Math.random() * wave.types.length)];
                } else {
                    enemyType = wave.type;
                }
                const enemy = new Enemy(enemyType, [...gameState.path], gameState.currentWave);
                
                // Make enemies stronger each wave
                enemy.health *= (1 + gameState.currentWave * 0.1);  // 10% more health each wave
                enemy.speed *= (1 + gameState.currentWave * 0.05);  // 5% faster each wave
                enemy.reward = Math.floor(enemy.reward * (1 + gameState.currentWave * 0.1));  // 10% more reward each wave
                
                gameState.enemies.push(enemy);
            }

            gameState.enemiesSpawned++;

            // Schedule next enemy spawn
            if (gameState.enemiesSpawned < wave.count) {
                setTimeout(spawnEnemy, wave.interval);
            }
        };

        // Start spawning enemies
        spawnEnemy();
    } else if (waveNumber <= 9) {
        // Waves 8-9: Add ghost mice
        const wave = generateWave(waveNumber);
        gameState.enemiesSpawned = 0;
        gameState.waveInProgress = true;

        // Show wave start message
        showMessage(`Wave ${waveNumber} Starting!`, canvas.width/2, canvas.height/2);

        const spawnEnemy = () => {
            if (gameState.enemiesSpawned >= wave.count || !gameState.waveInProgress) {
                return;
            }

            // Check if we should spawn a boss
            if (wave.bosses && wave.bosses.some(boss => boss.at === gameState.enemiesSpawned)) {
                const boss = wave.bosses.find(boss => boss.at === gameState.enemiesSpawned);
                gameState.enemies.push(new Enemy(boss.type, [...gameState.path], gameState.currentWave));
                showMessage(`${boss.type.toUpperCase()} INCOMING!`, canvas.width/2, canvas.height/2);
            } else {
                // Regular enemy spawn
                let enemyType;
                if (wave.type === 'mixed') {
                    enemyType = wave.types[Math.floor(Math.random() * wave.types.length)];
                } else {
                    enemyType = wave.type;
                }
                const enemy = new Enemy(enemyType, [...gameState.path], gameState.currentWave);
                
                // Make enemies stronger each wave
                enemy.health *= (1 + gameState.currentWave * 0.1);  // 10% more health each wave
                enemy.speed *= (1 + gameState.currentWave * 0.05);  // 5% faster each wave
                enemy.reward = Math.floor(enemy.reward * (1 + gameState.currentWave * 0.1));  // 10% more reward each wave
                
                gameState.enemies.push(enemy);
            }

            gameState.enemiesSpawned++;

            // Schedule next enemy spawn
            if (gameState.enemiesSpawned < wave.count) {
                setTimeout(spawnEnemy, wave.interval);
            }
        };

        // Start spawning enemies
        spawnEnemy();
    } else {
        // Wave 10: Final boss wave!
        const wave = generateWave(waveNumber);
        gameState.enemiesSpawned = 0;
        gameState.waveInProgress = true;

        // Show wave start message
        showMessage(`Wave ${waveNumber} Starting!`, canvas.width/2, canvas.height/2);

        const spawnEnemy = () => {
            if (gameState.enemiesSpawned >= wave.count || !gameState.waveInProgress) {
                return;
            }

            // Check if we should spawn a boss
            if (wave.bosses && wave.bosses.some(boss => boss.at === gameState.enemiesSpawned)) {
                const boss = wave.bosses.find(boss => boss.at === gameState.enemiesSpawned);
                gameState.enemies.push(new Enemy(boss.type, [...gameState.path], gameState.currentWave));
                showMessage(`${boss.type.toUpperCase()} INCOMING!`, canvas.width/2, canvas.height/2);
            } else {
                // Regular enemy spawn
                let enemyType;
                if (wave.type === 'mixed') {
                    enemyType = wave.types[Math.floor(Math.random() * wave.types.length)];
                } else {
                    enemyType = wave.type;
                }
                const enemy = new Enemy(enemyType, [...gameState.path], gameState.currentWave);
                
                // Make enemies stronger each wave
                enemy.health *= (1 + gameState.currentWave * 0.1);  // 10% more health each wave
                enemy.speed *= (1 + gameState.currentWave * 0.05);  // 5% faster each wave
                enemy.reward = Math.floor(enemy.reward * (1 + gameState.currentWave * 0.1));  // 10% more reward each wave
                
                gameState.enemies.push(enemy);
            }

            gameState.enemiesSpawned++;

            // Schedule next enemy spawn
            if (gameState.enemiesSpawned < wave.count) {
                setTimeout(spawnEnemy, wave.interval);
            }
        };

        // Start spawning enemies
        spawnEnemy();
        
        // Disable add wave button after final wave
        addWaveBtn.disabled = true;
        addWaveBtn.style.backgroundColor = '#666';
        addWaveBtn.style.cursor = 'not-allowed';
    }
    
    // Show wave announcement
    showMessage(`Wave ${waveNumber} Added!`, canvas.width/2, canvas.height/2);
});

// Update wave display with enemy types
function updateWaveEnemyDisplay(wave) {
    const enemyList = document.getElementById('enemy-list');
    enemyList.innerHTML = '';  // Clear current list

    // Get unique enemy types
    let types = wave.type === 'mixed' ? [...new Set(wave.types)] : [wave.type];
    
    // Add boss types if present
    if (wave.bosses) {
        wave.bosses.forEach(boss => {
            if (!types.includes(boss.type)) {
                types.push(boss.type);
            }
        });
    }

    // Add previous wave types if not wave 1
    if (gameState.currentWave > 0) {
        const prevWave = generateWave(gameState.currentWave);
        const prevTypes = prevWave.type === 'mixed' ? prevWave.types : [prevWave.type];
        prevTypes.forEach(type => {
            if (!types.includes(type)) {
                types.push(type);
            }
        });
    }

    // Create enemy type badges
    types.forEach(type => {
        const span = document.createElement('span');
        span.className = `enemy-type ${type}`;
        span.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        if (gameState.currentWave > 0 && !wave.types?.includes(type)) {
            span.style.opacity = '0.6';  // Fade previous wave types
        }
        enemyList.appendChild(span);
    });
}

// Show message in the middle of the screen
function showMessage(text, x, y) {
    const announcement = document.createElement('div');
    announcement.className = 'wave-announcement';
    announcement.textContent = text;
    document.body.appendChild(announcement);
    
    // Remove the announcement after animation
    setTimeout(() => announcement.remove(), 2000);
}

// Draw path
function drawPath() {
    ctx.beginPath();
    ctx.moveTo(gameState.path[0].x, gameState.path[0].y);
    
    for (let i = 1; i < gameState.path.length; i++) {
        ctx.lineTo(gameState.path[i].x, gameState.path[i].y);
    }
    
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 40;
    ctx.stroke();
    
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 36;
    ctx.stroke();
}

// Draw projectiles
function drawProjectiles() {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        
        // Calculate current position
        const progress = (Date.now() - projectile.startTime) / 50; // 50ms travel time (SUPER SUPER FAST!)
        if (progress >= 1) {
            if (!projectile.damageDealt && projectile.target && projectile.target.health > 0) {
                projectile.target.health -= projectile.damage;  // Use normal numbers for damage
                projectile.damageDealt = true;
            }
            gameState.projectiles.splice(i, 1);
            i--;
            continue;
        }

        const x = projectile.x + (projectile.targetX - projectile.x) * progress;
        const y = projectile.y + (projectile.targetY - projectile.y) * progress;

        // Draw projectile
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = projectile.color;
        ctx.fill();
    }
}

// Turret attack function
function turretAttack(turret, enemies) {
    if (!enemies.length) return null;
    
    // Check if turret can fire
    const now = Date.now();
    if (now - turret.lastShot < turret.fireRate) return null;

    // Find target in range
    let target = null;
    let minDistance = Infinity;
    
    for (const enemy of enemies) {
        const distance = Math.hypot(enemy.x - turret.x, enemy.y - turret.y);
        if (distance < turret.range && distance < minDistance) {
            target = enemy;
            minDistance = distance;
        }
    }

    if (!target) return null;

    // Create projectile
    turret.lastShot = now;
    // Damage is now dealt when projectile hits
    return {
        x: turret.x,
        y: turret.y,
        targetX: target.x,
        targetY: target.y,
        startTime: now,
        color: turret.type === 'FROST' ? '#5dd' : '#fff',
        reached: false,
        damageDealt: false,
        damage: turret.damage,
        target: target
    };
}

// Update game state
function updateGame() {
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        const reachedEnd = enemy.update();

        if (reachedEnd) {
            gameState.lives--;
            gameState.enemies.splice(i, 1);
            
            if (gameState.lives <= 0) {
                alert('Game Over!');
                initGame();
                return;
            }
        } else if (enemy.health <= 0) {  // Check against normal number zero
            gameState.money += enemy.reward;
            gameState.score += enemy.reward;
            gameState.enemies.splice(i, 1);
        }
    }

    // Check if wave is complete
    if (gameState.enemies.length === 0 && gameState.enemiesSpawned >= generateWave(gameState.currentWave + 1).count) {
        gameState.waveInProgress = false;
        gameState.currentWave++;
        startWave(); // Start next wave immediately
    }

    // Update wave progress
    if (gameState.waveInProgress) {
        const wave = generateWave(gameState.currentWave + 1);
        const totalEnemies = wave.count;
        const remainingEnemies = wave.count - gameState.enemiesSpawned + gameState.enemies.length;
        const progress = ((totalEnemies - remainingEnemies) / totalEnemies) * 100;
        document.getElementById('wave-bar').style.width = `${progress}%`;
    }

    // Update turrets
    for (const turret of gameState.turrets) {
        const projectile = turretAttack(turret, gameState.enemies);
        if (projectile) {
            gameState.projectiles.push(projectile);
        }
    }

    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        if (projectile.reached) {
            gameState.projectiles.splice(i, 1);
        }
    }
}

// Draw turret function
function drawTurret(ctx, turret) {
    // Draw base
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#666';
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw gun based on type
    ctx.beginPath();
    switch(turret.type) {
        case 'BASIC':
            ctx.rect(turret.x - 3, turret.y - 25, 6, 22);
            ctx.fillStyle = '#5a9';
            break;
        case 'SNIPER':
            ctx.rect(turret.x - 3, turret.y - 30, 6, 30);
            ctx.fillStyle = '#c55';
            break;
        case 'CANNON':
            ctx.rect(turret.x - 6, turret.y - 22, 12, 22);
            ctx.fillStyle = '#f80';
            break;
        case 'FROST':
            ctx.moveTo(turret.x, turret.y - 25);
            ctx.lineTo(turret.x + 6, turret.y - 15);
            ctx.lineTo(turret.x, turret.y - 5);
            ctx.lineTo(turret.x - 6, turret.y - 15);
            ctx.closePath();
            ctx.fillStyle = '#5dd';
            break;
    }
    ctx.fill();
    ctx.stroke();

    // Draw head
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#777';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.stroke();
}

// Draw turret upgrade bar
function drawTurretUpgradeBar(turret) {
    if (turret !== gameState.selectedTurret) return;

    const barWidth = 60;
    const barHeight = 8;
    const x = turret.x - barWidth/2;
    const y = turret.y + 25;
    
    // Draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
    
    // Draw level indicator
    const levelProgress = Math.min((turret.level - 1) / 5, 1); // Max at level 6
    
    // Gradient for upgrade bar
    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, '#ff0');
    gradient.addColorStop(0.5, '#f80');
    gradient.addColorStop(1, '#f00');
    
    // Draw progress bar
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * levelProgress, barHeight);
    
    // Draw level text
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(`LVL ${turret.level}`, turret.x, y - 5);
    ctx.fillText(`LVL ${turret.level}`, turret.x, y - 5);
    
    // Draw damage text
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#ff0';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(`DMG: ${Math.round(turret.damage)}`, turret.x, y + 20);
    ctx.fillText(`DMG: ${Math.round(turret.damage)}`, turret.x, y + 20);
    
    if (turret.level >= 6) {
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#f00';
        ctx.strokeText('MAXED!', turret.x, y - 25);
        ctx.fillText('MAXED!', turret.x, y - 25);
        
        // Add subtle glow for max level
        ctx.beginPath();
        ctx.arc(turret.x, turret.y, 20, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(
            turret.x, turret.y, 0,
            turret.x, turret.y, 20
        );
        glowGradient.addColorStop(0, 'rgba(255, 0, 0, 0.1)');
        glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();
    }
}

// Update turret UI
function updateTurretUI(turret) {
    const menu = document.getElementById('selected-turret');
    menu.classList.remove('hidden');
    
    document.getElementById('turret-name').textContent = `Type: ${turret.type}`;
    document.getElementById('turret-level').textContent = `Level: ${turret.level}`;
    document.getElementById('turret-damage').textContent = `Damage: ${Math.round(turret.damage)}`;
    document.getElementById('turret-range').textContent = `Range: ${Math.round(turret.range)}`;
    document.getElementById('turret-speed').textContent = `Attack Speed: ${(1000/turret.fireRate).toFixed(1)}`;

    // Update upgrade buttons with new costs
    document.getElementById('upgrade-damage').textContent = `Upgrade Damage (75g)`;
    document.getElementById('upgrade-range').textContent = `Upgrade Range (60g)`;
    document.getElementById('upgrade-speed').textContent = `Upgrade Speed (90g)`;
    
    document.getElementById('upgrade-damage').disabled = gameState.money < 75;
    document.getElementById('upgrade-range').disabled = gameState.money < 60;
    document.getElementById('upgrade-speed').disabled = gameState.money < 90;
}

// Close menu button handler
document.getElementById('close-menu').addEventListener('click', () => {
    document.getElementById('selected-turret').classList.add('hidden');
    gameState.selectedTurret = null;
});

// Add upgrade event listeners with new costs
document.getElementById('upgrade-damage').addEventListener('click', () => {
    if (gameState.selectedTurret && gameState.money >= 75) {
        gameState.selectedTurret.damage *= 2.5;
        gameState.money -= 75;
        gameState.selectedTurret.level++;
        updateTurretUI(gameState.selectedTurret);
    }
});

document.getElementById('upgrade-range').addEventListener('click', () => {
    if (gameState.selectedTurret && gameState.money >= 60) {
        gameState.selectedTurret.range *= 1.3;
        gameState.money -= 60;
        gameState.selectedTurret.level++;
        updateTurretUI(gameState.selectedTurret);
    }
});

document.getElementById('upgrade-speed').addEventListener('click', () => {
    if (gameState.selectedTurret && gameState.money >= 90) {
        gameState.selectedTurret.fireRate *= 0.8;  // Lower is faster
        gameState.money -= 90;
        gameState.selectedTurret.level++;
        updateTurretUI(gameState.selectedTurret);
    }
});

// Add sell turret handler
document.getElementById('sell-tower').addEventListener('click', () => {
    if (gameState.selectedTurret) {
        // Get refund based on turret type and upgrades
        const baseCost = getTurretCost(gameState.selectedTurret.type);
        const refund = Math.floor(baseCost * 0.7);  // 70% refund
        gameState.money += refund;
        
        // Remove turret
        const index = gameState.turrets.indexOf(gameState.selectedTurret);
        if (index > -1) {
            gameState.turrets.splice(index, 1);
        }
        
        // Close menu
        document.getElementById('selected-turret').classList.add('hidden');
        gameState.selectedTurret = null;
    }
});

// Add right-click to close menu
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameState.selectedTurret) {
        document.getElementById('selected-turret').classList.add('hidden');
        gameState.selectedTurret = null;
    }
    if (gameState.selectedTurretType) {
        gameState.selectedTurretType = null;
        canvas.classList.remove('placing-turret');
        document.getElementById('placement-preview').classList.add('hidden');
        document.querySelectorAll('.tower-option').forEach(opt => 
            opt.classList.remove('selected'));
    }
});

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    document.getElementById('money').textContent = `Money: ${gameState.money}`;
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;
    document.getElementById('wave').textContent = `Wave: ${gameState.currentWave}`;
}

// Add a "Start Next Wave" button
function addStartWaveButton() {
    const startWaveBtn = document.createElement('button');
    startWaveBtn.id = 'start-wave-btn';
    startWaveBtn.className = 'start-wave-btn';
    startWaveBtn.textContent = 'Start Next Wave';
    startWaveBtn.onclick = () => {
        if (!gameState.waveInProgress) {
            startWave();
            startWaveBtn.style.display = 'none';
        }
    };
    document.body.appendChild(startWaveBtn);
    return startWaveBtn;
}

// Initialize the start wave button
const startWaveBtn = addStartWaveButton();

// Game initialization
function initGame() {
    // Reset game state
    gameState.money = 1500;
    gameState.score = 0;
    gameState.lives = 20;
    gameState.currentWave = 0;
    gameState.turrets = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.selectedTurret = null;
    gameState.waveEnemies = [];
    gameState.waveInProgress = false;
    gameState.lastSpawnTime = 0;
    gameState.gameOver = false;
    gameState.enemiesSpawned = 0;

    // Reset wave display
    document.getElementById('current-wave').textContent = '1';
    document.getElementById('total-waves').textContent = '∞';
    document.getElementById('wave-bar').style.width = '0%';
    document.getElementById('enemy-list').innerHTML = '';

    // Start game loop
    if (gameState.gameLoop) cancelAnimationFrame(gameState.gameLoop);
    gameLoop();

    // Start first wave
    startWave();
}

// Main game loop
function gameLoop() {
    if (gameState.gameOver) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw path
    drawPath();
    
    // Update game state
    updateGame();
    
    // Draw turrets and their upgrade bars
    for (const turret of gameState.turrets) {
        drawTurret(ctx, turret);
        drawTurretUpgradeBar(turret);
        
        // Draw selection circle for selected turret
        if (turret === gameState.selectedTurret) {
            ctx.beginPath();
            ctx.arc(turret.x, turret.y, 25, 0, Math.PI * 2);
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw range circle with gradient
            ctx.beginPath();
            ctx.arc(turret.x, turret.y, turret.range, 0, Math.PI * 2);
            const rangeGradient = ctx.createRadialGradient(
                turret.x, turret.y, 0,
                turret.x, turret.y, turret.range
            );
            rangeGradient.addColorStop(0, 'rgba(0, 255, 0, 0.1)');
            rangeGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            ctx.fillStyle = rangeGradient;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.stroke();
        }
    }
    
    // Draw enemies
    for (const enemy of gameState.enemies) {
        enemy.draw(ctx);
    }
    
    // Draw projectiles
    drawProjectiles();
    
    // Update and draw particles
    updateParticles();

    // Draw turret preview if type is selected
    if (gameState.selectedTurretType) {
        ctx.globalAlpha = 0.5;
        drawTurret(ctx, {
            type: gameState.selectedTurretType,
            x: gameState.mouseX,
            y: gameState.mouseY
        });
        ctx.globalAlpha = 1.0;
    }

    // Update UI
    updateUI();
    
    // Continue game loop
    gameState.gameLoop = requestAnimationFrame(gameLoop);
}

// Start the game when the page loads
window.addEventListener('load', initGame);

// Victory screen
function showVictoryScreen() {
    ctx.save();
    
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw victory message
    ctx.fillStyle = '#C8AA6E';
    ctx.strokeStyle = '#1E2328';
    ctx.lineWidth = 5;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text with stroke
    ctx.strokeText('Congratulations!', canvas.width/2, canvas.height/2 - 30);
    ctx.fillText('Congratulations!', canvas.width/2, canvas.height/2 - 30);
    
    ctx.font = 'bold 32px Arial';
    ctx.strokeText(`You've defeated all waves!`, canvas.width/2, canvas.height/2 + 30);
    ctx.fillText(`You've defeated all waves!`, canvas.width/2, canvas.height/2 + 30);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, canvas.width/2, canvas.height/2 + 80);
    
    // Draw restart button
    const btnWidth = 200;
    const btnHeight = 50;
    const btnX = canvas.width/2 - btnWidth/2;
    const btnY = canvas.height/2 + 120;
    
    ctx.fillStyle = '#C8AA6E';
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.fillStyle = '#1E2328';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Play Again', canvas.width/2, btnY + btnHeight/2);
    
    ctx.restore();
    
    // Add click handler for restart button
    canvas.addEventListener('click', function restartHandler(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= btnX && x <= btnX + btnWidth && 
            y >= btnY && y <= btnY + btnHeight) {
            canvas.removeEventListener('click', restartHandler);
            initGame();
        }
    });
    
    // Stop the game loop
    gameState.gameOver = true;
}
