const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
const canvasSize = 400;
let snake, direction, food, score, snakeColor;

document.addEventListener("keydown", changeDirection);

function goHome() {
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("home-screen").style.display = "block";
}

function startGame() {
  // Get selected color
  snakeColor = document.getElementById("colorPicker").value;

  // Initialize game state
  snake = [{ x: 160, y: 160 }];
  direction = "RIGHT";
  score = 0;
  food = {
    x: Math.floor(Math.random() * (canvasSize / box)) * box,
    y: Math.floor(Math.random() * (canvasSize / box)) * box
  };

  // Show game, hide other screens
  document.getElementById("home-screen").style.display = "none";
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";

  clearInterval(gameInterval);
  gameInterval = setInterval(draw, 150);
}

function changeDirection(e) {
  if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
}

let gameInterval;

function draw() {
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? snakeColor : "lightgreen";
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);

  let head = { x: snake[0].x, y: snake[0].y };

  if (direction === "LEFT") head.x -= box;
  else if (direction === "UP") head.y -= box;
  else if (direction === "RIGHT") head.x += box;
  else if (direction === "DOWN") head.y += box;

  // Game over condition
  if (
    head.x < 0 || head.y < 0 ||
    head.x >= canvasSize || head.y >= canvasSize ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    clearInterval(gameInterval);
    document.getElementById("finalScore").innerText = score;
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("game-over-screen").style.display = "block";
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    food = {
      x: Math.floor(Math.random() * (canvasSize / box)) * box,
      y: Math.floor(Math.random() * (canvasSize / box)) * box
    };
  } else {
    snake.pop();
  }
}
