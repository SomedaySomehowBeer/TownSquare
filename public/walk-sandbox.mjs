const CYCLE_MS = 800;
const FRAME_STEP = 2;

// Mirrors the presence-* keyframes in widget.css — keep the two in sync.
// Conventions (figure facing right): legs/arms positive = backward;
// knees positive = flexion; elbows negative = flexion. Left-leg heel
// strike at 0%, right-leg at 50%; stance ~60% / swing ~40% per leg.
const tracks = {
  ".figure-core": [
    [0, "translateY(0.4px) rotate(0.6deg)"],
    [6, "translateY(0.7px) rotate(0.9deg)"],
    [28, "translateY(-0.6px) rotate(1.2deg)"],
    [50, "translateY(0.4px) rotate(0.6deg)"],
    [56, "translateY(0.7px) rotate(0.9deg)"],
    [78, "translateY(-0.6px) rotate(1.2deg)"],
    [100, "translateY(0.4px) rotate(0.6deg)"],
  ],
  ".leg-l": [[0, -20], [8, -18], [30, -2], [45, 10], [55, 14], [62, 15], [75, -4], [88, -17], [94, -21], [100, -20]],
  ".leg-r": [[0, 12], [5, 14], [12, 15], [25, -4], [38, -17], [44, -21], [50, -20], [58, -18], [80, -2], [95, 10], [100, 12]],
  ".knee-l": [[0, 4], [8, 12], [20, 6], [40, 5], [55, 18], [65, 32], [72, 38], [80, 28], [90, 8], [96, 3], [100, 4]],
  ".knee-r": [[0, 14], [5, 18], [15, 32], [22, 38], [30, 28], [40, 8], [46, 3], [50, 4], [58, 12], [70, 6], [90, 5], [100, 14]],
  ".arm-l": [[0, 12], [12, 10], [30, 1], [50, -10], [60, -11], [75, -5], [90, 7], [100, 12]],
  ".arm-r": [[0, -10], [10, -11], [25, -5], [40, 7], [50, 12], [62, 10], [80, 1], [100, -10]],
  ".elbow-l": [[0, -6], [15, -7], [35, -10], [55, -14], [68, -15], [85, -9], [100, -6]],
  ".elbow-r": [[0, -13], [5, -14], [18, -15], [35, -9], [50, -6], [65, -7], [85, -10], [100, -13]],
};

const transformOrigins = {
  ".figure-core": "10px 24px",
  ".arm-l": "9.4px 14px",
  ".arm-r": "10.6px 14px",
  ".elbow-l": "6.1px 20px",
  ".elbow-r": "13.9px 20px",
  ".leg-l": "9.2px 26px",
  ".leg-r": "10.8px 26px",
  ".knee-l": "7.1px 34px",
  ".knee-r": "12.9px 34px",
};

const figure = document.getElementById("walk-figure");
const slider = document.getElementById("frame-slider");
const frameLabel = document.getElementById("frame-label");
const poseReadout = document.getElementById("pose-readout");
const playToggle = document.getElementById("play-toggle");
const prevFrame = document.getElementById("prev-frame");
const nextFrame = document.getElementById("next-frame");
const directionLeft = document.getElementById("direction-left");

if (
  !(figure instanceof SVGSVGElement)
  || !(slider instanceof HTMLInputElement)
  || !(frameLabel instanceof HTMLElement)
  || !(poseReadout instanceof HTMLOutputElement)
  || !(playToggle instanceof HTMLButtonElement)
  || !(prevFrame instanceof HTMLButtonElement)
  || !(nextFrame instanceof HTMLButtonElement)
  || !(directionLeft instanceof HTMLInputElement)
) {
  throw new Error("Walk sandbox controls not found");
}

let frame = Number(slider.value);
let playing = true;
let lastFrameAt = performance.now();
let animationFrame = null;

function interpolate(track, percent) {
  for (let i = 1; i < track.length; i += 1) {
    const previous = track[i - 1];
    const next = track[i];
    if (percent <= next[0]) {
      const range = next[0] - previous[0] || 1;
      const local = (percent - previous[0]) / range;
      return previous[1] + ((next[1] - previous[1]) * local);
    }
  }
  return track[track.length - 1][1];
}

function setTransform(selector, transform) {
  const element = figure.querySelector(selector);
  if (!(element instanceof SVGElement)) return;
  element.style.transform = transform;
  element.style.transformBox = "view-box";
  element.style.transformOrigin = transformOrigins[selector] || "center";
}

function render() {
  // The scaleX(-1) mirror alone handles facing left; the pose data is
  // direction-independent (reversing frames would play the gait backwards).
  figure.classList.toggle("walk-figure--left", directionLeft.checked);
  setTransform(".figure-core", sampleBody(frame));

  for (const [selector, track] of Object.entries(tracks)) {
    if (selector === ".figure-core") continue;
    setTransform(selector, `rotate(${interpolate(track, frame).toFixed(2)}deg)`);
  }

  slider.value = String(Math.round(frame));
  frameLabel.textContent = `Frame ${Math.round(frame)}`;
  poseReadout.value = [
    `body ${sampleBody(frame)}`,
    `leg-l ${interpolate(tracks[".leg-l"], frame).toFixed(1)}deg`,
    `leg-r ${interpolate(tracks[".leg-r"], frame).toFixed(1)}deg`,
    `arm-l ${interpolate(tracks[".arm-l"], frame).toFixed(1)}deg`,
    `arm-r ${interpolate(tracks[".arm-r"], frame).toFixed(1)}deg`,
  ].join(" · ");
}

function sampleBody(percent) {
  const bodyTrack = tracks[".figure-core"];
  for (let i = 1; i < bodyTrack.length; i += 1) {
    const previous = bodyTrack[i - 1];
    const next = bodyTrack[i];
    if (percent <= next[0]) {
      const range = next[0] - previous[0] || 1;
      const local = (percent - previous[0]) / range;
      const previousValues = parseBody(previous[1]);
      const nextValues = parseBody(next[1]);
      const y = previousValues.y + ((nextValues.y - previousValues.y) * local);
      const rotate = previousValues.rotate + ((nextValues.rotate - previousValues.rotate) * local);
      return `translateY(${y.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg)`;
    }
  }
  return bodyTrack[bodyTrack.length - 1][1];
}

function parseBody(value) {
  const match = value.match(/translateY\((-?[\d.]+)px\) rotate\((-?[\d.]+)deg\)/);
  if (!match) return { y: 0, rotate: 0 };
  return { y: Number(match[1]), rotate: Number(match[2]) };
}

function setFrame(nextFrame) {
  frame = (nextFrame + 101) % 101;
  render();
}

function setPlaying(nextPlaying) {
  playing = nextPlaying;
  playToggle.textContent = playing ? "Pause" : "Play";
  lastFrameAt = performance.now();
}

function tick(now) {
  if (playing) {
    const dt = now - lastFrameAt;
    setFrame(frame + ((dt / CYCLE_MS) * 100));
  }
  lastFrameAt = now;
  animationFrame = requestAnimationFrame(tick);
}

slider.addEventListener("input", () => {
  setPlaying(false);
  setFrame(Number(slider.value));
});

playToggle.addEventListener("click", () => setPlaying(!playing));
prevFrame.addEventListener("click", () => {
  setPlaying(false);
  setFrame(frame - FRAME_STEP);
});
nextFrame.addEventListener("click", () => {
  setPlaying(false);
  setFrame(frame + FRAME_STEP);
});
directionLeft.addEventListener("change", render);

render();
animationFrame = requestAnimationFrame(tick);

window.addEventListener("pagehide", () => {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
});
