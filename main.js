import { getSimpleDynamicWorklet } from "./helpers.js";
let ac;
let oldGainNode;
let newGainNode;
let hz = 44100;
let oldWorklet = undefined;
let currentWorklet = undefined;
let crossfadeDuration = 2; // Adjust the crossfade duration as needed



const stop = async () => {
  if (oldWorklet) {
    oldGainNode.gain.setValueAtTime(1, ac.currentTime);
    oldGainNode.gain.linearRampToValueAtTime(0, ac.currentTime + crossfadeDuration);
    oldWorklet.stop(ac.currentTime + crossfadeDuration);
    oldWorklet = null;
  }
  stopButton.style.display = "none";
  playButton.style.display = "block";
};

const update = async (code) => {
  ac = ac || new AudioContext();
  await ac.resume();

  if (currentWorklet !== undefined)
    oldWorklet = currentWorklet;
    stop();

  // Create a new worklet
  currentWorklet = await getSimpleDynamicWorklet(ac, code);

  // Create a GainNode for controlling the volume during crossfade
  newGainNode = ac.createGain();
  newGainNode.gain.setValueAtTime(0, ac.currentTime);
  newGainNode.gain.linearRampToValueAtTime(1, ac.currentTime + crossfadeDuration);
  currentWorklet.node.connect(newGainNode);
  newGainNode.connect(ac.destination);
  // currentWorklet = newWorklet;

  window.location.hash = "#" + btoa(code);
  stopButton.style.display = "block";
  playButton.style.display = "none";
};

// ui
let popup = document.getElementById("popup");
popup.addEventListener("click", function initAudio() {
  ac = new AudioContext();
  ac.resume();
  document.removeEventListener("click", initAudio);
});
const input = document.getElementById("code");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");
let urlCode = window.location.hash.slice(1);
if (urlCode) {
  urlCode = atob(urlCode);
  console.log("loaded code from url!");
}
const initialCode =
  urlCode ||
  `function dsp(t) {
  return (110 * t % 1 - 0.5) / 10
}`;
input.value = initialCode;
input.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    update(input.value);
  } else if (e.ctrlKey && e.key === ".") {
    stop();
  }
});
playButton.addEventListener("click", () => update(input.value));
stopButton.addEventListener("click", () => stop());