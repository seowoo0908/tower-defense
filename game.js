// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
const gameState = {
    score: 0,
    money: 500,
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
    enemiesSpawned: 0
};

// Track mouse position
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mouseX = e.clientX - rect.left;
    gameState.mouseY = e.clientY - rect.top;
});

// Add turret selection event listeners
document.querySelectorAll('.turret-option').forEach(option => {
    option.addEventListener('click', () => {
        const turretType = option.getAttribute('data-tower');
        gameState.selectedTurretType = turretType;
        
        // Update visual feedback
        document.querySelectorAll('.turret-option').forEach(opt => 
            opt.style.border = '1px solid #C8AA6E');
        option.style.border = '2px solid #00ff00';
        
        // Change cursor style
        canvas.classList.add('placing-turret');

        // Show placement details
        const turretData = TURRET_TYPES[turretType];
        document.getElementById('placement-details').classList.remove('hidden');
        document.getElementById('preview-name').textContent = turretData.name;
        document.getElementById('preview-damage').textContent = `Damage: ${turretData.damage}`;
        document.getElementById('preview-range').textContent = `Range: ${turretData.range}`;
        document.getElementById('preview-speed').textContent = `Attack Speed: ${turretData.attackSpeed}`;
        document.getElementById('preview-special').textContent = `Special: ${turretData.special}`;
        document.getElementById('preview-description').textContent = turretData.description;

        // Update preview circle color
        const previewCircle = document.querySelector('.turret-preview');
        previewCircle.style.backgroundColor = turretData.color;
    });
});

// Right click to cancel turret placement
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameState.selectedTurretType) {
        gameState.selectedTurretType = null;
        canvas.classList.remove('placing-turret');
        document.querySelectorAll('.turret-option').forEach(opt => 
            opt.style.border = '1px solid #C8AA6E');
        document.getElementById('placement-details').classList.add('hidden');
    }
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
        // Select turret for upgrade
        gameState.selectedTurret = clickedTurret;
        updateTurretUI(clickedTurret);
        document.getElementById('selected-turret').classList.remove('hidden');
        document.getElementById('placement-details').classList.add('hidden');
        
        // Reset turret placement mode
        gameState.selectedTurretType = null;
        canvas.classList.remove('placing-turret');
        document.querySelectorAll('.turret-option').forEach(opt => 
            opt.style.border = '1px solid #C8AA6E');
    } else if (gameState.selectedTurretType) {
        const turretCost = TURRET_TYPES[gameState.selectedTurretType].cost;
        
        if (gameState.money >= turretCost) {
            const newTurret = new Turret(gameState.selectedTurretType, x, y);
            gameState.turrets.push(newTurret);
            gameState.money -= turretCost;
            
            // Keep placement mode active
            // Don't reset selectedTurretType to allow placing multiple turrets
        } else {
            // Show "not enough money" message
            const message = document.createElement('div');
            message.textContent = 'Not enough money!';
            message.className = 'message';
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 2000);
            
            // Reset turret placement mode
            gameState.selectedTurretType = null;
            canvas.classList.remove('placing-turret');
            document.getElementById('placement-details').classList.add('hidden');
            document.querySelectorAll('.turret-option').forEach(opt => 
                opt.style.border = '1px solid #C8AA6E');
        }
    }
});

// Generate an infinite wave
function generateWave(waveNumber) {
    // Base stats that increase with wave number
    const baseCount = Math.min(8 + waveNumber * 2, 150);  // Max 150 enemies
    const baseInterval = Math.max(1500 - waveNumber * 20, 100);  // Min 100ms interval
    
    // Available enemy types based on wave number
    let types = ['regular'];
    if (waveNumber >= 2) types.push('fast');
    if (waveNumber >= 3) types.push('tank');
    if (waveNumber >= 4) types.push('ninja');
    if (waveNumber >= 5) types.push('ghost');

    // Calculate number of bosses based on wave
    const numBosses = Math.min(Math.floor(waveNumber / 5), 5);  // Max 5 bosses
    let bosses = [];
    if (numBosses > 0) {
        const bossTypes = ['tank', 'ninja', 'ghost', 'boss'];
        const positions = [];
        for (let i = 0; i < numBosses; i++) {
            const bossType = bossTypes[Math.min(Math.floor(waveNumber / 8), bossTypes.length - 1)];
            const position = Math.floor(baseCount * (0.5 + i * 0.1));  // Space out bosses
            positions.push(position);
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

    // Show wave start message
    showMessage(`Wave ${gameState.currentWave + 1} Starting!`, canvas.width/2, canvas.height/2);

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
        const progress = (Date.now() - projectile.startTime) / 200; // 200ms travel time
        if (progress >= 1) {
            projectile.reached = true;
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

// Update turret UI
function updateTurretUI(turret) {
    document.getElementById('turret-name').textContent = `Type: ${turret.name}`;
    document.getElementById('turret-level').textContent = `Level: ${turret.level}`;
    document.getElementById('turret-damage').textContent = `Damage: ${turret.damage}`;
    document.getElementById('turret-range').textContent = `Range: ${turret.range}`;
    document.getElementById('turret-speed').textContent = `Attack Speed: ${turret.attackSpeed.toFixed(1)}`;

    // Reset upgrade visibility
    document.querySelectorAll('.upgrade-item').forEach(item => {
        item.style.display = 'flex';
    });

    // Update upgrade buttons
    const damageBtn = document.getElementById('upgrade-damage');
    const rangeBtn = document.getElementById('upgrade-range');
    const speedBtn = document.getElementById('upgrade-speed');
    
    damageBtn.disabled = gameState.money < 100;
    rangeBtn.disabled = gameState.money < 75;
    speedBtn.disabled = gameState.money < 125;
}

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
    gameState.money = 500;
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
    
    // Draw turrets
    for (const turret of gameState.turrets) {
        turret.draw(ctx);
    }
    
    // Draw enemies
    for (const enemy of gameState.enemies) {
        enemy.draw(ctx);
    }
    
    // Draw projectiles
    drawProjectiles();

    // Draw turret preview if type is selected
    if (gameState.selectedTurretType) {
        const previewTurret = new Turret(gameState.selectedTurretType, gameState.mouseX, gameState.mouseY);
        ctx.globalAlpha = 0.5;
        previewTurret.draw(ctx);
        ctx.globalAlpha = 1.0;
    }

    // Update UI
    updateUI();
    
    // Continue game loop
    gameState.gameLoop = requestAnimationFrame(gameLoop);
}

// Start the game when the page loads
window.addEventListener('load', initGame);

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
        } else if (enemy.health <= 0) {
            gameState.money += enemy.reward;
            gameState.score += enemy.reward;
            gameState.enemies.splice(i, 1);
        }
    }

    // Check if all enemies are killed and wave is complete
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
        const projectile = turret.attack(gameState.enemies);
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

// Add upgrade event listeners
document.getElementById('upgrade-damage').addEventListener('click', () => {
    if (gameState.selectedTurret && gameState.money >= 100) {
        gameState.selectedTurret.damage *= 1.5;
        gameState.money -= 100;
        updateTurretUI(gameState.selectedTurret);
    }
});

document.getElementById('upgrade-range').addEventListener('click', () => {
    if (gameState.selectedTurret && gameState.money >= 75) {
        gameState.selectedTurret.range *= 1.2;
        gameState.money -= 75;
        updateTurretUI(gameState.selectedTurret);
    }
});

document.getElementById('upgrade-speed').addEventListener('click', () => {
    if (gameState.selectedTurret && gameState.money >= 125) {
        gameState.selectedTurret.attackSpeed *= 1.3;
        gameState.money -= 125;
        updateTurretUI(gameState.selectedTurret);
    }
});

document.getElementById('sell-turret').addEventListener('click', () => {
    if (gameState.selectedTurret) {
        const index = gameState.turrets.indexOf(gameState.selectedTurret);
        if (index > -1) {
            // Return 70% of total investment
            const refund = Math.floor(gameState.selectedTurret.getTotalInvestment() * 0.7);
            gameState.money += refund;
            gameState.turrets.splice(index, 1);
            document.getElementById('turret-details').classList.add('hidden');
            gameState.selectedTurret = null;
        }
    }
});

// Close turret details panel
document.getElementById('close-details').addEventListener('click', () => {
    document.getElementById('turret-details').classList.add('hidden');
    gameState.selectedTurret = null;
});

// Close turret details when clicking outside
document.addEventListener('click', (e) => {
    const turretDetails = document.getElementById('turret-details');
    const clickedTurret = gameState.turrets.some(turret => {
        const distance = Math.hypot(turret.x - (e.clientX - canvas.getBoundingClientRect().left), 
                                 turret.y - (e.clientY - canvas.getBoundingClientRect().top));
        return distance < 20;
    });

    if (!turretDetails.contains(e.target) && 
        !clickedTurret && 
        e.target !== canvas && 
        !e.target.closest('.turret-option')) {
        turretDetails.classList.add('hidden');
        gameState.selectedTurret = null;
    }
});

// Add cancel upgrade handlers
document.querySelectorAll('.cancel-upgrade').forEach(button => {
    button.addEventListener('click', (e) => {
        const upgradeItem = e.target.closest('.upgrade-item');
        upgradeItem.style.display = 'none';
    });
});

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
