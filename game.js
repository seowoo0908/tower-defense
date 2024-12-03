// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Import Enemy class from enemies.js
const Enemy = window.Enemy;

// Game state
const gameState = {
    score: 0,
    money: 500,
    lives: 20,
    enemies: [],
    towers: [],
    projectiles: [],
    selectedTower: null,
    selectedTowerType: null,
    currentWave: 0,
    gameLoop: null,
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

// Add tower selection event listeners
document.querySelectorAll('.tower-option').forEach(option => {
    option.addEventListener('click', () => {
        const towerType = option.getAttribute('data-tower');
        gameState.selectedTowerType = towerType;
        
        // Update visual feedback
        document.querySelectorAll('.tower-option').forEach(opt => 
            opt.style.border = '1px solid #C8AA6E');
        option.style.border = '2px solid #00ff00';
    });
});

// Wave configuration
const WAVES = [
    // Wave 1: Mixed enemies
    {
        name: "Mixed Mayhem",
        count: 20,
        type: 'mixed',
        types: ['regular', 'fast', 'tank'],
        interval: 1500,
        bosses: []
    },
    // Wave 2: Fast enemies
    {
        name: "Fast Forward!",
        count: 25,
        type: 'mixed',
        types: ['fast', 'regular'],
        interval: 1200,
        bosses: []
    },
    // Wave 3: Tank enemies
    {
        name: "Tank Brigade",
        count: 20,
        type: 'mixed',
        types: ['tank', 'regular'],
        interval: 2000,
        bosses: []
    },
    // Wave 4: Ghost enemies
    {
        name: "Ghost Train",
        count: 30,
        type: 'mixed',
        types: ['ghost', 'fast'],
        interval: 1000,
        bosses: []
    },
    // Wave 5: Boss wave
    {
        name: "Boss Rush",
        count: 15,
        type: 'mixed',
        types: ['tank', 'regular'],
        interval: 2000,
        bosses: [
            { type: 'boss', at: 7 },
            { type: 'boss', at: 14 }
        ]
    },
    // Wave 6: Speed demons
    {
        name: "Speed Demons",
        count: 40,
        type: 'mixed',
        types: ['fast', 'ninja'],
        interval: 800,
        bosses: []
    },
    // Wave 7: Tank parade
    {
        name: "Tank Parade",
        count: 25,
        type: 'mixed',
        types: ['tank'],
        interval: 2000,
        bosses: [
            { type: 'boss', at: 12 },
            { type: 'boss', at: 24 }
        ]
    },
    // Wave 8: Ninja assault
    {
        name: "Ninja Assault",
        count: 35,
        type: 'mixed',
        types: ['ninja', 'fast'],
        interval: 1000,
        bosses: []
    },
    // Wave 9: Ghost army
    {
        name: "Ghost Army",
        count: 30,
        type: 'mixed',
        types: ['ghost', 'ninja'],
        interval: 1200,
        bosses: []
    },
    // Wave 10: Final showdown
    {
        name: "Final Showdown",
        count: 40,
        type: 'mixed',
        types: ['regular', 'fast', 'tank', 'ninja', 'ghost'],
        interval: 1500,
        bosses: [
            { type: 'ghost', at: 10 },
            { type: 'ghost', at: 20 },
            { type: 'ninja', at: 30 },
            { type: 'boss', at: 39 }
        ]
    }
];

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

// Add skip wave button
const skipWaveBtn = document.createElement('button');
skipWaveBtn.textContent = 'Skip Wave';
skipWaveBtn.style.position = 'absolute';
skipWaveBtn.style.top = '50px';
skipWaveBtn.style.right = '10px';
skipWaveBtn.style.padding = '10px';
skipWaveBtn.style.backgroundColor = '#C8AA6E';
skipWaveBtn.style.border = 'none';
skipWaveBtn.style.borderRadius = '5px';
skipWaveBtn.style.cursor = 'pointer';
document.body.appendChild(skipWaveBtn);

// Add wave button click handler
addWaveBtn.addEventListener('click', () => {
    const waveNumber = WAVES.length + 1;
    
    // Add a new wave based on wave number
    if (waveNumber <= 4) {
        // Waves 3-4: Mix of regular, fast, and tank
        WAVES.push({
            count: 8 + waveNumber,
            type: 'mixed',
            interval: 1200 - waveNumber * 100,
            types: ['regular', 'fast', 'tank']
        });
    } else if (waveNumber <= 7) {
        // Waves 5-7: Add ninja mice
        WAVES.push({
            count: 12 + (waveNumber - 4),
            type: 'mixed',
            interval: 1000 - (waveNumber - 4) * 50,
            types: ['regular', 'fast', 'tank', 'ninja']
        });
    } else if (waveNumber <= 9) {
        // Waves 8-9: Add ghost mice
        WAVES.push({
            count: 15,
            type: 'mixed',
            interval: 900,
            types: ['regular', 'fast', 'ninja', 'ghost'],
            bosses: [{ type: 'ghost', at: 8 }]
        });
    } else {
        // Wave 10: Final boss wave!
        WAVES.push({
            count: 20,
            type: 'mixed',
            interval: 800,
            types: ['ninja', 'ghost', 'ghost'],  // Mostly ghosts
            bosses: [
                { type: 'ghost', at: 5 },
                { type: 'ghost', at: 10 },
                { type: 'ninja', at: 15 },
                { type: 'boss', at: 20 }
            ]
        });
        
        // Disable add wave button after final wave
        addWaveBtn.disabled = true;
        addWaveBtn.style.backgroundColor = '#666';
        addWaveBtn.style.cursor = 'not-allowed';
    }
    
    // Show wave announcement
    showMessage(`Wave ${waveNumber} Added!`, canvas.width/2, canvas.height/2);
});

// Skip wave button click handler
skipWaveBtn.addEventListener('click', () => {
    if (gameState.waveInProgress) {
        // Clear all current enemies
        gameState.enemies = [];
        gameState.enemiesSpawned = WAVES[gameState.currentWave].count;
        gameState.waveInProgress = false;
        
        // Move to next wave
        gameState.currentWave++;
        if (gameState.currentWave < WAVES.length) {
            setTimeout(() => {
                startWave();
            }, 1000);
        }
    }
});

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
                gameState.gameOver = true;
                return;
            }
        } else if (enemy.health <= 0) {
            gameState.money += enemy.reward;
            gameState.score += enemy.reward;
            gameState.enemies.splice(i, 1);
        }
    }

    // Check if wave is complete
    if (gameState.waveInProgress && gameState.enemiesSpawned >= WAVES[gameState.currentWave].count && gameState.enemies.length === 0) {
        gameState.waveInProgress = false;
        
        // Show wave complete message
        const wave = WAVES[gameState.currentWave];
        showMessage(`${wave.name} Complete!`, canvas.width/2, canvas.height/2);
        
        // Check if all waves are complete
        if (gameState.currentWave >= WAVES.length - 1) {
            showVictoryScreen();
            return;
        }
        
        // Prepare for next wave
        gameState.currentWave++;
        startWaveBtn.disabled = false;
        startWaveBtn.style.display = 'block';
    }

    // Update towers
    for (const tower of gameState.towers) {
        const projectile = tower.attack(gameState.enemies);
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

// Add start wave button
function addStartWaveButton() {
    const startWaveBtn = document.createElement('button');
    startWaveBtn.textContent = 'Start Next Wave';
    startWaveBtn.style.position = 'absolute';
    startWaveBtn.style.top = '10px';
    startWaveBtn.style.right = '10px';
    startWaveBtn.style.padding = '10px';
    startWaveBtn.style.backgroundColor = '#C8AA6E';
    startWaveBtn.style.border = 'none';
    startWaveBtn.style.borderRadius = '5px';
    startWaveBtn.style.cursor = 'pointer';
    startWaveBtn.style.display = 'block';
    
    startWaveBtn.addEventListener('click', () => {
        if (!gameState.waveInProgress) {
            startWave();
            startWaveBtn.disabled = true;
            startWaveBtn.style.display = 'none';
        }
    });
    
    document.body.appendChild(startWaveBtn);
    return startWaveBtn;
}

// Wave management
function startWave() {
    if (gameState.currentWave >= WAVES.length) {
        if (gameState.enemies.length === 0) {
            showVictoryScreen();
        }
        return;
    }

    const wave = WAVES[gameState.currentWave];
    gameState.enemiesSpawned = 0;
    gameState.waveInProgress = true;

    // Show wave start message with wave name
    const waveName = wave.name || `Wave ${gameState.currentWave + 1}`;
    showMessage(`${waveName}\nSTART!`, canvas.width/2, canvas.height/2);

    // Hide start wave button during wave
    startWaveBtn.disabled = true;
    startWaveBtn.style.display = 'none';

    // Spawn enemies at intervals
    const spawnInterval = setInterval(() => {
        if (gameState.enemiesSpawned >= wave.count) {
            clearInterval(spawnInterval);
            return;
        }

        // Get enemy type based on wave type
        let enemyType;
        if (wave.type === 'mixed') {
            enemyType = wave.types[Math.floor(Math.random() * wave.types.length)];
        } else if (wave.type === 'pattern') {
            enemyType = wave.pattern[gameState.enemiesSpawned % wave.pattern.length];
        } else {
            enemyType = wave.type;
        }

        // Check for boss spawn points
        if (wave.bosses && wave.bosses.some(boss => boss.at === gameState.enemiesSpawned)) {
            const boss = wave.bosses.find(boss => boss.at === gameState.enemiesSpawned);
            gameState.enemies.push(new Enemy(boss.type, [...gameState.path], gameState.currentWave));
            showMessage(`${boss.type.toUpperCase()} INCOMING!`, canvas.width/2, canvas.height/2);
        } else {
            gameState.enemies.push(new Enemy(enemyType, [...gameState.path], gameState.currentWave));
        }

        gameState.enemiesSpawned++;
    }, wave.interval);
}

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
        const prevWave = WAVES[gameState.currentWave - 1];
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
    ctx.lineWidth = 2;
    gameState.projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.moveTo(projectile.from.x, projectile.from.y);
        ctx.lineTo(projectile.to.x, projectile.to.y);
        ctx.strokeStyle = projectile.color;
        ctx.stroke();
    });
}

// Tower placement
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing tower
    const clickedTower = gameState.towers.find(tower => {
        const distance = Math.hypot(tower.x - x, tower.y - y);
        return distance < 20;
    });

    if (clickedTower) {
        // Select tower for upgrade
        gameState.selectedTower = clickedTower;
        updateTowerUI(clickedTower);
        document.getElementById('tower-details').classList.remove('hidden');
    } else if (gameState.selectedTowerType) {
        const towerCost = TOWER_TYPES[gameState.selectedTowerType].cost;
        
        if (gameState.money >= towerCost) {
            const newTower = new Tower(gameState.selectedTowerType, x, y);
            gameState.towers.push(newTower);
            gameState.money -= towerCost;
            
            // Reset selection
            gameState.selectedTowerType = null;
            document.querySelectorAll('.tower-option').forEach(opt => 
                opt.style.border = '1px solid #C8AA6E');
        } else {
            // Show "not enough money" message
            const message = document.createElement('div');
            message.textContent = 'Not enough gold!';
            message.style.position = 'absolute';
            message.style.color = 'red';
            message.style.left = `${e.clientX}px`;
            message.style.top = `${e.clientY}px`;
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 1000);
        }
    }
});

// Update tower UI
function updateTowerUI(tower) {
    document.getElementById('tower-name').textContent = `Type: ${tower.name}`;
    document.getElementById('tower-level').textContent = `Level: ${tower.level}`;
    document.getElementById('tower-damage').textContent = `Damage: ${tower.damage}`;
    document.getElementById('tower-range').textContent = `Range: ${tower.range}`;
    document.getElementById('tower-speed').textContent = `Attack Speed: ${tower.attackSpeed.toFixed(1)}`;

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

// Initialize the start wave button
const startWaveBtn = addStartWaveButton();

// Game initialization
function initGame() {
    // Cancel any existing game loop
    if (gameState.gameLoop) {
        cancelAnimationFrame(gameState.gameLoop);
        gameState.gameLoop = null;
    }

    // Reset game state
    gameState.money = 500;
    gameState.score = 0;
    gameState.lives = 20;
    gameState.currentWave = 0;
    gameState.towers = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.selectedTower = null;
    gameState.selectedTowerType = null;  // Reset selected tower type
    gameState.waveEnemies = [];
    gameState.waveInProgress = false;
    gameState.lastSpawnTime = 0;
    gameState.gameOver = false;
    gameState.enemiesSpawned = 0;

    // Reset wave display
    document.getElementById('current-wave').textContent = '1';
    document.getElementById('total-waves').textContent = '10';
    document.getElementById('wave-bar').style.width = '0%';
    document.getElementById('enemy-list').innerHTML = '';

    // Reset tower selection UI
    document.querySelectorAll('.tower-option').forEach(opt => 
        opt.style.border = '1px solid #C8AA6E');
    document.getElementById('tower-details').classList.add('hidden');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Start game loop
    gameLoop();

    // Enable start wave button
    startWaveBtn.disabled = false;
    startWaveBtn.style.display = 'block';
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw path
    drawPath();
    
    // Only update if game is not over
    if (!gameState.gameOver) {
        // Update game state
        updateGame();
        
        // Draw towers
        for (const tower of gameState.towers) {
            tower.draw(ctx);
        }
        
        // Draw enemies
        gameState.enemies.forEach(enemy => enemy.draw(ctx));
        
        // Draw projectiles
        drawProjectiles();
        
        // Update UI
        updateUI();
        
        // Continue game loop
        gameState.gameLoop = requestAnimationFrame(gameLoop);
    }
}

// Start the game when the page loads
window.addEventListener('load', initGame);

// Add upgrade event listeners
document.getElementById('upgrade-damage').addEventListener('click', () => {
    if (gameState.selectedTower && gameState.money >= 100) {
        gameState.selectedTower.damage *= 1.5;
        gameState.money -= 100;
        updateTowerUI(gameState.selectedTower);
    }
});

document.getElementById('upgrade-range').addEventListener('click', () => {
    if (gameState.selectedTower && gameState.money >= 75) {
        gameState.selectedTower.range *= 1.2;
        gameState.money -= 75;
        updateTowerUI(gameState.selectedTower);
    }
});

document.getElementById('upgrade-speed').addEventListener('click', () => {
    if (gameState.selectedTower && gameState.money >= 125) {
        gameState.selectedTower.attackSpeed *= 1.3;
        gameState.money -= 125;
        updateTowerUI(gameState.selectedTower);
    }
});

document.getElementById('sell-tower').addEventListener('click', () => {
    if (gameState.selectedTower) {
        const index = gameState.towers.indexOf(gameState.selectedTower);
        if (index > -1) {
            // Return 70% of total investment
            const refund = Math.floor(gameState.selectedTower.getTotalInvestment() * 0.7);
            gameState.money += refund;
            gameState.towers.splice(index, 1);
            document.getElementById('tower-details').classList.add('hidden');
            gameState.selectedTower = null;
        }
    }
});

// Close tower details panel
document.getElementById('close-details').addEventListener('click', () => {
    document.getElementById('tower-details').classList.add('hidden');
    gameState.selectedTower = null;
});

// Close tower details when clicking outside
document.addEventListener('click', (e) => {
    const towerDetails = document.getElementById('tower-details');
    const clickedTower = gameState.towers.some(tower => {
        const distance = Math.hypot(tower.x - (e.clientX - canvas.getBoundingClientRect().left), 
                                 tower.y - (e.clientY - canvas.getBoundingClientRect().top));
        return distance < 20;
    });

    if (!towerDetails.contains(e.target) && 
        !clickedTower && 
        e.target !== canvas && 
        !e.target.closest('.tower-option')) {
        towerDetails.classList.add('hidden');
        gameState.selectedTower = null;
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
