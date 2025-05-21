const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Get all music elements
const musicTracks = [
  document.getElementById("gameMusic"),
  document.getElementById("gameMusic2"),
  document.getElementById("gameMusic3"),
  document.getElementById("gameMusic4"),
  document.getElementById("gameMusic5")
];

const canvasSize = 400;
const box = 20;

let snake, food, direction, score, gameInterval, isPlaying = false;
let snakeColor = "#00cc00"; // Default color
let currentLevel = 1;
let lastMoveTime = 0;
let currentMusic = musicTracks[0];
let isMusicPlaying = true;
let lastDirection = null;
let canChangeDirection = true;

let gameSpeeds = {
  1: 150, // Normal speed
  2: 100, // Fast
  3: 70   // Super fast
};

// Initialize high scores
let highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || {
  1: 0,
  2: 0,
  3: 0
};

// Music controls
function changeMusic() {
  const trackIndex = parseInt(document.getElementById("musicSelect").value) - 1;
  currentMusic.pause();
  currentMusic.currentTime = 0;
  currentMusic = musicTracks[trackIndex];
  if (isMusicPlaying) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
  }
}

function toggleMusic() {
  const btn = document.getElementById("toggleMusic");
  if (isMusicPlaying) {
    currentMusic.pause();
    btn.innerHTML = '<span class="icon">🔇</span>';
  } else {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
    btn.innerHTML = '<span class="icon">🔊</span>';
  }
  isMusicPlaying = !isMusicPlaying;
}

// Update high scores display with animation
function updateHighScoresDisplay() {
  const highScoresList = document.getElementById('highScoresList');
  highScoresList.innerHTML = '';
  for (let level in highScores) {
    const scoreDiv = document.createElement('div');
    scoreDiv.innerHTML = `
      <strong>Level ${level}</strong>
      <br>
      <span class="score-number">${highScores[level]}</span>
    `;
    scoreDiv.style.animation = 'fadeIn 0.5s ease-in-out';
    highScoresList.appendChild(scoreDiv);
  }
}

// Check if a position is occupied by the snake
function isPositionOccupied(x, y) {
  return snake.some(segment => segment.x === x && segment.y === y);
}

// Generate new food position
function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * (canvasSize / box)) * box,
      y: Math.floor(Math.random() * (canvasSize / box)) * box
    };
  } while (isPositionOccupied(newFood.x, newFood.y));
  return newFood;
}

// Draw a rounded rectangle
function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// Draw a circle
function drawCircle(x, y, radius) {
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.fill();
}

// Show only the requested screen, hide the others
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
}

// Return to home screen
function goHome() {
  clearInterval(gameInterval);
  gameInterval = null;
  isPlaying = false;
  showScreen("home-screen");
  updateHighScoresDisplay();
}

// Start or restart the game
function startGame() {
  currentLevel = parseInt(document.getElementById("levelSelect").value);
  snakeColor = document.getElementById("colorPicker").value;
  snake = [{ x: 160, y: 160 }];
  direction = "RIGHT";
  lastDirection = direction;
  score = 0;
  isPlaying = true;
  canChangeDirection = true;

  // Update display
  document.getElementById("currentLevel").textContent = currentLevel;
  document.getElementById("currentScore").textContent = score;

  food = generateFood();

  if (!isMusicPlaying) {
    toggleMusic();
  }

  clearInterval(gameInterval);
  gameInterval = setInterval(draw, gameSpeeds[currentLevel]);
  showScreen("game-screen");
}

// Main game loop
function draw() {
  if (!isPlaying) return;

  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // Draw the snake
  ctx.fillStyle = snakeColor;
  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];
    if (i === 0) {
      // Draw head as rounded rectangle
      drawRoundedRect(segment.x, segment.y, box, box, 5);
    } else {
      // Draw body segments as rounded rectangles
      drawRoundedRect(segment.x, segment.y, box, box, 3);
    }
  }

  // Move snake
  const head = { ...snake[0] };
  if (direction === "LEFT") head.x -= box;
  if (direction === "UP") head.y -= box;
  if (direction === "RIGHT") head.x += box;
  if (direction === "DOWN") head.y += box;

  lastDirection = direction;
  canChangeDirection = true;

  // Check collisions
  if (
    head.x < 0 || head.x >= canvasSize || head.y < 0 || head.y >= canvasSize ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    isPlaying = false;
    clearInterval(gameInterval);

    // Update high score if necessary
    if (score > highScores[currentLevel]) {
      highScores[currentLevel] = score;
      localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    }

    // Update game over screen
    document.getElementById("finalScore").innerText = score;
    document.getElementById("finalLevel").innerText = currentLevel;
    document.getElementById("levelHighScore").innerText = highScores[currentLevel];
    showScreen("game-over-screen");
    return;
  }

  snake.unshift(head);

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById("currentScore").textContent = score;
    food = generateFood();
  } else {
    snake.pop();
  }

  // Draw food
  ctx.fillStyle = "red";
  drawCircle(food.x, food.y, box/2);
}

// Keyboard controls with improved responsiveness and prevention of quick opposite directions
document.addEventListener("keydown", e => {
  if (!canChangeDirection) return;
  
  const key = e.key;
  const newDirection = 
    key === "ArrowLeft" ? "LEFT" :
    key === "ArrowUp" ? "UP" :
    key === "ArrowRight" ? "RIGHT" :
    key === "ArrowDown" ? "DOWN" : null;

  if (!newDirection) return;

  // Prevent 180-degree turns and ensure one move before direction change
  const isOpposite = 
    (newDirection === "LEFT" && lastDirection === "RIGHT") ||
    (newDirection === "RIGHT" && lastDirection === "LEFT") ||
    (newDirection === "UP" && lastDirection === "DOWN") ||
    (newDirection === "DOWN" && lastDirection === "UP");

  if (!isOpposite && direction !== newDirection) {
    direction = newDirection;
    canChangeDirection = false;
  }
});

// Initialize high scores display
updateHighScoresDisplay();