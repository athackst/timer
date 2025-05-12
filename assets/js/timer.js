document.addEventListener("DOMContentLoaded", function () {
    console.log("Initializing timer script...");

    // Cached DOM elements for efficiency
    const timerButton = document.getElementById('timerButton');
    const resetButton = document.getElementById('resetButton');
    const workTimeInput = document.getElementById('workTime');
    const restTimeInput = document.getElementById('restTime');
    const warmupTimeInput = document.getElementById('warmupTime');
    const cooldownTimeInput = document.getElementById('cooldownTime');
    const roundsInput = document.getElementById('rounds');
    const phaseLabel = document.getElementById('phaseLabel');
    const totalTimeDisplay = document.getElementById('totalTime');
    const workTimeDisplay = document.getElementById('totalWorkTime');
    const timerRing = document.getElementById('timerRing');

    let interval;
    let isPaused = true;
    let isFinished = true;
    let currentPhase = 'work';
    let currentRound = 1;
    let warmupTime, workTime, restTime, cooldownTime, totalRounds;
    let timeLeft, totalTime;
    const ringCircumference = 2 * Math.PI * 45;

    /** Attach event listeners */
    timerButton.addEventListener("click", toggleTimer);
    resetButton.addEventListener("click", resetTimer);

    [workTimeInput, restTimeInput, warmupTimeInput, cooldownTimeInput].forEach(input => {
        input.addEventListener("input", () => formatMicrowaveTime(input));
        input.addEventListener("blur", () => {
            displayFormattedTime(input);
            calculateTotalTime();
        });
        input.addEventListener("focus", function () {
            this.select();
        });
        input.addEventListener("click", function () {
            this.setSelectionRange(0, this.value.length);
        });
    });

    roundsInput.addEventListener("input", () => totalRounds = parseInt(roundsInput.value) || 1);
    roundsInput.addEventListener("blur", calculateTotalTime);
    roundsInput.addEventListener("focus", function () {
        this.select();
    });
    roundsInput.addEventListener("click", function () {
        this.setSelectionRange(0, this.value.length);
    });

    /** Convert microwave-style input to seconds */
    function formatMicrowaveTime(inputField) {
        let rawValue = inputField.value.replace(/\D/g, "");
        if (!rawValue) return;

        let seconds = parseInt(rawValue) || 0;
        let minutes = Math.floor(seconds / 100);
        let remainingSeconds = seconds % 100;

        if (remainingSeconds >= 60) {
            minutes += Math.floor(remainingSeconds / 60);
            remainingSeconds %= 60;
        }

        inputField.dataset.seconds = (minutes * 60 + remainingSeconds);
    }

    /** Display time in MM:SS format */
    function displayFormattedTime(inputField) {
        let totalSeconds = parseInt(inputField.dataset.seconds) || parseTime(inputField.value);
        if (isNaN(totalSeconds) || totalSeconds < 0) return;

        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        inputField.value = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /** Convert MM:SS to total seconds */
    function parseTime(input) {
        let [minutes, seconds] = input.split(':').map(num => parseInt(num) || 0);
        minutes = minutes || 0;
        seconds = seconds || 0;
        return minutes * 60 + seconds;
    }

    /** Calculate total workout time */
    function calculateTotalTime() {
        warmupTime = parseInt(warmupTimeInput.dataset.seconds) || parseTime(warmupTimeInput.value);
        workTime = parseInt(workTimeInput.dataset.seconds) || parseTime(workTimeInput.value);
        restTime = parseInt(restTimeInput.dataset.seconds) || parseTime(restTimeInput.value);
        cooldownTime = parseInt(cooldownTimeInput.dataset.seconds) || parseTime(cooldownTimeInput.value);
        totalRounds = parseInt(roundsInput.value) || 1;

        const totalWorkTime = (workTime + restTime) * totalRounds;
        const fullSessionTime = warmupTime + totalWorkTime + cooldownTime;
        totalTimeDisplay.innerText = `Total Session Time: ${Math.floor(fullSessionTime / 60)}m ${fullSessionTime % 60}s`;
        workTimeDisplay.innerText = `Total Work Time: ${Math.floor(totalWorkTime / 60)}m ${totalWorkTime % 60}s`
    }

    /** Toggle timer start/pause */
    function toggleTimer() {
        if (isPaused) {
            if (isFinished) startTimer();
            else resumeTimer();
            timerButton.innerText = "Pause Timer";
        } else {
            pauseTimer();
            timerButton.innerText = "Resume Timer";
        }
    }

    /** Start workout timer */
    function startTimer() {
        currentRound = 1;
        currentPhase = 'warmup';
        isFinished = false;
        clearInterval(interval);
        startPhase(warmupTime);
    }

    /** Start a new phase (work or rest) */
    function startPhase(duration) {
        timeLeft = duration;
        totalTime = duration;
        playSound();
        resumeTimer();
    }

    /** Resume countdown */
    function resumeTimer() {
        isPaused = false;
        clearInterval(interval);
        interval = setInterval(() => {
            timeLeft--;
            updateUI();

            if (timeLeft <= 0) {
                clearInterval(interval);
                switchPhase();
            }
        }, 1000);
    }

    /** Pause countdown */
    function pauseTimer() {
        isPaused = true;
        clearInterval(interval);
    }

    /** Reset timer to initial state */
    function resetTimer() {
        isFinished = true;
        isPaused = true;
        currentRound = 1;
        currentPhase = 'ready';
        timeLeft = 0;
        clearInterval(interval);

        updateUI();
        timerButton.innerText = "Start Timer";
    }

    /** Switch between work and rest phases */
    function switchPhase() {
        if (currentPhase === 'warmup') {
            currentPhase = 'work';
            startPhase(workTime);
        } else if (currentPhase === 'work') {
            currentPhase = 'rest';
            startPhase(restTime);
        } else if (currentPhase === 'rest') {
            currentRound++;
            if (currentRound > totalRounds) {
                currentPhase = 'cooldown';
                startPhase(cooldownTime);
            } else {
                currentPhase = 'work';
                startPhase(workTime);
            }
        } else if (currentPhase === 'cooldown') {
            currentPhase = 'ready';
            endSession();
        }
    }

    /** End session and reset UI */
    function endSession() {
        isFinished = true;
        isPaused = true;
        playSound();
        updateUI();
        timerButton.innerText = "Start Timer";
        phaseLabel.innerText = 'Session Complete!';
    }

    /** Update UI elements */
    function updateUI() {
        updateTimerRing();
        updatePhaseLabel();
        updateBackground();
    }

    /** Update circular timer ring animation */
    function updateTimerRing() {
        const offset = ringCircumference * (1 - timeLeft / totalTime);
        timerRing.style.strokeDashoffset = offset;
    }

    /** Update phase label */
    function updatePhaseLabel() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        let phaseTitles = {
            warmup: "Warm Up",
            work: "Work",
            rest: "Rest",
            cooldown: "Cooldown",
            ready: "Ready"
        }
        let phaseText = phaseTitles[currentPhase];
        if (currentPhase === 'work' || currentPhase === 'rest') {
            phaseLabel.innerText = `${phaseText} - Round ${currentRound}/${totalRounds} - ${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            phaseLabel.innerText = `${phaseText} - ${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /** Update background color based on phase */
    function updateBackground() {
        let backgroundColors = {
            work: 'var(--display-green-bgColor-muted, #c8e6c9)',
            rest: 'var(--display-blue-bgColor-muted, #bbdefb)',
            ready: 'var(--bgColor-default, var(--color-canvas-default, #ffffff))',
            cooldown: 'var(--display-plum-bgColor-muted, #ffffff)',
            warmup: 'var(--display-plum-bgColor-muted, #bbdefb)'
        };
        document.body.style.backgroundColor = backgroundColors[currentPhase];
    }

    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let audioBuffers = {};

    function loadAudioFiles() {
        const sounds = {
            warmup: "/assets/sounds/arcade-ui-7-229506.mp3",
            work: "/assets/sounds/arcade-ui-2-229500.mp3",
            rest: "/assets/sounds/arcade-ui-4-229502.mp3",
            cooldown: "/assets/sounds/arcade-ui-9-229507.mp3",
            ready: "/assets/sounds/arcade-ui-18-229517.mp3"
        };

        Object.keys(sounds).forEach(phase => {
            fetch(sounds[phase])
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    audioBuffers[phase] = audioBuffer;
                    console.log(`Loaded: ${phase}`);
                })
                .catch(error => console.error(`Error loading ${phase} sound:`, error));
        });
    }

    // Unlock audio context on first user interaction
    document.addEventListener("click", function unlockAudio() {
        if (audioContext.state === "suspended") {
            audioContext.resume().then(() => console.log("Audio context resumed"));
        }
        document.removeEventListener("click", unlockAudio);
    });

    // Play sound from preloaded buffers
    function playSound() {
        const enableSounds = document.getElementById('enableSounds').checked;
        if (!enableSounds) return;

        if (!audioBuffers[currentPhase]) return;

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[currentPhase];
        source.connect(audioContext.destination);
        source.start(0);
    }

    loadAudioFiles();


    console.log("Timer script loaded successfully!");
    calculateTotalTime();
});
