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
    ]
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
    { count: 10, type: 'MINION', interval: 1000 },
    { count: 15, type: 'MINION', interval: 800 },
    { count: 12, type: 'CANNON_MINION', interval: 1200 },
    { count: 20, type: 'MINION', interval: 500 },
    { count: 8, type: 'SUPER_MINION', interval: 2000 },
    { count: 25, type: 'MIXED', interval: 800 },
    { count: 1, type: 'BARON', interval: 1000 }
];

// Game initialization
function initGame() {
    // Reset game state
    gameState.score = 0;
    gameState.money = 500;
    gameState.lives = 20;
    gameState.enemies = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.currentWave = 0;
    gameState.selectedTowerType = null;

    // Start game loop
    if (gameState.gameLoop) cancelAnimationFrame(gameState.gameLoop);
    gameLoop();
    
    // Start first wave
    startWave();
}

// Wave management
function startWave() {
    if (gameState.currentWave >= WAVES.length) {
        // Victory condition
        alert('Congratulations! You won!');
        return;
    }

    const wave = WAVES[gameState.currentWave];
    let enemiesSpawned = 0;

    const spawnInterval = setInterval(() => {
        if (enemiesSpawned >= wave.count) {
            clearInterval(spawnInterval);
            gameState.currentWave++;
            return;
        }

        const enemyType = wave.type === 'MIXED' 
            ? ['MINION', 'CANNON_MINION', 'SUPER_MINION'][Math.floor(Math.random() * 3)]
            : wave.type;

        gameState.enemies.push(new Enemy([...gameState.path], enemyType));
        enemiesSpawned++;
    }, wave.interval);
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game elements
    updateGame();

    // Draw game elements
    drawGame();

    // Update UI
    updateUI();

    // Continue game loop
    gameState.gameLoop = requestAnimationFrame(gameLoop);
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
        } else if (enemy.health <= 0) {
            gameState.money += enemy.value;
            gameState.score += enemy.value;
            gameState.enemies.splice(i, 1);
        }
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
        // Add projectile movement logic here
        if (projectile.reached) {
            gameState.projectiles.splice(i, 1);
        }
    }
}

// Draw game elements
function drawGame() {
    // Draw path
    drawPath();
    
    // Draw towers
    gameState.towers.forEach(tower => tower.draw(ctx));
    
    // Draw enemies
    gameState.enemies.forEach(enemy => enemy.draw(ctx));
    
    // Draw projectiles
    drawProjectiles();
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

    if (gameState.selectedTowerType) {
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

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    document.getElementById('money').textContent = `Money: ${gameState.money}`;
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;
    document.getElementById('wave').textContent = `Wave: ${gameState.currentWave + 1}/${WAVES.length}`;
}

// Start the game when the page loads
window.addEventListener('load', initGame);
