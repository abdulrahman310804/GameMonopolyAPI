/* Original procedural soundtrack and effects. No downloads or audio files needed. */
(() => {
  const KEY = 'nusantara-audio-v1';
  let prefs = { music: true, effects: true, muted: false, musicVolume: 0.22, effectsVolume: 0.6 };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  let ctx, master, musicBus, fxBus, timer, nextBeat = 0, beat = 0, started = false;
  const voices = new Set();
  const melody = [72,76,79,81,79,76,74,67,72,76,79,84,81,79,76,74,
                  69,72,76,79,76,72,69,67,65,69,72,76,74,72,69,67];
  const midi = n => 440 * 2 ** ((n - 69) / 12);
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} };
  function apply() {
    if (!ctx) return;
    master.gain.setTargetAtTime(prefs.muted ? 0 : 0.55, ctx.currentTime, 0.025);
    musicBus.gain.setTargetAtTime(prefs.music ? prefs.musicVolume : 0, ctx.currentTime, 0.025);
    fxBus.gain.setTargetAtTime(prefs.effects ? prefs.effectsVolume : 0, ctx.currentTime, 0.025);
  }
  function tone(freq, time, duration, volume, bus, type = 'sine', endFreq) {
    if (!ctx || ctx.state !== 'running') return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, time);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain); gain.connect(bus); osc.start(time); osc.stop(time + duration + 0.025);
    voices.add(osc);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); voices.delete(osc); };
  }
  function tick() {
    if (!ctx || ctx.state !== 'running' || document.hidden) return;
    if (nextBeat < ctx.currentTime) nextBeat = ctx.currentTime + 0.04;
    while (nextBeat < ctx.currentTime + 0.22) {
      if (prefs.music && !prefs.muted) {
        const n = melody[beat % melody.length];
        tone(midi(n), nextBeat, 0.30, 0.19, musicBus, 'triangle');
        if (beat % 4 === 0) {
          const root = [48,45,41,43][Math.floor(beat / 8) % 4];
          tone(midi(root), nextBeat, 0.60, 0.22, musicBus);
          tone(midi(root + 19), nextBeat + 0.10, 0.55, 0.055, musicBus);
        }
        if (beat % 2 === 0) tone(90, nextBeat, 0.07, 0.10, musicBus, 'sine', 42);
      }
      beat++; nextBeat += 0.25;
    }
  }
  function startClock() { if (!timer) { nextBeat = ctx.currentTime + 0.06; tick(); timer = setInterval(tick, 80); } }
  async function unlock() {
    try {
      if (!ctx) {
        const Constructor = window.AudioContext || window.webkitAudioContext;
        if (!Constructor) return false;
        ctx = new Constructor(); master = ctx.createGain(); musicBus = ctx.createGain(); fxBus = ctx.createGain();
        const compressor = ctx.createDynamicsCompressor();
        musicBus.connect(master); fxBus.connect(master); master.connect(compressor); compressor.connect(ctx.destination);
        apply();
      }
      await ctx.resume(); started = true; startClock(); return ctx.state === 'running';
    } catch { return false; }
  }
  function play(name, variant = 0) {
    if (!ctx || ctx.state !== 'running' || prefs.muted || !prefs.effects || document.hidden) return;
    const t = ctx.currentTime + 0.005;
    const notes = (values, step = 0.095, duration = 0.22) => values.forEach((n, i) => tone(midi(n), t + i * step, duration, 0.22, fxBus, 'triangle'));
    switch (name) {
      case 'dice':
        for (let i = 0; i < 9; i++) {
          tone(240 + (i % 3) * 170, t + i * 0.105, 0.055, 0.22 - i * 0.012, fxBus, 'triangle', 75);
          tone(1200 + i * 90, t + i * 0.105, 0.025, 0.075, fxBus, 'square', 440);
        } break;
      case 'landDice': tone(130, t, 0.12, 0.24, fxBus, 'triangle', 40); break;
      case 'step': tone(170 + variant * 42, t, 0.055, 0.19, fxBus, 'sine', 65 + variant * 12); break;
      case 'buy': notes([72,76,79]); break;
      case 'upgrade': notes([67,72,76,79,84], 0.075); break;
      case 'card': notes([79,74,81], 0.065); break;
      case 'pay': notes([67,60], 0.08, 0.16); break;
      case 'bonus': notes([76,79,84]); break;
      case 'jail': notes([55,51,48], 0.15, 0.30); break;
      case 'bankrupt': notes([60,55,51,48,43], 0.16, 0.30); break;
      case 'win': notes([60,64,67,72,67,72,76,79], 0.14, 0.35); break;
      case 'turn': notes([67 + variant,72 + variant], 0.06, 0.12); break;
    }
  }
  function set(key, value) {
    if (['musicVolume', 'effectsVolume'].includes(key)) prefs[key] = Math.min(1, Math.max(0, Number(value) || 0));
    else if (['music', 'effects', 'muted'].includes(key)) prefs[key] = Boolean(value);
    persist(); apply(); updateButton();
  }
  function updateButton() {
    const button = document.getElementById('soundBtn');
    if (button) { button.textContent = prefs.muted ? '♪ Mati' : '♫ Suara'; button.setAttribute('aria-label', 'Pengaturan musik dan efek suara'); }
  }
  function settings() {
    unlock().then(ok => { if (!ok) { const notice = document.getElementById('audioNotice'); if (notice) notice.textContent = 'Audio belum aktif atau tidak didukung browser ini. Coba Chrome atau Edge.'; } });
    show(`<div class="eyebrow">Audio Nusantara</div><h2>Musik & efek suara</h2>
      <p id="audioNotice">Musik orisinal bergaya arcade, dibuat langsung oleh game dan dapat dimainkan offline.</p>
      <label class="audio-toggle"><input type="checkbox" ${prefs.muted?'checked':''} onchange="gameAudio.set('muted',this.checked)"> Matikan semua suara</label>
      <label class="audio-toggle"><input type="checkbox" ${prefs.music?'checked':''} onchange="gameAudio.set('music',this.checked)"> Musik latar</label>
      <label for="musicVolume">Volume musik</label><input id="musicVolume" type="range" min="0" max="1" step="0.01" value="${prefs.musicVolume}" oninput="gameAudio.set('musicVolume',this.value)">
      <label class="audio-toggle"><input type="checkbox" ${prefs.effects?'checked':''} onchange="gameAudio.set('effects',this.checked)"> Efek permainan</label>
      <label for="effectsVolume">Volume efek</label><input id="effectsVolume" type="range" min="0" max="1" step="0.01" value="${prefs.effectsVolume}" oninput="gameAudio.set('effectsVolume',this.value)">
      <div class="modal-actions"><button onclick="gameAudio.unlock().then(()=>gameAudio.play('buy'))">Tes suara</button><button class="primary" onclick="closeModal()">Tutup</button></div>
      <p class="notice">Tekan M untuk membisukan suara. Musik berhenti sementara saat tab disembunyikan. Pengaturan tersimpan pada browser ini.</p>`);
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { clearInterval(timer); timer = null; ctx.suspend().catch(()=>{}); }
    else if (started) ctx.resume().then(startClock).catch(()=>{});
  });
  document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) {
      set('muted', !prefs.muted);
      if (document.getElementById('modal').open && document.getElementById('audioNotice')) settings();
    }
  });
  window.gameAudio = { unlock, play, set, settings, updateButton, get state() { return { ...prefs, status: ctx?.state || 'inactive', voices: voices.size }; } };
  updateButton();
})();
