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
    const settingsPanel = document.getElementById('settingsDetails');
    const phaseDisplay = document.getElementById('phaseDisplay');
    const timeDisplay = document.getElementById('timeDisplay');
    const roundDisplay = document.getElementById('roundDisplay');
    const totalTimeDisplay = document.getElementById('totalTime');
    const workTimeDisplay = document.getElementById('totalWorkTime');
    const timerRing = document.getElementById('timerRing');

    let interval;
    let isPaused = true;
    let isFinished = true;
    let currentPhase = 'ready';
    let currentRound = 1;
    let warmupTime, workTime, restTime, cooldownTime, totalRounds;
    let timeLeft, totalTime;
    let wakeLock = null;
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
        totalTimeDisplay.innerText = `${Math.floor(fullSessionTime / 60)}m ${fullSessionTime % 60}s`;
        workTimeDisplay.innerText = `${Math.floor(totalWorkTime / 60)}m ${totalWorkTime % 60}s`
    }

    /** Toggle timer start/pause */
    function toggleTimer() {
        if (isPaused) {
            console.debug("Timer is paused.")
            if (isFinished) {
                console.debug("Timer is finished, start timer.")
                startTimer();
            }
            else {
                console.debug("Timer is paused but not finished, resume.")
                resumeTimer();
            }
            timerButton.innerText = "Pause";
        } else {
            console.log("Timer is not paused, pause timer.")
            pauseTimer();
            timerButton.innerText = "Resume";
        }
    }

    /** Start workout timer */
    function startTimer() {
        console.debug("Starting timer")
        collapseSettings();
        currentRound = 1;
        currentPhase = 'warmup';
        isFinished = false;
        isPaused = false;
        clearInterval(interval);
        startPhase(warmupTime);
    }

    /** Start a new phase (work or rest) */
    function startPhase(duration) {
        timeLeft = duration;
        totalTime = duration;
        if (duration === 0) {
            console.debug("Duration for this phase is 0, switching to the next phase")
            switchPhase();
            return;
        }
        playSound();
        resumeTimer();
    }

    /** Resume countdown */
    function resumeTimer() {
        console.debug("Resuming timer")
        isPaused = false;
        clearInterval(interval);
        requestWakeLock();
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
        console.debug("Pausing timer")
        isPaused = true;
        clearInterval(interval);
        releaseWakeLock();
    }

    /** Reset timer to initial state */
    function resetTimer() {
        console.debug("Resetting timer")
        releaseWakeLock();
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
            console.debug("Switchting phase warmup->work")
            currentPhase = 'work';
            startPhase(workTime);
        } else if (currentPhase === 'work') {
            console.debug("Switching phase work->rest")
            currentPhase = 'rest';
            startPhase(restTime);
        } else if (currentPhase === 'rest') {
            currentRound++;
            if (currentRound > totalRounds) {
                console.debug("Switching phase rest->cooldown")
                currentPhase = 'cooldown';
                startPhase(cooldownTime);
            } else {
                console.debug("Switching phase rest->work")
                currentPhase = 'work';
                startPhase(workTime);
            }
        } else if (currentPhase === 'cooldown') {
            console.debug("Switching phase cooldown->ready")
            currentPhase = 'ready';
            endSession();
        }
    }

    /** End session and reset UI */
    function endSession() {
        console.debug("Timer ended.")
        playSound();
        releaseWakeLock();
        resetTimer();
        // phaseLabel.innerText = 'Session Complete!';
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
        phaseDisplay.innerText = `${phaseText}`;
        timeDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        roundDisplay.innerText = `${currentRound}/${totalRounds}`;
    }

    /** Update background color based on phase */
    function updateBackground() {
        let backgroundColors = {
            work: 'var(--timer-work-bg, var(--display-green-bgColor-muted, #c8e6c9))',
            rest: 'var(--timer-rest-bg, var(--display-blue-bgColor-muted, #bbdefb))',
            ready: 'var(--timer-ready-bg, var(--bgColor-default, var(--color-canvas-default, #ffffff)))',
            cooldown: 'var(--timer-cooldown-bg, var(--display-plum-bgColor-muted, #ffffff))',
            warmup: 'var(--timer-warmup-bg, var(--display-plum-bgColor-muted, #bbdefb))'
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

    /**  Unlock audio context on first user interaction */
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

    /**  Wake Lock Functions */
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator && wakeLock === null) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.debug('Wake Lock acquired');
                document.addEventListener('visibilitychange', handleVisibilityChange);
            }
        } catch (err) {
            console.error('Could not acquire Wake Lock:', err);
        }
    }

    async function releaseWakeLock() {
        try {
            if (wakeLock !== null) {
                await wakeLock.release();
                wakeLock = null;
                console.debug('Wake Lock released');
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        } catch (err) {
            console.error('Could not release Wake Lock:', err);
        }
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible' && !isPaused && !isFinished) {
            requestWakeLock();
        }
    }

    function collapseSettings() {
        settingsPanel.open=false;
    }

    function expandSettings() {
        settingsPanel.open=true;
    }

    loadAudioFiles();
    calculateTotalTime();

    console.log("Timer script loaded successfully!");
});
