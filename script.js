const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasSize = 400;
const box = 20;

let snake, food, direction, score, gameInterval, isPlaying = false;
let snakeColor = "#00cc00"; // Default color

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
}

// Start or restart the game
function startGame() {
  snakeColor = document.getElementById("colorPicker").value;
  snake = [{ x: 160, y: 160 }];
  direction = "RIGHT";
  score = 0;
  isPlaying = true;

  food = {
    x: Math.floor(Math.random() * (canvasSize / box)) * box,
    y: Math.floor(Math.random() * (canvasSize / box)) * box
  };

  clearInterval(gameInterval);
  gameInterval = setInterval(draw, 150);
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
    document.getElementById("finalScore").innerText = score;
    showScreen("game-over-screen");
    return;
  }

  snake.unshift(head);

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
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
