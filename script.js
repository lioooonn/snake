const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameMusic = document.getElementById("gameMusic");

const canvasSize = 400;
const box = 20;

let snake, food, direction, score, gameInterval, isPlaying = false;
let snakeColor = "#00cc00"; // Default color
let currentLevel = 1;
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

// Update high scores display
function updateHighScoresDisplay() {
  const highScoresList = document.getElementById('highScoresList');
  highScoresList.innerHTML = '';
  for (let level in highScores) {
    highScoresList.innerHTML += `<div>Level ${level}: ${highScores[level]}</div>`;
  }
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
  gameMusic.pause();
  gameMusic.currentTime = 0;
  showScreen("home-screen");
  updateHighScoresDisplay();
}

// Start or restart the game
function startGame() {
  currentLevel = parseInt(document.getElementById("levelSelect").value);
  snakeColor = document.getElementById("colorPicker").value;
  snake = [{ x: 160, y: 160 }];
  direction = "RIGHT";
  score = 0;
  isPlaying = true;

  // Update display
  document.getElementById("currentLevel").textContent = currentLevel;
  document.getElementById("currentScore").textContent = score;

  food = {
    x: Math.floor(Math.random() * (canvasSize / box)) * box,
    y: Math.floor(Math.random() * (canvasSize / box)) * box
  };

  // Start music
  gameMusic.play().catch(e => console.log("Audio playback failed:", e));

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
  for (let segment of snake) {
    ctx.fillRect(segment.x, segment.y, box, box);
  }

  // Move snake
  const head = { ...snake[0] };
  if (direction === "LEFT") head.x -= box;
  if (direction === "UP") head.y -= box;
  if (direction === "RIGHT") head.x += box;
  if (direction === "DOWN") head.y += box;

  // Check collisions
  if (
    head.x < 0 || head.x >= canvasSize || head.y < 0 || head.y >= canvasSize ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    isPlaying = false;
    clearInterval(gameInterval);
    gameMusic.pause();
    gameMusic.currentTime = 0;

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
    food = {
      x: Math.floor(Math.random() * (canvasSize / box)) * box,
      y: Math.floor(Math.random() * (canvasSize / box)) * box
    };
  } else {
    snake.pop();
  }

  // Draw food
  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);
}

// Keyboard controls
document.addEventListener("keydown", e => {
  const key = e.key;
  if (key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (key === "ArrowDown" && direction !== "UP") direction = "DOWN";
});

// Initialize high scores display
updateHighScoresDisplay();