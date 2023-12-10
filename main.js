// audio init
console.log(
  `Welcome to doughbeat, a very minimal bytebeat livecoding editor..
Click into the page and press ctrl+enter to evaluate the code!
There are no further instructions. Read https://github.com/felixroos/doughbeat to find out more!
  `,
);
let ac;
let popup = document.getElementById("popup");
popup.addEventListener("click", function initAudio() {
  console.log("Ok clic");
  ac = new AudioContext();
  ac.resume();
  document.removeEventListener("click", initAudio);
});

async function getSimpleDynamicWorklet(ac, code, hz = ac.sampleRate) {
  const name = `simple-custom-${Date.now()}`;
  let srcSampleRate = hz || ac.sampleRate;
  // let sampleRatio = srcSampleRate / ac.sampleRate;
  const workletCode = `${code}
        class MyProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.t = 0;
    this.stopped = false;
    this.port.onmessage = (e) => {
      if(e.data==='stop') {
        this.stopped = true;
      }
    };
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let i = 0; i < output[0].length; i++) {
      const out = dsp(this.t / ${ac.sampleRate});
      output.forEach((channel) => {
        channel[i] = out;
      });
      this.t++;
    }
    return !this.stopped;
  }
}
registerProcessor('${name}', MyProcessor);
  `;
  const base64String = btoa(workletCode);
  const dataURL = `data:text/javascript;base64,${base64String}`;
  await ac.audioWorklet.addModule(dataURL);
  const node = new AudioWorkletNode(ac, name);
  const stop = () => node.port.postMessage("stop");
  return { node, stop };
}

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
