import { getSimpleDynamicWorklet } from "./helpers.js";
let ac;
let popup = document.getElementById("popup");
popup.addEventListener("click", function initAudio() {
  console.log("Ok clic");
  ac = new AudioContext();
  ac.resume();
  document.removeEventListener("click", initAudio);
});

// control
let worklet,
  hz = 44100;
const stop = async () => {
  worklet?.stop();
  worklet?.node?.disconnect();
  stopButton.style.display = "none";
  playButton.style.display = "block";
};

const update = async (code) => {
  ac = ac || new AudioContext();
  await ac.resume();
  stop();
  worklet = await getSimpleDynamicWorklet(ac, code, hz);
  worklet.node.connect(ac.destination);
  window.location.hash = "#" + btoa(code);
  stopButton.style.display = "block";
  playButton.style.display = "none";
};

// ui
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
