const VERSION = "0.0.56 (PRE-ALPHA)";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Initialize displays immediately
document.getElementById('version-display').textContent = VERSION;

// Random name generation
const adjectives = ['Swift', 'Sneaky', 'Slithery', 'Speedy', 'Smooth', 'Silent', 'Stealthy', 'Skilled'];
const nouns = ['Snake', 'Serpent', 'Viper', 'Python', 'Cobra', 'Mamba', 'Asp', 'Boa'];

function generateRandomName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${number}`;
}

// Initialize player name immediately
let playerName = localStorage.getItem('playerName');
if (!playerName) {
  playerName = generateRandomName();
  localStorage.setItem('playerName', playerName);
}
document.getElementById('playerNameDisplay').textContent = playerName;

// Get all music elements
const musicTracks = [
  document.getElementById("gameMusic"),
  document.getElementById("gameMusic2"),
  document.getElementById("gameMusic3"),
  document.getElementById("gameMusic4"),
  document.getElementById("gameMusic5"),
  document.getElementById("gameMusic6"),
  document.getElementById("gameMusic7"),
  document.getElementById("gameMusic8"),
  document.getElementById("gameMusic9"),
  document.getElementById("gameMusic10"),
  document.getElementById("gameMusic11"),
  document.getElementById("gameMusic12")
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

// Initialize global high scores
let globalHighScores = {
  1: { score: 0, player: 'None' },
  2: { score: 0, player: 'None' },
  3: { score: 0, player: 'None' }
};

// Listen for global high score updates
globalHighScoresRef.on('value', (snapshot) => {
  const scores = snapshot.val();
  if (scores) {
    globalHighScores = scores;
    updateGlobalHighScoresDisplay();
  }
});

// Set initial volume and start music
let currentVolume = localStorage.getItem('volume') || 0.5;
document.getElementById('volumeSlider').value = currentVolume;
musicTracks.forEach(track => track.volume = currentVolume);

// Start playing music immediately when window loads
window.addEventListener('load', function() {
  // Initialize music
  currentMusic.volume = currentVolume;
  currentMusic.play().catch(e => console.log("Audio playback failed:", e));
  updateHighScoresDisplay();
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
let isWaitingAtEdge = false;
let edgeWaitStartTime = 0;
const EDGE_WAIT_TIME = 25; // Reduced to 50ms

let gameSpeeds = {
  1: 130, // Normal speed (was 100)
  2: 100, // Fast (was 70)
  3: 80   // Super fast (was 50)
};

// Update high scores display
function updateHighScoresDisplay() {
  // Update local high scores
  const highScoresList = document.getElementById('highScoresList');
  if (!highScoresList) return;
  
  highScoresList.innerHTML = '';
  Object.entries(highScores).forEach(([level, score]) => {
    highScoresList.innerHTML += `
      <div class="high-score-entry">
        <span>Level ${level}</span>
        <span>${score}</span>
      </div>`;
  });
  
  // Update global high scores
  updateGlobalHighScoresDisplay();
}

function updateGlobalHighScoresDisplay() {
  const globalHighScoresList = document.getElementById('globalHighScoresList');
  if (!globalHighScoresList) return;
  
  globalHighScoresList.innerHTML = '';
  Object.entries(globalHighScores).forEach(([level, data]) => {
    globalHighScoresList.innerHTML += `
      <div class="global-score-entry">
        <span>Level ${level}</span>
        <span><span class="player-name">${data.player}</span>: ${data.score}</span>
      </div>`;
  });
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
  
  // Update the preview text
  const select1 = document.getElementById('musicSelect');
  const select2 = document.getElementById('musicSelect2');
  let trackName;
  
  if (index < 8) {
    trackName = select1.options[index].text;
  } else {
    trackName = select2.options[index - 8].text;
  }
  
  document.getElementById('currentTrackName').textContent = trackName;
  
  if (isMusicPlaying) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
  }
}

function toggleMusic() {
  isMusicPlaying = !isMusicPlaying;
  const btn = document.getElementById("toggleMusic");
  if (isMusicPlaying) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
    btn.innerHTML = '<span class="icon">🔊</span>';
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
  currentDirection = "ArrowRight";
  nextDirection = "ArrowRight";
  lastProcessedDirection = null;
  isWaitingAtEdge = false;
  edgeWaitStartTime = 0;
  
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
  
  if (isValidNextDirection(currentDirection, key) && !isOppositeDirection(lastProcessedDirection, key)) {
    nextDirection = key;
    const now = Date.now();
    if (now - lastMoveTime >= gameSpeeds[currentLevel] * 0.5) {
      currentDirection = nextDirection;
    }
  }
}

function isOppositeDirection(dir1, dir2) {
  if (!dir1 || !dir2) return false;
  return (
    (dir1 === 'ArrowUp' && dir2 === 'ArrowDown') ||
    (dir1 === 'ArrowDown' && dir2 === 'ArrowUp') ||
    (dir1 === 'ArrowLeft' && dir2 === 'ArrowRight') ||
    (dir1 === 'ArrowRight' && dir2 === 'ArrowLeft')
  );
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

  // Draw snake and food
  drawSnakeAndFood();
  
  // Process movement queue
  if (nextDirection && isValidNextDirection(currentDirection, nextDirection)) {
    currentDirection = nextDirection;
  }
  
  let newHead = {...snake[0]};
  
  // Move snake based on direction
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
  
  // Check for collisions with walls
  if (newHead.x < 0 || newHead.x >= canvasSize || newHead.y < 0 || newHead.y >= canvasSize) {
    clearInterval(gameInterval);
    gameOver();
    return;
  }
  
  // Check for collision with self
  if (collision(newHead, snake)) {
    clearInterval(gameInterval);
    gameOver();
    return;
  }
  
  // Update score and create new food if snake eats food
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    document.getElementById("currentScore").textContent = score;
    createFood();
  } else {
    snake.pop();
  }
  
  snake.unshift(newHead);
  lastProcessedDirection = currentDirection;
  lastMoveTime = Date.now();
}

// Helper function to draw snake and food
function drawSnakeAndFood() {
  // Draw snake with smooth corners
  for (let i = 0; i < snake.length; i++) {
    ctx.beginPath();
    ctx.arc(snake[i].x + box/2, snake[i].y + box/2, box/2 - 2, 0, 2 * Math.PI);
    ctx.fillStyle = snakeColor;
    ctx.fill();
    
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
}

function collision(head, array) {
  // Skip collision check with the tail piece that's about to be removed
  // This prevents false collisions when the snake is moving
  const checkArray = array.slice(0, -1);
  return checkArray.some(segment => segment.x === head.x && segment.y === head.y);
}

function hideAllScreens() {
  document.getElementById("home-screen").classList.remove("active");
  document.getElementById("game-screen").classList.remove("active");
  document.getElementById("game-over-screen").classList.remove("active");
}

// Game start function
function startGame() {
  console.log("Starting game..."); // Debug log
  
  if (isPlaying) {
    console.log("Game already in progress"); // Debug log
    return;
  }
  
  isPlaying = true;
  currentLevel = parseInt(document.getElementById("levelSelect").value);
  
  // Initialize game state
  init();
  
  // Hide all screens and show game screen
  hideAllScreens();
  document.getElementById("game-screen").classList.add("active");
  
  // Start music if enabled
  if (isMusicPlaying) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
  }
  
  // Remove any existing event listeners
  document.removeEventListener("keydown", direction);
  
  // Add keyboard controls
  document.addEventListener("keydown", direction);
  
  // Start game loop
  console.log("Starting game loop with speed:", gameSpeeds[currentLevel]); // Debug log
  gameInterval = setInterval(draw, gameSpeeds[currentLevel]);
}

// Ensure play button is properly connected
document.addEventListener('DOMContentLoaded', function() {
  const playButton = document.querySelector('.play-button');
  if (playButton) {
    playButton.addEventListener('click', function() {
      console.log("Play button clicked"); // Debug log
      startGame();
    });
  }
});

function gameOver() {
  isPlaying = false;
  
  // Check and update local high score
  if (score > highScores[currentLevel]) {
    highScores[currentLevel] = score;
    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    
    // Check and update global high score
    if (!globalHighScores[currentLevel] || score > globalHighScores[currentLevel].score) {
      globalHighScoresRef.child(currentLevel).set({
        score: score,
        player: playerName,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
    }
  }
  
  updateHighScoresDisplay();
  hideAllScreens();
  document.getElementById("game-over-screen").classList.add("active");
  document.getElementById("finalScore").textContent = score;
  document.getElementById("finalLevel").textContent = currentLevel;
  document.getElementById("levelHighScore").textContent = highScores[currentLevel];
}

function goHome() {
  clearInterval(gameInterval);
  hideAllScreens();
  document.getElementById("home-screen").classList.add("active");
  updateHighScoresDisplay();
}

// Add function to generate new random name
function regeneratePlayerName() {
  playerName = generateRandomName();
  localStorage.setItem('playerName', playerName);
  document.getElementById('playerNameDisplay').textContent = playerName;
}