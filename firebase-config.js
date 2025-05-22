// Firebase configuration and initialization
try {
  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: "AIzaSyCJ9d-6Ch4FBAgNsbTVLf0_18bm7Nv0kng",
        authDomain: "snek-global.firebaseapp.com",
        databaseURL: "https://snek-global-default-rtdb.firebaseio.com",
        projectId: "snek-global",
        storageBucket: "snek-global.firebasestorage.app",
        messagingSenderId: "498490615212",
        appId: "1:498490615212:web:1a7c45bc8b960823a38609",
        measurementId: "G-5WPD2ZH5X9"
    });
  }

  const database = firebase.database();
  const globalHighScoresRef = database.ref('globalHighScores');

  // Set up real-time listener for high scores
  globalHighScoresRef.on('value', (snapshot) => {
    console.log('Received new high scores:', snapshot.val());
    window.dispatchEvent(new CustomEvent('globalHighScoresUpdated', {
      detail: snapshot.val()
    }));
  });

  // Export for use in other files
  window.globalHighScoresRef = globalHighScoresRef;

} catch (error) {
  console.error('Firebase initialization error:', error);
  // Initialize empty global scores if Firebase fails
  window.globalHighScoresRef = {
    on: () => {},
    child: () => ({ set: () => {} })
  };
} 