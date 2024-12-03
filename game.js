// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
const gameState = {
    score: 0,
    money: 100,
    lives: 10,
    enemies: [],
    towers: [],
    gameLoop: null
};

// Game initialization
function initGame() {
    // Reset game state
    gameState.score = 0;
    gameState.money = 100;
    gameState.lives = 10;
    gameState.enemies = [];
    gameState.towers = [];

    // Start game loop
    if (gameState.gameLoop) cancelAnimationFrame(gameState.gameLoop);
    gameLoop();
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
    // TODO: Add game logic for updating enemies, towers, and projectiles
}

// Draw game elements
function drawGame() {
    // Draw game grid
    drawGrid();
    
    // TODO: Add drawing logic for enemies, towers, and projectiles
}

// Draw grid for game map
function drawGrid() {
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    document.getElementById('money').textContent = `Money: ${gameState.money}`;
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;
}

// Start the game when the page loads
window.addEventListener('load', initGame);
