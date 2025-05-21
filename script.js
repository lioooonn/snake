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

let snake, food, score, gameInterval, isPlaying = false;
let snakeColor = "#00cc00"; // Default color
let currentLevel = 1;
let currentMusic = musicTracks[0];
let isMusicPlaying = true;

// Movement queue system
let currentDirection = null;
let nextDirection = null;
let lastProcessedDirection = null;

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

// Music controls
function switchMusic(index) {
  currentMusic.pause();
  currentMusic.currentTime = 0;
  currentMusic = musicTracks[index];
  if (isMusicPlaying) {
    currentMusic.play();
  }
}

function toggleMusic() {
  isMusicPlaying = !isMusicPlaying;
  if (isMusicPlaying) {
    currentMusic.play();
  } else {
    currentMusic.pause();
  }
}

// Game initialization
function init() {
  snake = [];
  snake[0] = {
    x: Math.floor(canvasSize/(2*box)) * box,
    y: Math.floor(canvasSize/(2*box)) * box
  };
  
  createFood();
  score = 0;
  currentDirection = null;
  nextDirection = null;
  lastProcessedDirection = null;
}

function createFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * (canvasSize/box)) * box,
      y: Math.floor(Math.random() * (canvasSize/box)) * box
    };
  } while (isOnSnake(newFood));
  
  food = newFood;
}

function isOnSnake(position) {
  return snake.some(segment => segment.x === position.x && segment.y === position.y);
}

// Direction validation
function isValidNextDirection(current, next) {
  if (!current) return true;
  
  const opposites = {
    'ArrowUp': 'ArrowDown',
    'ArrowDown': 'ArrowUp',
    'ArrowLeft': 'ArrowRight',
    'ArrowRight': 'ArrowLeft'
  };
  
  return next !== opposites[current];
}

// Event listeners
document.addEventListener("keydown", direction);

function direction(event) {
  const key = event.key;
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
  
  event.preventDefault();
  
  // Only update nextDirection if it's a valid move
  if (isValidNextDirection(currentDirection, key)) {
    nextDirection = key;
  }
}

function draw() {
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  // Draw checkerboard pattern
  ctx.fillStyle = "#F0F0F0";
  for (let i = 0; i < canvasSize/box; i++) {
    for (let j = 0; j < canvasSize/box; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * box, j * box, box, box);
      }
    }
  }

  // Draw snake with smooth corners
  for (let i = 0; i < snake.length; i++) {
    ctx.beginPath();
    ctx.arc(snake[i].x + box/2, snake[i].y + box/2, box/2 - 2, 0, 2 * Math.PI);
    ctx.fillStyle = snakeColor;
    ctx.fill();
    
    // Connect segments with rectangles for smoother appearance
    if (i > 0) {
      const curr = snake[i];
      const prev = snake[i-1];
      ctx.fillStyle = snakeColor;
      if (curr.x === prev.x) {
        const y = Math.min(curr.y, prev.y);
        ctx.fillRect(curr.x + 2, y + box/2, box - 4, box);
      } else {
        const x = Math.min(curr.x, prev.x);
        ctx.fillRect(x + box/2, curr.y + 2, box, box - 4);
      }
    }
  }

  // Draw food as a smooth circle
  ctx.beginPath();
  ctx.arc(food.x + box/2, food.y + box/2, box/2 - 2, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
  
  // Process movement queue
  if (nextDirection && isValidNextDirection(currentDirection, nextDirection)) {
    currentDirection = nextDirection;
  }
  
  let newHead = {...snake[0]};

  switch(currentDirection) {
    case "ArrowLeft":
      newHead.x -= box;
      break;
    case "ArrowUp":
      newHead.y -= box;
      break;
    case "ArrowRight":
      newHead.x += box;
      break;
    case "ArrowDown":
      newHead.y += box;
      break;
  }

  // Game over conditions
  if (newHead.x < 0 || newHead.x >= canvasSize ||
      newHead.y < 0 || newHead.y >= canvasSize ||
      collision(newHead, snake)) {
    clearInterval(gameInterval);
    gameOver();
    return;
  }

  // Eating food
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    createFood();
  } else {
    snake.pop();
  }

  snake.unshift(newHead);
  document.getElementById("score").textContent = score;
}

function collision(head, array) {
  return array.some(segment => segment.x === head.x && segment.y === head.y);
}

function gameOver() {
  isPlaying = false;
  if (score > highScores[currentLevel]) {
    highScores[currentLevel] = score;
    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    updateHighScoresDisplay();
  }
  document.getElementById("game-screen").classList.remove("active");
  document.getElementById("game-over-screen").classList.add("active");
  document.getElementById("final-score").textContent = score;
}

function startGame() {
  if (isPlaying) return;
  
  isPlaying = true;
  currentLevel = parseInt(document.getElementById("levelSelect").value);
  init();
  
  document.getElementById("home-screen").classList.remove("active");
  document.getElementById("game-screen").classList.add("active");
  
  if (isMusicPlaying) {
    currentMusic.play();
  }
  
  gameInterval = setInterval(draw, gameSpeeds[currentLevel]);
}

// Initialize high scores display
updateHighScoresDisplay();