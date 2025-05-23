const VERSION = "v0.0.71 (PRE-ALPHA)";

// Global variables
let currentVolume = localStorage.getItem('volume') || 0.5;
let isMusicPlaying = true;
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let currentMusic = null;
let musicTracks = [];
let isPlaying = false;
let gameInterval = null;
let snake = [];
let food = null;
let score = 0;
let currentLevel = 1;
let snakeColor = "#00cc00";
let currentDirection = "ArrowRight";
let nextDirection = "ArrowRight";
let lastProcessedDirection = null;
let lastMoveTime = 0;
let isWaitingAtEdge = false;
let edgeWaitStartTime = 0;
const EDGE_WAIT_TIME = 25;
const canvasSize = 400;
const box = 20;

const gameSpeeds = {
  1: 130, // Normal speed
  2: 100, // Fast
  3: 80   // Super fast
};

// Initialize displays immediately
document.getElementById('version-display').textContent = VERSION;

// Screen management functions
function hideAllScreens() {
  document.getElementById("home-screen").classList.remove("active");
  document.getElementById("game-screen").classList.remove("active");
  document.getElementById("game-over-screen").classList.remove("active");
}

// Game utility functions
function isOnSnake(position) {
  return snake.some(segment => segment.x === position.x && segment.y === position.y);
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

function init() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  
  snake = [{
    x: Math.floor(canvasSize/(2*box)) * box,
    y: Math.floor(canvasSize/(2*box)) * box
  }];
  
  score = 0;
  currentDirection = "ArrowRight";
  nextDirection = "ArrowRight";
  lastProcessedDirection = null;
  isWaitingAtEdge = false;
  edgeWaitStartTime = 0;
  
  createFood();
  
  document.getElementById("currentLevel").textContent = currentLevel;
  document.getElementById("currentScore").textContent = score;
}

function drawSnakeAndFood(ctx) {
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
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  
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
  drawSnakeAndFood(ctx);
  
  // Process movement queue
  if (nextDirection && isValidNextDirection(currentDirection, nextDirection)) {
    currentDirection = nextDirection;
  }
  
  let newHead = {...snake[0]};
  
  // Calculate new head position
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
  const now = Date.now();
  if (newHead.x < 0 || newHead.x >= canvasSize || newHead.y < 0 || newHead.y >= canvasSize) {
    if (!isWaitingAtEdge) {
      isWaitingAtEdge = true;
      edgeWaitStartTime = now;
      return; // Skip this frame
    } else if (now - edgeWaitStartTime < EDGE_WAIT_TIME) {
      return; // Still waiting
    } else {
      // Time's up, game over
      clearInterval(gameInterval);
      gameInterval = null;
      gameOver();
      return;
    }
  }
  
  // Reset edge waiting if not at edge
  isWaitingAtEdge = false;

  // Check for collision with self
  if (collision(newHead, snake)) {
    clearInterval(gameInterval);
    gameInterval = null;
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
  lastMoveTime = now;
}

// Game functions
function startGame() {
  console.log("Starting game...");
  
  if (isPlaying) {
    console.log("Game already in progress");
    return;
  }
  
  currentLevel = parseInt(document.getElementById("levelSelect").value);
  console.log("Selected level:", currentLevel);
  
  init();
  isPlaying = true;
  
  hideAllScreens();
  document.getElementById("game-screen").classList.add("active");
  
  if (isMusicPlaying && currentMusic) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
  }
  
  document.removeEventListener("keydown", direction);
  document.addEventListener("keydown", direction);
  
  console.log("Starting game loop with speed:", gameSpeeds[currentLevel]);
  gameInterval = setInterval(draw, gameSpeeds[currentLevel]);
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

// Global functions
function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('darkMode', isDarkMode);
  document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  document.getElementById('themeToggle').innerHTML = `<span class="icon">${isDarkMode ? '🌜' : '🌞'}</span>`;
  
  // Update snake color for better visibility in dark mode
  if (typeof snakeColor !== 'undefined') {
    snakeColor = isDarkMode ? "#00ff00" : "#00cc00";
  }
}

function switchMusic(index) {
  if (index >= musicTracks.length || !musicTracks[index]) {
    console.log("Music track not available:", index);
    return;
  }
  
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }
  
  currentMusic = musicTracks[index];
  if (currentMusic) {
    currentMusic.volume = currentVolume;
    
    // Update the preview text
    const select = document.getElementById('musicSelect');
    if (select && select.options[index]) {
      const trackName = select.options[index].text;
      document.getElementById('currentTrackName').textContent = trackName;
    }
    
    if (isMusicPlaying) {
      currentMusic.play().catch(e => console.log("Audio playback failed:", e));
    }
  }
}

function toggleMusic() {
  isMusicPlaying = !isMusicPlaying;
  const btn = document.getElementById("toggleMusic");
  if (isMusicPlaying && currentMusic) {
    currentMusic.play().catch(e => console.log("Audio playback failed:", e));
    btn.innerHTML = '<span class="icon">🔊</span>';
  } else if (currentMusic) {
    currentMusic.pause();
    btn.innerHTML = '<span class="icon">🔇</span>';
  }
}

function updateVolume(value) {
  currentVolume = value;
  localStorage.setItem('volume', value);
  musicTracks.forEach(track => {
    if (track) {
      track.volume = value;
    }
  });
}

function updateHighScoresDisplay() {
  console.log('Updating high scores display');
  console.log('Local scores:', highScores);
  console.log('Global scores:', globalHighScores);

  const highScoresList = document.getElementById('highScoresList');
  if (highScoresList) {
    highScoresList.innerHTML = '';
    for (let level = 1; level <= 3; level++) {
      highScoresList.innerHTML += `
        <div class="high-score-entry">
          <span>Level ${level}</span>
          <span>${highScores[level]}</span>
        </div>`;
    }
  }

  const globalHighScoresList = document.getElementById('globalHighScoresList');
  if (globalHighScoresList) {
    globalHighScoresList.innerHTML = '';
    for (let level = 1; level <= 3; level++) {
      const data = globalHighScores[level] || { score: 0, player: 'None' };
      globalHighScoresList.innerHTML += `
        <div class="global-score-entry">
          <span>Level ${level}</span>
          <span><span class="player-name">${data.player}</span>: ${data.score}</span>
        </div>`;
    }
  }
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

function gameOver() {
  isPlaying = false;
  
  // Clear the game interval
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  
  // Remove keyboard listener
  document.removeEventListener("keydown", direction);
  
  // Check and update local high score
  if (score > highScores[currentLevel]) {
    highScores[currentLevel] = score;
    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    
    // Try to update global high score
    updateGlobalHighScore(currentLevel, score);
  }
  
  // Update displays
  updateHighScoresDisplay();
  
  // Switch to game over screen
  hideAllScreens();
  document.getElementById("game-over-screen").classList.add("active");
  document.getElementById("finalScore").textContent = score;
  document.getElementById("finalLevel").textContent = currentLevel;
  document.getElementById("levelHighScore").textContent = highScores[currentLevel];
}

// Global high score functions
async function updateGlobalHighScore(level, score) {
  if (!window.firebaseInitialized) {
    console.log('Firebase not initialized, skipping global high score update');
    return;
  }

  try {
    const currentHighScore = globalHighScores[level]?.score || 0;
    if (score > currentHighScore) {
      console.log(`New global high score for level ${level}: ${score}`);
      await window.globalHighScoresRef.child(level).set({
        score: score,
        player: playerName,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Update local copy immediately
      globalHighScores[level] = {
        score: score,
        player: playerName
      };
      updateHighScoresDisplay();
    }
  } catch (error) {
    console.error('Error updating global high score:', error);
  }
}

// Game control functions
function goHome() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  hideAllScreens();
  document.getElementById("home-screen").classList.add("active");
  updateHighScoresDisplay();
}

function playAgain() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  startGame();
}

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  
  // Initialize displays
  document.getElementById('version-display').textContent = VERSION;
  document.getElementById('playerNameDisplay').textContent = playerName;
  
  // Get all music elements and store them in the global musicTracks array
  musicTracks = [
    document.getElementById("gameMusic"),
    document.getElementById("gameMusic2"),
    document.getElementById("gameMusic3"),
    document.getElementById("gameMusic4")
  ];
  currentMusic = musicTracks[0];

  // Set initial volume
  document.getElementById('volumeSlider').value = currentVolume;
  musicTracks.forEach(track => {
    if (track) {
      track.volume = currentVolume;
    }
  });

  // Initialize theme
  if (isDarkMode) {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('themeToggle').innerHTML = '<span class="icon">🌜</span>';
  }

  // Set up event listeners
  document.getElementById('playButton').addEventListener('click', startGame);
  document.getElementById('volumeSlider').addEventListener('change', (e) => updateVolume(e.target.value));
  document.getElementById('musicSelect').addEventListener('change', (e) => switchMusic(e.target.value - 1));
  document.getElementById('toggleMusic').addEventListener('click', toggleMusic);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('homeButton').addEventListener('click', goHome);
  document.getElementById('playAgainButton').addEventListener('click', playAgain);

  // Wait for Firebase to initialize
  if (window.firebaseInitialized) {
    console.log('Firebase was initialized before script.js loaded');
  } else {
    console.log('Waiting for Firebase initialization...');
  }

  // Listen for global high score updates
  window.addEventListener('globalHighScoresUpdated', (event) => {
    console.log('Updating global high scores:', event.detail);
    if (event.detail) {
      globalHighScores = event.detail;
      updateHighScoresDisplay();
    }
  });

  // Start playing music immediately when window loads
  window.addEventListener('load', function() {
    // Initialize music
    if (currentMusic) {
      currentMusic.volume = currentVolume;
      currentMusic.play().catch(e => console.log("Audio playback failed:", e));
    }
    updateHighScoresDisplay();
  });

  // Add color picker event listener
  document.getElementById('colorPicker').addEventListener('change', function(e) {
    snakeColor = e.target.value;
  });

  // Movement queue system
  let currentDirection = null;
  let nextDirection = null;

  // Add function to generate new random name
  function regeneratePlayerName() {
    playerName = generateRandomName();
    localStorage.setItem('playerName', playerName);
    document.getElementById('playerNameDisplay').textContent = playerName;
  }
});