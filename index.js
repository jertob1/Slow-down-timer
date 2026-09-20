// index.js

// --- 1. State Variables ---
// We need these to keep track of our audio system across different button clicks.
let audioCtx = null;             // The "engine" for Web Audio
let decodedAudioBuffer = null;   // The fully downloaded and decoded song in memory
let activeSourceNode = null;     // The currently playing audio player source

// --- 2. Select HTML Elements ---
const urlInput = document.getElementById('youtube-url');
const loadButton = document.getElementById('load-btn');
const playButton = document.getElementById('play-btn');
const stopButton = document.getElementById('stop-btn');
const statusText = document.getElementById('status');

// --- 3. Event Listener: LOAD AUDIO ---
loadButton.addEventListener('click', () => {
    const youtubeUrl = urlInput.value.trim();

    if (!youtubeUrl) {
        alert('Please enter a YouTube URL first!');
        return;
    }

    // Modern browsers require a user action (like a click) to start/unlock the AudioContext.
    // If it doesn't exist yet, we create it now.
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Disable buttons and update status so the user knows we are working
    loadButton.disabled = true;
    playButton.disabled = true;
    stopButton.disabled = true;
    statusText.innerText = "Status: Downloading audio from YouTube... (This may take a moment)";

    // Construct the backend URL (making sure special characters are safe with encodeURIComponent)
    const backendStreamUrl = `/api/audio?url=${encodeURIComponent(youtubeUrl)}`;

    console.log('Fetching audio via fetch():', backendStreamUrl);

    // STEP A: Fetch the raw audio stream from our backend
    fetch(backendStreamUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned error: ${response.statusText}`);
            }
            // Instead of .json() or .text(), we use .arrayBuffer() to get raw binary data bytes
            return response.arrayBuffer();
        })
        .then(rawBinaryData => {
            statusText.innerText = "Status: Decoding audio into memory... (Converting to playable audio)";
            
            // STEP B: Decode the binary MP3 bytes into raw uncompressed PCM audio channels in memory.
            // This returns an AudioBuffer object.
            return audioCtx.decodeAudioData(rawBinaryData);
        })
        .then(audioBuffer => {
            // STEP C: Save the decoded audio buffer into our global variable so we can play it later
            decodedAudioBuffer = audioBuffer;

            // Re-enable controls and update status
            loadButton.disabled = false;
            playButton.disabled = false; // The user can now click Play!
            statusText.innerText = "Status: Audio loaded successfully! Ready to play.";
            console.log('Audio successfully loaded into memory:', decodedAudioBuffer);
        })
        .catch(error => {
            console.error('Error fetching or decoding audio:', error);
            statusText.innerText = `Status: Error loading audio. Details: ${error.message}`;
            loadButton.disabled = false;
        });
});

// --- 4. Event Listener: PLAY AUDIO ---
playButton.addEventListener('click', () => {
    // Safety: If there is already audio playing, stop it first to prevent overlapping sound
    if (activeSourceNode) {
        activeSourceNode.stop();
    }

    // In Web Audio API, an AudioBufferSourceNode is "one-use only". 
    // You cannot replay an existing node once it has stopped or played.
    // So, every time the user clicks "Play", we must create a fresh, new source node.
    const sourceNode = audioCtx.createBufferSource();

    // Attach our pre-loaded song buffer to this source node
    sourceNode.buffer = decodedAudioBuffer;

    // Connect this source node directly to our speakers (destination)
    sourceNode.connect(audioCtx.destination);

    // Save this source node globally so we can stop it if the user clicks "Stop"
    activeSourceNode = sourceNode;

    // Start playing the audio immediately (at 0 seconds delay)
    sourceNode.start(0);

    statusText.innerText = "Status: Playing audio...";
    playButton.disabled = true;
    stopButton.disabled = false;

    // Listen for when the audio finishes playing naturally
    sourceNode.onended = () => {
        // Reset buttons only if this is still the active playing source
        if (activeSourceNode === sourceNode) {
            statusText.innerText = "Status: Playback finished.";
            playButton.disabled = false;
            stopButton.disabled = true;
            activeSourceNode = null;
        }
    };
});

// --- 5. Event Listener: STOP AUDIO ---
stopButton.addEventListener('click', () => {
    if (activeSourceNode) {
        activeSourceNode.stop(); // Stop the audio playback
        activeSourceNode = null;
    }
    
    statusText.innerText = "Status: Playback stopped.";
    playButton.disabled = false;
    stopButton.disabled = true;
});
