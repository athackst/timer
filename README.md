# Interval Timer web app

A lightweight, customizable Tabata‑style interval timer built with plain HTML, CSS, and JavaScript. It features:

* **Circular Progress Ring**: Visual countdown of the current phase.
* **Phase Label**: Clearly displays the current phase (Warm Up, Work, Rest, Cooldown) in uppercase.
* **Time Remaining**: Prominent MM\:SS display centered inside the ring.
* **Round Indicator**: Shows the current round out of total rounds.
* **Screen Wake Lock**: Prevents the device from sleeping during an active timer (supported in modern browsers).
* **Collapsible Settings Panel**: `<details>`‑based toggle for timer configuration.
* **Customizable Durations**: Set warm‑up, work, rest, cooldown times, and number of rounds.
* **Sound Alerts**: Play distinct sounds at each phase transition (optional).

---

## Demo

View a live demo [here](https://www.althack.dev/timer).

## Features

* **SVG Progress Ring** with stroke‑dasharray animation.
* **Centered Text**: dynamic phase, time, and round info inside the ring.
* **Screen Wake Lock** to keep mobile and desktop screens awake while timing.
* **Responsive Layout**: scales for desktop and mobile.
* **Accessibility**: semantic HTML, keyboard‑toggleable settings.
* **No dependencies**: zero external libraries or frameworks.

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/interval-timer.git
   ```

2. Navigate into the directory:

   ```bash
   cd interval-timer
   ```

3. Serve the page (e.g., with a simple HTTP server):

   ```bash
   bundle exec jekyll serve
   ```

4. Open your browser at `http://localhost:4000`.

## Usage

1. Open the **Settings** panel by clicking the ⚙️ gear icon (defaults to expanded).
2. Enter your desired durations for Warm‑up, Work, Rest, and Cooldown in `MM:SS` format.
3. Set the number of Rounds.
4. Toggle **Sounds** on/off.
5. Click **Start** to begin. The panel will collapse automatically if configured.
6. Use **Pause** and **Reset** controls as needed.

## Configuration

Timer options are stored in the settings table in the HTML (Jekyll frontmatter page). Key IDs:

* `#workTime` — Work interval (default `0:10`).
* `#restTime` — Rest interval (default `0:20`).
* `#warmupTime` — Warm‑up duration (default `0:00`).
* `#cooldownTime` — Cooldown duration (default `0:00`).
* `#rounds` — Number of rounds (default `8`).
* `#enableSounds` — Checkbox to enable/disable audio cues.

The script auto‑formats inputs and calculates total work/session time.

## Customization

* **Colors & Themes**: Modify CSS variables (`--ring-accent`, background colors) to match your branding.
* **Iconography**: Swap the gear or summary icon by editing the SVG in the `<summary>`.
* **Audio**: Replace or add sound files in `/assets/sounds/` and update `loadAudioFiles()` paths.
* **Sizing**: Change the SVG `width`/`height` and CSS `.timer-container` to resize the ring.

## Browser Support

* **Chrome, Firefox, Edge, Safari** (desktop & mobile).
* **Screen Wake Lock** supported on Chrome 84+, Safari iOS 16.4+, and most modern browsers. Fallback gracefully on unsupported browsers.

## Troubleshooting

* **Ring not animating?** Ensure the SVG `<circle>` has correct `stroke-dasharray` (≈ `2πr`).
* **Wake lock failing?** Check `navigator.wakeLock` support and console errors.
* **Audio not playing?** Some browsers require a user interaction to unlock audio—click anywhere to resume.

## Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/my-new-feature`.
3. Commit your changes: `git commit -am 'Add new feature'`.
4. Push to the branch: `git push origin feature/my-new-feature`.
5. Open a Pull Request.

Please adhere to the existing code style and include tests where applicable.

## License

[MIT](LICENSE)


This website is built on top of the [jekyll-theme-profile](https://www.github.com/athackst/jekyll-theme-profile) repository
