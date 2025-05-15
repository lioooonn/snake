const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
const canvasSize = 400;

let snake = [];
let direction = "";
let food;
let score = 0;
let snakeColor = "#00cc00";
let gameInterval = null;
let isPlaying = false;

document.addEventListener("keydown", changeDirection);

function goHome() {
  clearInterval(gameInterval);
  gameInterval = null;
  isPlaying = false;

  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("home-screen").style.display = "block";
}

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

  document.getElementById("home-screen").style.display = "none";
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";

  clearInterval(gameInterval);
  gameInterval = setInterval(draw, 150);
}

function changeDirection(e) {
  if (!isPlaying) return;

  if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
}

function draw() {
  if (!isPlaying) return; // Prevent draw from doing anything if not playing

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

  // Game over check
  if (
    head.x < 0 || head.y < 0 ||
    head.x >= canvasSize || head.y >= canvasSize ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    clearInterval(gameInterval);
    gameInterval = null;
    isPlaying = false;

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

