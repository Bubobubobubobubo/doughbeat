export async function getSimpleDynamicWorklet(ac, code, hz = ac.sampleRate) {
    const name = `simple-custom-${Date.now()}`;
    let srcSampleRate = hz || ac.sampleRate;
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