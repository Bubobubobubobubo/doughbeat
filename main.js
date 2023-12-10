import { getSimpleDynamicWorklet } from "./helpers.js";
let ac;
let crossfadeDuration = 2; // Adjust the crossfade duration as needed
let workerPile = [];



const stop = async () => {
  // Stop all sounds
  ac = ac || new AudioContext();
  for (worker in workerPile) {
    worker.stop();
  }
};

const addNewSynth = async (code) => {
  let synth = {
    node: await getSimpleDynamicWorklet(ac, code),
    gain: ac.createGain(),
    code: code,
  };
  synth.gain.connect(ac.destination);
  synth.node.node.connect(synth.gain);
  synth.gain.gain.setValueAtTime(0, ac.currentTime);
  synth.gain.gain.linearRampToValueAtTime(1, ac.currentTime + crossfadeDuration);
  workerPile.push(synth);
}

const update = async (code) => {
  ac = ac || new AudioContext();
  console.log(workerPile);
  if (workerPile.length < 2) {
    addNewSynth(code);
  } else {
    let oldest = workerPile.shift();
    oldest.gain.gain.setValueAtTime(1, ac.currentTime);
    oldest.gain.gain.linearRampToValueAtTime(0, ac.currentTime + crossfadeDuration);
    setTimeout(() => {
      oldest.node.stop();
      oldest.gain.disconnect();
      addNewSynth(code);
    }, crossfadeDuration * 1000);
  }
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