// Original procedural audio: ocean wash, a sparse drone, hand-drum pulses, and contextual spell cues.
// No original Populous recordings are distributed with the game.
export class Soundscape {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  timer: ReturnType<typeof setInterval> | null = null;
  noise: AudioBuffer | null = null;
  enabled = false;
  beat = 0;
  volume = .35;
  async enable() {
    if (!this.context) {
      const ctx = new AudioContext(); this.context = ctx;
      this.master = ctx.createGain(); this.master.gain.value = this.volume;
      const limiter = ctx.createDynamicsCompressor(); this.master.connect(limiter); limiter.connect(ctx.destination);
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate); const samples = this.noise.getChannelData(0); let last = 0;
      for (let i = 0; i < samples.length; i++) { last = (last + (Math.random() * 2 - 1) * .025) / 1.025; samples[i] = last * 4; }
      const wind = ctx.createBufferSource(); wind.buffer = this.noise; wind.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 580;
      const gain = ctx.createGain(); gain.gain.value = .23; wind.connect(filter); filter.connect(gain); gain.connect(this.master); wind.start();
      const swell = ctx.createOscillator(); swell.frequency.value = .085; const amount = ctx.createGain(); amount.gain.value = .09; swell.connect(amount); amount.connect(gain.gain); swell.start();
      this.timer = setInterval(() => this.pulse(), 480);
    }
    await this.context.resume(); this.enabled = true; this.master!.gain.setTargetAtTime(this.volume, this.context.currentTime, .2); this.cue('select');
  }
  mute() { this.enabled = false; if (this.master && this.context) this.master.gain.setTargetAtTime(0, this.context.currentTime, .08); }
  setVolume(value: number) { this.volume = value; if (this.enabled && this.master && this.context) this.master.gain.setTargetAtTime(value, this.context.currentTime, .1); }
  tone(frequency: number, duration: number, volume: number, type: OscillatorType = 'sine', delay = 0, endFrequency = frequency) {
    if (!this.context || !this.master || !this.enabled) return;
    const ctx = this.context, now = ctx.currentTime + delay, o = ctx.createOscillator(), gain = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(frequency, now); o.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(.05, duration / 5)); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    o.connect(gain); gain.connect(this.master); o.start(now); o.stop(now + duration + .02); o.onended = () => { o.disconnect(); gain.disconnect(); };
  }
  rumble(duration: number, frequency: number, volume: number) {
    if (!this.context || !this.master || !this.noise || !this.enabled) return;
    const ctx = this.context, source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(), now = ctx.currentTime;
    source.buffer = this.noise; source.loop = true; filter.type = 'lowpass'; filter.frequency.setValueAtTime(frequency, now); filter.frequency.exponentialRampToValueAtTime(80, now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start(); source.stop(now + duration); source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  pulse() {
    if (!this.enabled) return;
    const b = this.beat++ % 32;
    if ([0, 6, 8, 14, 16, 22, 24, 27, 30].includes(b)) this.tone(b % 8 === 0 ? 110 : 170, .24, b % 8 === 0 ? .23 : .12, 'sine', 0, 45);
    if (b % 4 === 2) this.rumble(.07, 3000, .08);
    if (b % 8 === 0) { const n = [73.416, 87.307, 65.406, 73.416][b / 8]; this.tone(n, 6, .08, 'sine'); this.tone(n * 1.5, 5, .045, 'sine', .2); }
    if ([3, 11, 19, 26].includes(b)) this.tone([293.66, 349.23, 440, 261.63][Math.floor(b / 8)], 1.8, .055, 'triangle');
  }
  cue(kind: string) {
    if (!this.enabled) return;
    if (kind === 'select') { this.tone(220, .28, .16, 'triangle', 0, 293); this.tone(440, .3, .05, 'sine', .06, 587); }
    else if (kind === 'command') this.tone(180, .13, .12, 'triangle', 0, 145);
    else if (kind === 'error') this.tone(95, .2, .16, 'triangle');
    else if (kind === 'convert') [293.66, 349.23, 440, 587.33].forEach((n, i) => this.tone(n, .9, .13, 'sine', i * .1));
    else if (kind === 'lightning') { this.rumble(1.8, 6000, 1); this.tone(70, .8, .4, 'sawtooth', 0, 22); }
    else if (kind === 'volcano' || kind === 'earthquake') { this.rumble(kind === 'volcano' ? 5 : 3, 900, 1); this.tone(60, 2.5, .4, 'sine', 0, 25); }
    else if (kind === 'blast') { this.rumble(.9, 1900, .7); this.tone(120, .45, .35, 'sine', 0, 35); }
    else if (kind === 'bridge') { this.rumble(2, 500, .5); this.tone(130, 1.5, .17, 'triangle', .1, 260); }
    else { this.tone(420, .09, .17, 'triangle'); this.tone(300, .1, .12, 'triangle', .13); }
  }
  dispose() { if (this.timer) clearInterval(this.timer); void this.context?.close(); }
}
