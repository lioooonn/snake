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
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Initialize theme from localStorage
if (isDarkMode) {
  document.body.setAttribute('data-theme', 'dark');
  document.getElementById('themeToggle').innerHTML = '<span class="icon">🌜</span>';
}

// Initialize high scores
let highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || {
  1: 0,
  2: 0,
  3: 0
};

// Set initial volume and start music
let currentVolume = localStorage.getItem('volume') || 0.5;
document.getElementById('volumeSlider').value = currentVolume;
musicTracks.forEach(track => track.volume = currentVolume);

// Start playing music when document is ready
document.addEventListener('DOMContentLoaded', function() {
  if (isMusicPlaying) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
  }
});

// Add color picker event listener
document.getElementById('colorPicker').addEventListener('change', function(e) {
  snakeColor = e.target.value;
});

// Movement queue system
let currentDirection = null;
let nextDirection = null;
let lastProcessedDirection = null;
let lastMoveTime = 0;

let gameSpeeds = {
  1: 100, // Normal speed (was 150)
  2: 70,  // Fast (was 100)
  3: 50   // Super fast (was 70)
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
function updateVolume(value) {
  currentVolume = value;
  localStorage.setItem('volume', value);
  musicTracks.forEach(track => track.volume = value);
}

function switchMusic(index) {
  currentMusic.pause();
  currentMusic.currentTime = 0;
  currentMusic = musicTracks[index];
  currentMusic.volume = currentVolume;
  if (isMusicPlaying) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
  }
}

function toggleMusic() {
  isMusicPlaying = !isMusicPlaying;
  const btn = document.getElementById("toggleMusic");
  if (isMusicPlaying) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
    btn.innerHTML = '<span class="icon">🎵</span>';
  } else {
    currentMusic.pause();
    btn.innerHTML = '<span class="icon">🔇</span>';
  }
}

// Theme toggle
function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('darkMode', isDarkMode);
  document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  document.getElementById('themeToggle').innerHTML = `<span class="icon">${isDarkMode ? '🌜' : '🌞'}</span>`;
  
  // Update snake color for better visibility in dark mode
  snakeColor = isDarkMode ? "#00ff00" : "#00cc00";
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
  currentDirection = "ArrowRight"; // Set initial direction
  nextDirection = "ArrowRight";    // Set initial next direction
  lastProcessedDirection = null;
  
  // Update display
  document.getElementById("currentLevel").textContent = currentLevel;
  document.getElementById("currentScore").textContent = score;
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
  
  // Immediate direction change if valid
  if (isValidNextDirection(currentDirection, key)) {
    nextDirection = key;
    // If enough time has passed since last move, apply immediately
    const now = Date.now();
    if (now - lastMoveTime >= gameSpeeds[currentLevel] * 0.5) {
      currentDirection = nextDirection;
    }
  }
}

function draw() {
  ctx.fillStyle = isDarkMode ? "#1a1a1a" : "#FFFFFF";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  // Draw checkerboard pattern
  ctx.fillStyle = isDarkMode ? "#2a2a2a" : "#F0F0F0";
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

  // Move snake
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
  if (newHead.x < -box/2 || newHead.x >= canvasSize + box/2 ||
      newHead.y < -box/2 || newHead.y >= canvasSize + box/2 ||
      collision(newHead, snake)) {
    clearInterval(gameInterval);
    gameOver();
    return;
  }

  // Eating food
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    document.getElementById("currentScore").textContent = score;
    createFood();
  } else {
    snake.pop();
  }

  snake.unshift(newHead);
}

function collision(head, array) {
  // Skip collision check with the tail piece that's about to be removed
  // This prevents false collisions when the snake is moving
  const checkArray = array.slice(0, -1);
  return checkArray.some(segment => segment.x === head.x && segment.y === head.y);
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
  document.getElementById("finalScore").textContent = score;
  document.getElementById("finalLevel").textContent = currentLevel;
  document.getElementById("levelHighScore").textContent = highScores[currentLevel];
}

function goHome() {
  clearInterval(gameInterval);
  document.getElementById("game-over-screen").classList.remove("active");
  document.getElementById("home-screen").classList.add("active");
  updateHighScoresDisplay();
}

function startGame() {
  if (isPlaying) return;
  
  isPlaying = true;
  currentLevel = parseInt(document.getElementById("levelSelect").value);
  init();
  
  // Hide all screens first
  document.getElementById("home-screen").classList.remove("active");
  document.getElementById("game-over-screen").classList.remove("active");
  document.getElementById("game-screen").classList.add("active");
  
  if (isMusicPlaying) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
  }
  
  gameInterval = setInterval(draw, gameSpeeds[currentLevel]);
}

// Initialize high scores display
updateHighScoresDisplay();