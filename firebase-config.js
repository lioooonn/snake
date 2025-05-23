// Firebase configuration and initialization
const initializeFirebase = () => {
  try {
    console.log('Attempting to initialize Firebase...');
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      console.log('No existing Firebase app found, initializing new one...');
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
      console.log('Firebase app initialized successfully');
    } else {
      console.log('Firebase app already initialized');
    }

    const database = firebase.database();
    const globalHighScoresRef = database.ref('globalHighScores');

    // Test database connection
    database.ref('.info/connected').on('value', (snap) => {
      if (snap.val() === true) {
        console.log('Connected to Firebase database');
      } else {
        console.log('Not connected to Firebase database');
      }
    });

    // Set up real-time listener for high scores
    globalHighScoresRef.on('value', (snapshot) => {
      const data = snapshot.val();
      console.log('Received new high scores from Firebase:', data);
      window.dispatchEvent(new CustomEvent('globalHighScoresUpdated', {
        detail: data
      }));
    }, (error) => {
      console.error('Error receiving high scores:', error);
    });

    // Export for use in other files
    window.globalHighScoresRef = globalHighScoresRef;
    console.log('Firebase setup complete');
    
    return true;

  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Initialize empty global scores if Firebase fails
    window.globalHighScoresRef = {
      on: () => {},
      child: () => ({ set: () => {} })
    };
    return false;
  }
};

// Initialize Firebase and export the result
window.firebaseInitialized = initializeFirebase(); 