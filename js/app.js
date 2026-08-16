/* ============================================================
   星月占卜馆 · 主逻辑
   星空画布 / 入场仪式 / 导航 / 塔罗 / 星座 / 配对 / 灵签 / 月相 / 许愿
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 工具 ---------- */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr, rng) => arr[Math.floor((rng ? rng() : Math.random()) * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const todayStr = (function () {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  })();
  const dayRng = (key) => mulberry32(hashStr(todayStr + key));

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- 声音 ---------- */
  let audioCtx = null;
  let soundOn = localStorage.getItem('mystic:sound') !== '0';

  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* 无音频环境 */ }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function playChime(freqs, dur, vol) {
    freqs = freqs || [523.25];
    dur = dur || 1.6; vol = vol == null ? 0.1 : vol;
    if (!soundOn || !audioCtx) return; /* 无用户交互前不初始化、不发声 */
    const ctx = audioCtx;
    const t = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol / (i + 1), t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.1);
    });
  }

  function updateSoundBtn() {
    $('#soundBtn').textContent = soundOn ? '🔊' : '🔇';
  }
  $('#soundBtn').addEventListener('click', () => {
    soundOn = !soundOn;
    localStorage.setItem('mystic:sound', soundOn ? '1' : '0');
    updateSoundBtn();
    if (soundOn) { ensureAudio(); playChime([523.25, 659.25, 783.99], 1.4, 0.08); }
  });

  /* ---------- 星空画布 ---------- */
  const sf = $('#starfield'), sx = sf.getContext('2d');
  const dust = $('#stardust'), dx = dust.getContext('2d');
  let W = 0, H = 0, stars = [], shooters = [], trail = [];
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function resizeCanvas() {
    W = window.innerWidth; H = window.innerHeight;
    sf.width = W * DPR; sf.height = H * DPR;
    dust.width = W * DPR; dust.height = H * DPR;
    sx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dx.setTransform(DPR, 0, 0, DPR, 0, 0);
    stars = Array.from({ length: Math.min(200, Math.floor(W * H / 6500)) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: rand(0.3, 1.5), p: rand(0, Math.PI * 2), s: rand(0.4, 1.6),
      c: pick(['#ffffff', '#ffe9b8', '#bcd4ff'])
    }));
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let nextShoot = 3;
  function animate(now) {
    const t = now / 1000;
    /* 星云 */
    sx.clearRect(0, 0, W, H);
    sx.globalCompositeOperation = 'lighter';
    const neb = [
      { x: W * (0.75 + 0.08 * Math.sin(t * 0.05)), y: H * 0.12, r: Math.max(W, H) * 0.4, c: '122,95,192' },
      { x: W * (0.12 + 0.06 * Math.cos(t * 0.04)), y: H * 0.55, r: Math.max(W, H) * 0.35, c: '58,95,208' },
      { x: W * (0.5 + 0.1 * Math.sin(t * 0.03)), y: H * 0.95, r: Math.max(W, H) * 0.45, c: '61,43,110' }
    ];
    for (const n of neb) {
      const g = sx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, `rgba(${n.c},0.10)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      sx.fillStyle = g;
      sx.fillRect(0, 0, W, H);
    }
    sx.globalCompositeOperation = 'source-over';
    /* 星星 */
    for (const st of stars) {
      const a = 0.2 + 0.75 * ((Math.sin(t * st.s + st.p) + 1) / 2);
      sx.globalAlpha = a;
      sx.fillStyle = st.c;
      sx.beginPath();
      sx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      sx.fill();
    }
    sx.globalAlpha = 1;
    /* 流星 */
    if (t > nextShoot) {
      shooters.push({ x: rand(0.2, 0.9) * W, y: rand(0, 0.4) * H, vx: rand(-9, -5), vy: rand(2, 4), life: 0 });
      nextShoot = t + rand(5, 9);
    }
    for (let i = shooters.length - 1; i >= 0; i--) {
      const sh = shooters[i];
      sh.x += sh.vx; sh.y += sh.vy; sh.life += 0.022;
      const g = sx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 10, sh.y - sh.vy * 10);
      g.addColorStop(0, `rgba(255,255,255,${0.85 * (1 - sh.life)})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      sx.strokeStyle = g; sx.lineWidth = 1.6;
      sx.beginPath();
      sx.moveTo(sh.x, sh.y);
      sx.lineTo(sh.x - sh.vx * 10, sh.y - sh.vy * 10);
      sx.stroke();
      if (sh.life >= 1) shooters.splice(i, 1);
    }
    /* 鼠标星尘 */
    dx.clearRect(0, 0, W, H);
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      p.v -= 0.022;
      if (p.v <= 0) { trail.splice(i, 1); continue; }
      dx.globalAlpha = p.v * 0.7;
      dx.fillStyle = p.c;
      dx.beginPath();
      dx.arc(p.x, p.y, p.v * 2.4, 0, Math.PI * 2);
      dx.fill();
    }
    dx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  if (window.matchMedia('(pointer: fine)').matches) {
    let last = 0;
    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - last < 28) return;
      last = now;
      if (trail.length > 46) trail.shift();
      trail.push({ x: e.clientX, y: e.clientY, v: 0.55, c: pick(['#f2d98d', '#ffffff', '#bcd4ff']) });
    });
  }

  /* ---------- 入场仪式 ---------- */
  const gate = $('#gate');
  function openGate() {
    ensureAudio();
    playChime([392, 523.25, 659.25], 2.2, 0.09);
    gate.classList.add('leaving');
    setTimeout(() => { gate.style.display = 'none'; }, 1500);
    sessionStorage.setItem('mystic:entered', '1');
  }
  if (sessionStorage.getItem('mystic:entered')) gate.style.display = 'none';
  $('#gateBtn').addEventListener('click', openGate);
  $('#replayGate').addEventListener('click', () => {
    gate.style.display = '';
    gate.classList.remove('leaving');
    playChime([523.25], 1.2, 0.08);
  });

  /* ---------- 导航 ---------- */
  function goTo(id) {
    $$('.page').forEach((p) => p.classList.toggle('active', p.id === id));
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.target === id));
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* file 协议下忽略 */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('#mainNav').addEventListener('click', (e) => {
    const a = e.target.closest('a[data-target]');
    if (a) goTo(a.dataset.target);
  });
  $('#homeLogo').addEventListener('click', () => goTo('home'));
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#', '');
    if (id && document.getElementById(id)) goTo(id);
  });

  /* ---------- 月相计算 ---------- */
  const SYNODIC = 29.53058867;
  const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);
  const MOON_NAMES = ['新月', '娥眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
  const MOON_PHASES = {
    '新月': { desc: '万物归零，一切刚刚开始。这是宇宙的空白页，适合许愿、开启新计划、种下新的种子。', yi: ['许下心愿', '开启新计划', '冥想静心', '整理目标'], ji: ['仓促决定', '自我怀疑', '熬夜透支'] },
    '娥眉月': { desc: '愿望初萌，像一弯新月。适合学习、积累，为即将到来的机会做准备。', yi: ['学习新知', '培养习惯', '分享灵感', '记录想法'], ji: ['急于求成', '半途而废', '过度消耗'] },
    '上弦月': { desc: '张力渐起，是行动与突破的时刻。适合推进项目、直面挑战、做出关键决定。', yi: ['推进计划', '直面挑战', '健身运动', '做出决定'], ji: ['犹豫不决', '与人硬碰', '贪多求快'] },
    '盈凸月': { desc: '能量接近圆满，适合冲刺与完善细节，收获已在前方招手。', yi: ['冲刺收尾', '完善细节', '团队协作', '表达感谢'], ji: ['情绪上头', '吹毛求疵', '半场松懈'] },
    '满月': { desc: '月光圆满，情绪与能量达到顶点。适合释放、庆祝、感恩，也适合清理旧事、放下执念。', yi: ['庆祝收获', '表达情感', '断舍离', '写感恩日记'], ji: ['情绪化争执', '冲动消费', '熬夜狂欢'] },
    '亏凸月': { desc: '月盈则亏，能量开始回流。适合复盘、分享，把经验沉淀为智慧。', yi: ['复盘总结', '分享经验', '温和社交', '调整计划'], ji: ['开启新项目', '过度承诺', '翻旧账'] },
    '下弦月': { desc: '是清理与放下的时刻。剪掉多余的枝蔓，才能轻装迎接新月。', yi: ['断舍离', '结束无益之事', '整理空间', '静心阅读'], ji: ['执着旧事', '硬扛到底', '自我消耗'] },
    '残月': { desc: '能量归于寂静，适合休息、疗愈与内省。黑暗是黎明的序章。', yi: ['好好休息', '独处内省', '放松泡澡', '原谅与放下'], ji: ['自我苛责', '胡思乱想', '勉强应酬'] }
  };

  function moonInfo(date) {
    date = date || new Date();
    let age = (date.getTime() - NEW_MOON_EPOCH) / 86400000;
    age = ((age % SYNODIC) + SYNODIC) % SYNODIC;
    const frac = age / SYNODIC;
    const illum = (1 - Math.cos(2 * Math.PI * frac)) / 2;
    const idx = Math.round(frac * 8) % 8;
    const name = MOON_NAMES[idx];
    const nextFull = (frac <= 0.5 ? 0.5 - frac : 1.5 - frac) * SYNODIC;
    const nextNew = (frac === 0 ? 1 : 1 - frac) * SYNODIC;
    return { age, frac, illum, name, nextFull, nextNew };
  }

  function moonSVG(r, frac, id) {
    const c = r;
    const rx = Math.abs(r * Math.cos(2 * Math.PI * frac));
    const sweep1 = frac < 0.5 ? 0 : 1;
    const sweep2 = Math.cos(2 * Math.PI * frac) >= 0 ? 0 : 1;
    const lit = `M ${c} ${c - r} A ${r} ${r} 0 0 ${sweep1} ${c} ${c + r} A ${rx} ${r} 0 0 ${sweep2} ${c} ${c - r} Z`;
    const v = c * 2;
    return '<svg viewBox="0 0 ' + v + ' ' + v + '" width="' + v * 2 + '" height="' + v * 2 + '" role="img" aria-label="月相">' +
      '<defs>' +
      '<radialGradient id="' + id + '_lit" cx="40%" cy="35%" r="85%">' +
      '<stop offset="0%" stop-color="#fdf3c9"/><stop offset="55%" stop-color="#f2dfa0"/><stop offset="100%" stop-color="#d9b45c"/>' +
      '</radialGradient>' +
      '<radialGradient id="' + id + '_dark" cx="50%" cy="50%" r="60%">' +
      '<stop offset="0%" stop-color="#2a2450"/><stop offset="100%" stop-color="#14102e"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + (r - 2) + '" fill="url(#' + id + '_dark)"/>' +
      '<path d="' + lit + '" fill="url(#' + id + '_lit)"/>' +
      '</svg>';
  }

  /* ---------- 首页 ---------- */
  const MODULES = [
    { t: 'tarot', icon: '🔮', name: '塔罗牌阵', desc: '翻开命运的纸牌，倾听过去、现在与未来' },
    { t: 'zodiac', icon: '✨', name: '星座运势', desc: '十二星座的今日星语，查收你的专属运势' },
    { t: 'match', icon: '💞', name: '星座配对', desc: '两颗星的距离，藏着怎样的缘分？' },
    { t: 'chart', icon: '🌌', name: '出生星盘', desc: '输入出生信息，还原你降临人间的星图' },
    { t: 'lot', icon: '🎋', name: '每日一签', desc: '摇动签筒，请一支古签为你指点迷津' },
    { t: 'moon', icon: '🌙', name: '月相历法', desc: '跟随月亮的盈亏，安排生活的节奏' },
    { t: 'wish', icon: '🌠', name: '许愿池', desc: '向流星许愿，让星辰见证你的心意' }
  ];

  function renderHome() {
    const d = new Date();
    $('#todayDate').textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 · 星期' + '日一二三四五六'[d.getDay()];
    const mi = moonInfo(d);
    $('#todayMoonIcon').innerHTML = moonSVG(14, mi.frac, 'moonMini');
    $('#todayMoonName').textContent = mi.name;
    $('#todayMoonIllum').textContent = '· 亮度 ' + Math.round(mi.illum * 100) + '%';

    const rng = dayRng('yiji');
    const yi = [pick(window.YI_LIST, rng), pick(window.YI_LIST, rng)];
    const ji = [pick(window.JI_LIST, rng), pick(window.JI_LIST, rng)];
    $('#todayYi').textContent = yi.join(' · ');
    $('#todayJi').textContent = ji.join(' · ');

    $('#heroLine').textContent = '✦ 今日星语：「' + pick(window.QUOTES, dayRng('hero')) + '」';
    $('#homeQuote').textContent = '“' + pick(window.QUOTES, dayRng('quote')) + '”';

    $('#moduleGrid').innerHTML = MODULES.map((m) =>
      '<div class="module-card" data-target="' + m.t + '" role="button" tabindex="0">' +
      '<div class="module-icon">' + m.icon + '</div>' +
      '<div class="module-name">' + m.name + '</div>' +
      '<p class="module-desc">' + m.desc + '</p></div>'
    ).join('');
  }
  $('#moduleGrid').addEventListener('click', (e) => {
    const c = e.target.closest('.module-card');
    if (c) goTo(c.dataset.target);
  });
  $('#moduleGrid').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('module-card')) goTo(e.target.dataset.target);
  });

  /* ---------- 塔罗 ---------- */
  let spreadCount = 1;
  let tarotBusy = false;
  let currentSpread = [];

  $$('.spread-btn').forEach((b) => {
    b.addEventListener('click', () => {
      $$('.spread-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      spreadCount = parseInt(b.dataset.spread, 10);
      playChime([659.25], 0.8, 0.06);
    });
  });

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startTarot() {
    if (tarotBusy) return;
    if (!window.TAROT_CARDS || !window.TAROT_CARDS.length) {
      toast('塔罗牌数据未加载，请确认 js 文件完整');
      return;
    }
    tarotBusy = true;
    $('#tarotSpread').innerHTML = '';
    $('#tarotReading').innerHTML = '';
    $('#tarotSummary').classList.add('hidden');
    $('#tarotAgain').classList.add('hidden');

    const area = $('#shuffleArea');
    area.classList.remove('hidden');
    /* 清空后重建仪式文字元素（不可整体替换 innerHTML，否则会清掉 #shuffleText） */
    area.innerHTML = '';
    let txt = $('#shuffleText');
    if (!txt) {
      txt = document.createElement('p');
      txt.id = 'shuffleText';
      txt.className = 'shuffle-text';
      area.appendChild(txt);
    }
    let cardsHtml = '';
    for (let i = 0; i < 12; i++) {
      cardsHtml += '<span class="shuffle-card" style="--dx:' + Math.round(rand(-230, 230)) + 'px;--dy:' + Math.round(rand(-120, 120)) + 'px;--rot:' + Math.round(rand(-540, 540)) + 'deg;animation-delay:' + rand(0, 0.4).toFixed(2) + 's"></span>';
    }
    area.insertAdjacentHTML('beforeend', cardsHtml);
    playChime([392, 523.25], 1.8, 0.08);

    let li = 0;
    const lines = window.SHUFFLE_LINES || ['星光正在排列…', '洗牌中，请默念你的问题…', '纸牌正感应你的心跳…', '命运在牌堆里苏醒…'];
    const lineTimer = setInterval(() => {
      if (txt) txt.textContent = lines[li % lines.length];
      li++;
    }, 720);
    if (txt) txt.textContent = lines[0];

    setTimeout(() => {
      clearInterval(lineTimer);
      area.classList.add('hidden');
      area.innerHTML = '';
      try {
        finishDeal();
      } catch (err) {
        console.error('塔罗发牌失败：', err);
        tarotBusy = false;
        toast('仪式被星尘干扰了，请再试一次 ✦');
      }
    }, 3300);
  }

  function finishDeal() {
    const ids = shuffleArray(window.TAROT_CARDS.map((c) => c.id)).slice(0, spreadCount);
    currentSpread = ids.map((id) => {
      const card = window.TAROT_CARDS[id];
      return { id, card, reversed: Math.random() < 0.35 };
    });

    const positions = window.TAROT_POSITIONS[spreadCount];
    const rots = spreadCount === 1 ? [0] : [-8, 0, 8];
    const lifts = spreadCount === 1 ? [0] : [-6, -16, -6];

    $('#tarotSpread').innerHTML = currentSpread.map((d, i) => {
      const c = d.card;
      const faceSVG = window.TAROT_SVG
        ? window.TAROT_SVG.face(c, 'tc' + c.id)
        : '<div style="padding:70px 10px;text-align:center"><div style="font-size:52px">' + c.symbol + '</div><div style="margin-top:12px;font-size:18px">' + c.name + '</div></div>';
      return '<div class="tcard" style="--final:translate(0,0) rotate(' + rots[i] + 'deg) scale(1);transition-delay:' + (i * 0.2) + 's">' +
        '<div class="tcard-inner">' +
        '<div class="tcard-face back"><span class="back-orn">☽</span></div>' +
        '<div class="tcard-face front"><div class="front-frame">' + faceSVG + '</div></div>' +
        '</div>' +
        '<div class="tcard-pos" style="transform:translateY(' + lifts[i] + 'px)">' + positions[i] + '</div>' +
        '</div>';
    }).join('');

    const cards = $$('#tarotSpread .tcard');
    if (cards.length) {
      void cards[0].offsetWidth;
      cards.forEach((c) => c.classList.add('dealt'));
    }
    setTimeout(() => playChime([523.25, 659.25], 1.4, 0.07), 500);
    setTimeout(() => { tarotBusy = false; }, 600);
  }

  $('#tarotSpread').addEventListener('click', (e) => {
    const cardEl = e.target.closest('.tcard');
    if (!cardEl || cardEl.classList.contains('flipped') || !cardEl.classList.contains('dealt')) return;
    const i = $$('#tarotSpread .tcard').indexOf(cardEl);
    const d = currentSpread[i];
    cardEl.classList.add('flipped');
    if (d.reversed) cardEl.classList.add('rev');
    playChime([523.25, 659.25], 1.3, 0.08);
    setTimeout(() => renderCardReading(i, d), 1000);
    if ($$('#tarotSpread .tcard.flipped').length === currentSpread.length) {
      setTimeout(showSummary, 1800);
    }
  });

  function renderCardReading(i, d) {
    const c = d.card;
    const u = d.reversed ? c.rev : c.up;
    const positions = window.TAROT_POSITIONS[spreadCount];
    const el = document.createElement('div');
    el.className = 'card-reading';
    el.innerHTML =
      '<div class="cr-head">' +
      '<span class="cr-pos">' + positions[i] + '</span>' +
      '<span class="cr-name">' + c.name + '</span>' +
      '<span class="cr-en">' + c.en + '</span>' +
      '<span class="cr-badge ' + (d.reversed ? 'reversed' : 'upright') + '">' + (d.reversed ? '逆位' : '正位') + '</span>' +
      '</div>' +
      '<div class="cr-kws">' + u.kw.map((k) => '<span class="kw">' + k + '</span>').join('') + '</div>' +
      '<p class="cr-desc">' + u.desc + '</p>' +
      '<p class="cr-advice">' + pick(window.ADVICE_POOL, mulberry32(Date.now() + i)) + '</p>';
    $('#tarotReading').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showSummary() {
    const q = $('#tarotQuestion').value.trim();
    const positions = window.TAROT_POSITIONS[spreadCount];
    const line = currentSpread.map((d, i) => positions[i] + ' · ' + d.card.name + '（' + (d.reversed ? '逆位' : '正位') + '）').join('　｜　');
    const kws = currentSpread.map((d) => (d.reversed ? d.card.rev.kw : d.card.up.kw).join('、')).join('；');
    const sum = $('#tarotSummary');
    sum.innerHTML =
      '<h3>✦ 综合启示 ✦</h3>' +
      '<p>' + line + '</p>' +
      '<p class="sum-line">' + kws + ' —— ' + pick(window.SUMMARY_POOL, dayRng('summary')) + '</p>' +
      (q ? '<p>你问：「' + q + '」—— 星辰已收到，答案就在牌中。</p>' : '');
    sum.classList.remove('hidden');
    $('#tarotAgain').classList.remove('hidden');
    playChime([523.25, 659.25, 783.99], 2.2, 0.09);
    sum.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  $('#tarotStart').addEventListener('click', startTarot);
  $('#tarotAgain').addEventListener('click', startTarot);
  $('#tarotQuestion').addEventListener('keydown', (e) => { if (e.key === 'Enter') startTarot(); });

  /* ---------- 星座运势 ---------- */
  function todaySignIndex() {
    const d = new Date();
    const m = d.getMonth() + 1, day = d.getDate();
    const table = [[1, 20, 10], [2, 19, 11], [3, 21, 0], [4, 20, 1], [5, 21, 2], [6, 22, 3], [7, 23, 4], [8, 23, 5], [9, 23, 6], [10, 24, 7], [11, 23, 8], [12, 22, 9]];
    for (const [mm, dd, idx] of table) { if (m === mm && day >= dd) return idx; }
    return 9;
  }

  function starsHTML(n) {
    let s = '';
    for (let i = 1; i <= 5; i++) s += '<span class="' + (i <= n ? 'on' : 'off') + '">★</span>';
    return s;
  }

  function renderSignGrid() {
    $('#signGrid').innerHTML = window.ZODIAC_SIGNS.map((s, i) =>
      '<div class="sign-card' + (i === todaySignIndex() ? ' selected' : '') + '" data-i="' + i + '" role="button" tabindex="0">' +
      '<div class="sign-icon">' + s.symbol + '</div>' +
      '<div class="sign-name">' + s.name + '</div>' +
      '<div class="sign-dates">' + s.dates + '</div>' +
      '<span class="sign-tag">' + s.element + '象 · ' + s.ruler + '</span>' +
      '</div>'
    ).join('');
  }
  $('#signGrid').addEventListener('click', (e) => {
    const c = e.target.closest('.sign-card');
    if (c) showZodiacDetail(parseInt(c.dataset.i, 10));
  });
  $('#signGrid').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('sign-card')) showZodiacDetail(parseInt(e.target.dataset.i, 10));
  });

  function showZodiacDetail(idx) {
    const s = window.ZODIAC_SIGNS[idx];
    $$('#signGrid .sign-card').forEach((c) => c.classList.toggle('selected', parseInt(c.dataset.i, 10) === idx));
    const rng = dayRng('zodiac' + idx);
    const score = (f) => { const r = rng(); return r < 0.08 ? 2 : r < 0.38 ? 3 : r < 0.82 ? 4 : 5; };
    const sc = { 综合: score(), 爱情: score(), 事业: score(), 财运: score(), 健康: score() };
    const luckyColor = pick(window.LUCKY_COLORS, rng);
    const luckyNum = 1 + Math.floor(rng() * 99);
    const luckySign = window.ZODIAC_SIGNS[Math.floor(rng() * 12)].name;
    const quote = pick(window.QUOTES, rng);
    let tip = pick(window.TIPS, rng).replace('幸运色', luckyColor.name);

    const d = new Date();
    const dateTxt = d.getMonth() + 1 + '月' + d.getDate() + '日';
    const domains = [
      ['整体', window.FORTUNE_TEXTS.overall],
      ['爱情', window.FORTUNE_TEXTS.love],
      ['事业', window.FORTUNE_TEXTS.career],
      ['财运', window.FORTUNE_TEXTS.wealth],
      ['健康', window.FORTUNE_TEXTS.health]
    ];

    $('#zodiacDetail').innerHTML =
      '<div class="zd-head">' +
      '<div class="zd-icon" style="color:' + s.color + '">' + s.symbol + '</div>' +
      '<div><h3>' + s.name + ' <span class="zd-en">' + s.en.toUpperCase() + '</span></h3>' +
      '<p class="zd-meta">' + s.dates + ' · ' + s.element + '象星座 · 守护星：' + s.ruler + ' · ' + s.kw.join(' / ') + '</p></div>' +
      '<span class="zd-badge">' + dateTxt + ' 运势</span>' +
      '</div>' +
      '<div class="zd-scores">' +
      Object.keys(sc).map((k) => '<div class="score-row"><span class="score-label">' + k + '</span><span class="score-stars">' + starsHTML(sc[k]) + '</span></div>').join('') +
      '</div>' +
      '<div class="zd-lucky">' +
      '<span class="lucky-item">幸运色 <b style="color:' + luckyColor.hex + '">' + luckyColor.name + '</b></span>' +
      '<span class="lucky-color" style="background:' + luckyColor.hex + ';color:' + luckyColor.hex + '"></span>' +
      '<span class="lucky-item">幸运数字 <b>' + luckyNum + '</b></span>' +
      '<span class="lucky-item">幸运星座 <b>' + luckySign + '</b></span>' +
      '</div>' +
      '<div class="zd-texts">' +
      '<p class="zd-text"><b>关于你　</b>' + s.desc + '</p>' +
      domains.map(([k, arr]) => '<p class="zd-text"><b>' + k + '　</b>' + pick(arr, rng) + '</p>').join('') +
      '</div>' +
      '<p class="zd-quote">“' + quote + '”</p>' +
      '<p class="zd-tip">💡 开运提示：' + tip + '</p>';

    $('#zodiacDetail').classList.remove('hidden');
    $('#zodiacDetail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    playChime([659.25], 1.0, 0.06);
  }

  /* ---------- 星座配对 ---------- */
  function fillSelects() {
    const opts = window.ZODIAC_SIGNS.map((s, i) => '<option value="' + i + '">' + s.symbol + ' ' + s.name + '</option>').join('');
    $('#signA').innerHTML = opts;
    $('#signB').innerHTML = opts;
    $('#signA').value = todaySignIndex();
    $('#signB').value = (todaySignIndex() + 4) % 12;
  }
  $('#diceBtn').addEventListener('click', () => {
    $('#signA').value = Math.floor(Math.random() * 12);
    playChime([783.99], 0.7, 0.06);
  });

  function elementKey(i) { return window.ZODIAC_SIGNS[i].element; }
  function hasEl(i, e) { return elementKey(i) === e; }

  function runMatch() {
    const a = parseInt($('#signA').value, 10);
    const b = parseInt($('#signB').value, 10);
    const A = window.ZODIAC_SIGNS[a], B = window.ZODIAC_SIGNS[b];

    const rng = mulberry32(hashStr(A.name + '×' + B.name));
    let base;
    if (a === b) base = 88;
    else {
      const elKey = [A.element, B.element].sort().join('');
      base = window.COMPAT.elemBase[elKey] || 70;
      if (window.COMPAT.special.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) base += 8;
    }
    base += Math.floor(rng() * 15) - 7;
    const score = clamp(base, 42, 98);
    const jit = () => Math.floor(rng() * 13) - 6;
    const mix = (e) => (hasEl(a, e) ? 1 : 0) + (hasEl(b, e) ? 1 : 0);
    const aspects = {
      '激情': clamp(40 + mix('火') * 22 + mix('水') * 10 + jit(), 30, 99),
      '沟通': clamp(40 + mix('风') * 24 + mix('水') * 8 + jit(), 30, 99),
      '长久': clamp(40 + mix('土') * 24 + mix('水') * 6 + jit(), 30, 99),
      '浪漫': clamp(40 + mix('水') * 20 + (hasEl(a, '风') || hasEl(b, '风') ? 8 : 0) + jit(), 30, 99)
    };
    const elKey = a === b ? 'same' : [A.element, B.element].sort().join('');
    const text = window.COMPAT.texts[elKey] || window.COMPAT.texts.same;
    const advice = pick(window.COMPAT.advice, rng);

    const box = $('#matchResult');
    box.classList.remove('hidden');
    box.innerHTML =
      '<div class="mr-top">' +
      '<div class="mr-signs">' +
      '<div class="mr-sign"><span class="s-icon">' + A.symbol + '</span><span class="s-name">' + A.name + '</span></div>' +
      '<span class="mr-heart">💞</span>' +
      '<div class="mr-sign"><span class="s-icon">' + B.symbol + '</span><span class="s-name">' + B.name + '</span></div>' +
      '</div>' +
      '<div class="mr-ring">' +
      '<svg width="150" height="150" viewBox="0 0 150 150">' +
      '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#7a5fc0"/><stop offset="100%" stop-color="#f2d98d"/>' +
      '</linearGradient></defs>' +
      '<circle class="ring-bg" cx="75" cy="75" r="54"/>' +
      '<circle class="ring-val" cx="75" cy="75" r="54" data-score="' + score + '"/>' +
      '</svg>' +
      '<div class="mr-score"><span class="num">0</span><span class="cap">缘分指数</span></div>' +
      '</div>' +
      '</div>' +
      '<div class="mr-aspects">' +
      Object.keys(aspects).map((k) =>
        '<div class="aspect-row"><span class="aspect-label">' + k + '</span>' +
        '<div class="aspect-bar"><div class="aspect-fill" data-w="' + aspects[k] + '"></div></div>' +
        '<span class="aspect-num">' + aspects[k] + '</span></div>'
      ).join('') +
      '</div>' +
      '<p class="mr-text">' + text + '</p>' +
      '<p class="mr-advice">' + advice + '</p>';

    playChime([392, 523.25, 659.25], 1.8, 0.08);
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    requestAnimationFrame(() => {
      const ring = box.querySelector('.ring-val');
      ring.style.strokeDashoffset = 339.29 * (1 - score / 100);
      box.querySelectorAll('.aspect-fill').forEach((f) => { f.style.width = f.dataset.w + '%'; });
      const num = box.querySelector('.mr-score .num');
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1500);
        num.textContent = Math.round(score * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  $('#matchBtn').addEventListener('click', runMatch);

  /* ---------- 每日一签 ---------- */
  (function initLotSticks() {
    let s = '';
    for (let i = 0; i < 9; i++) {
      const o = Math.floor(rand(-8, 8));
      s += '<span class="stick" style="transform:translateY(' + o + 'px) rotate(' + rand(-4, 4) + 'deg)"></span>';
    }
    $('#lotSticks').innerHTML = s;
  })();

  $('#lotBtn').addEventListener('click', () => {
    const tube = $('#lotTube');
    if (tube.classList.contains('shaking')) return;
    tube.classList.add('shaking');
    playChime([392, 523.25], 1.2, 0.08);
    setTimeout(() => {
      tube.classList.remove('shaking');
      const lot = window.LOTS[Math.floor(dayRng('lot')() * window.LOTS.length)];
      const box = $('#lotResult');
      box.classList.remove('hidden');
      const levelNames = ['上上签', '上吉签', '中吉签', '中平签', '中下签', '下下签'];
      box.innerHTML =
        '<div class="lr-badge l' + lot.level + '">' + levelNames[lot.level] + '</div>' +
        '<div class="lr-title">' + lot.title + '</div>' +
        '<div class="lr-poem">' + lot.poem.join('<br>') + '</div>' +
        '<p class="lr-text">' + lot.text + '</p>' +
        '<p class="lr-advice">' + lot.advice + '</p>';
      const base = [523.25, 659.25][lot.level <= 1 ? 1 : 0];
      playChime([base, base * 1.25, base * 1.5], 2, lot.level <= 1 ? 0.1 : 0.06);
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 950);
  });

  /* ---------- 月相历法 ---------- */
  function renderMoonPage() {
    const mi = moonInfo();
    $('#moonDisc').innerHTML = moonSVG(50, mi.frac, 'moonMain');
    $('#moonPhaseName').textContent = mi.name;
    $('#moonIllum').textContent = '月相亮度 ' + Math.round(mi.illum * 100) + '% · 月龄 ' + mi.age.toFixed(1) + ' 天';
    $('#moonDesc').textContent = MOON_PHASES[mi.name].desc;
    $('#moonYi').innerHTML = MOON_PHASES[mi.name].yi.map((x) => '<li>' + x + '</li>').join('');
    $('#moonJi').innerHTML = MOON_PHASES[mi.name].ji.map((x) => '<li>' + x + '</li>').join('');
    $('#moonNext').innerHTML = '距下一次满月约 <b style="color:var(--gold-bright)">' + Math.round(mi.nextFull) + '</b> 天<br>距下一次新月约 <b style="color:var(--gold-bright)">' + Math.round(mi.nextNew) + '</b> 天';
  }

  /* ---------- 许愿池 ---------- */
  const wishStore = (function () {
    try { return JSON.parse(localStorage.getItem('mystic:wishes') || '[]'); }
    catch (e) { return []; }
  })();

  function saveWishes() {
    try { localStorage.setItem('mystic:wishes', JSON.stringify(wishStore)); } catch (e) { /* 隐私模式忽略 */ }
  }

  function renderWishList() {
    const box = $('#wishList');
    if (!wishStore.length) {
      box.innerHTML = '<div class="wish-empty">🌠 尚未许愿，星星在等你。</div>';
      $('#wishClear').classList.add('hidden');
      return;
    }
    $('#wishClear').classList.remove('hidden');
    box.innerHTML = wishStore.slice().reverse().map((w) =>
      '<div class="wish-item">' +
      '<span class="wish-star">⭐</span>' +
      '<span class="wish-text">' + escapeHtml(w.text) + '</span>' +
      '<span class="wish-date">' + w.date + '</span>' +
      '<button class="wish-del" data-id="' + w.id + '" title="让这个心愿随风而去">✕</button>' +
      '</div>'
    ).join('');
  }
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  $('#wishBtn').addEventListener('click', () => {
    const input = $('#wishInput');
    const text = input.value.trim();
    if (!text) { toast('先写下心愿，星星才听得见'); input.focus(); return; }
    wishStore.push({ id: Date.now(), text, date: todayStr });
    saveWishes();
    input.value = '';
    renderWishList();
    playChime([523.25, 659.25, 783.99], 2.0, 0.09);

    const r = $('#wishBtn').getBoundingClientRect();
    const star = document.createElement('span');
    star.className = 'star-fly';
    star.textContent = pick(['⭐', '🌟', '✨', '💫']);
    star.style.left = (r.left + r.width / 2) + 'px';
    star.style.top = (r.top) + 'px';
    star.style.setProperty('--dx', Math.round(rand(-150, 150)) + 'px');
    star.style.setProperty('--rot', Math.round(rand(120, 320)) + 'deg');
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 2700);
    toast('心愿已放飞，星辰已见证 ✦');
  });
  $('#wishInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#wishBtn').click(); });
  $('#wishList').addEventListener('click', (e) => {
    const btn = e.target.closest('.wish-del');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    const i = wishStore.findIndex((w) => w.id === id);
    if (i >= 0) wishStore.splice(i, 1);
    saveWishes();
    renderWishList();
    playChime([392], 0.8, 0.05);
  });
  $('#wishClear').addEventListener('click', () => {
    if (window.confirm('确定要让这些心愿随风而去吗？')) {
      wishStore.length = 0;
      saveWishes();
      renderWishList();
      toast('心愿已随风而去，新的星光正在酝酿');
    }
  });

  /* ---------- 出生星盘 ---------- */
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const normDeg = (x) => ((x % 360) + 360) % 360;
  const PLANET_LIST = [
    ['太阳', '☉', 'sun'], ['月亮', '☽', 'moon'], ['水星', '☿', 'merc'], ['金星', '♀', 'venus'],
    ['火星', '♂', 'mars'], ['木星', '♃', 'jup'], ['土星', '♄', 'sat']
  ];

  function calcChart(dateStr, timeStr, city) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    const local = new Date(y, m - 1, d, hh || 12, mm || 0, 0);
    const ut = local.getTime() - (city.tz || 8) * 3600000;   /* 本地时间 → 世界时 */
    const days = (ut - J2000) / 86400000;
    const T = days / 36525;
    const rad = Math.PI / 180;

    /* 太阳（含中心差，精度约 0.1°） */
    const L0 = normDeg(280.460 + 0.9856474 * days);
    const g = normDeg(357.528 + 0.9856003 * days) * rad;
    const sun = normDeg(L0 + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
    /* 月亮（平均黄经，娱乐级精度） */
    const moon = normDeg(218.316 + 13.176396 * days);
    /* 行星平均黄经（未含摄动，用于定星座绰绰有余） */
    const merc = normDeg(252.2509 + 149472.6746 * T);
    const venus = normDeg(181.9798 + 58517.8157 * T);
    const mars = normDeg(355.4330 + 19140.2993 * T);
    const jup = normDeg(34.3515 + 3034.9057 * T);
    const sat = normDeg(50.0774 + 1222.1138 * T);

    /* 恒星时与上升/中天 */
    const gmst = normDeg(280.46061837 + 360.98564736629 * days + 0.000387933 * T * T);
    const lst = normDeg(gmst + city.lon);
    const eps = (23.4393 - 0.013 * T) * rad;
    const lat = city.lat * rad;
    const ramc = lst * rad;
    const asc = normDeg(Math.atan2(-Math.cos(ramc), Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)) / rad);
    const mc = normDeg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / rad);

    return { sun: sun, moon: moon, merc: merc, venus: venus, mars: mars, jup: jup, sat: sat, asc: asc, mc: mc };
  }

  function signOf(lon) {
    const idx = Math.floor(normDeg(lon) / 30) % 12;
    return { idx: idx, sign: window.ZODIAC_SIGNS[idx], deg: Math.floor(normDeg(lon) % 30) };
  }

  function chartWheelSVG(calc, uid) {
    const cx = 190, cy = 190;
    const px = (lon, R) => {
      const a = lon * Math.PI / 180;
      return [cx + R * Math.sin(a), cy - R * Math.cos(a)];
    };
    const elColor = { '火': 'rgba(224,82,60,', '土': 'rgba(127,191,107,', '风': 'rgba(91,184,216,', '水': 'rgba(143,143,216,' };
    let s = '<svg viewBox="0 0 380 380" width="380" height="380" role="img" aria-label="出生星盘">';

    /* 外圈十二宫 */
    for (let i = 0; i < 12; i++) {
      const z = window.ZODIAC_SIGNS[i];
      const a0 = i * 30, a1 = a0 + 30;
      const o0 = px(a0, 172), o1 = px(a1, 172), i0 = px(a0, 146), i1 = px(a1, 146);
      const wedge = 'M' + o0[0].toFixed(1) + ' ' + o0[1].toFixed(1) + ' L' + i0[0].toFixed(1) + ' ' + i0[1].toFixed(1) +
        ' A146 146 0 0 0 ' + i1[0].toFixed(1) + ' ' + i1[1].toFixed(1) +
        ' L' + o1[0].toFixed(1) + ' ' + o1[1].toFixed(1) +
        ' A172 172 0 0 1 ' + o0[0].toFixed(1) + ' ' + o0[1].toFixed(1) + ' Z';
      s += '<path d="' + wedge + '" fill="' + elColor[z.element] + '0.09)" stroke="rgba(217,180,92,0.22)" stroke-width="0.6"/>';
      const g = px(a0 + 15, 159);
      s += '<text x="' + g[0].toFixed(1) + '" y="' + (g[1] + 5).toFixed(1) + '" text-anchor="middle" font-size="13" fill="' + z.color + '">' + z.symbol + '</text>';
    }
    /* 宫位辐条（等宫制，自上升起 30° 一宫） */
    for (let i = 0; i < 12; i++) {
      const cusp = calc.asc + i * 30;
      const h = px(cusp, 146);
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + h[0].toFixed(1) + '" y2="' + h[1].toFixed(1) + '" stroke="rgba(158,193,255,0.3)" stroke-width="0.9"/>';
      const n = px(cusp + 15, 124);
      s += '<text x="' + n[0].toFixed(1) + '" y="' + (n[1] + 3.5).toFixed(1) + '" text-anchor="middle" font-size="9.5" fill="#6f6790">' + (i + 1) + '</text>';
    }
    /* 行星 */
    for (const [name, glyph, key] of PLANET_LIST) {
      const lon = calc[key];
      const p = px(lon, 102);
      s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 5.5).toFixed(1) + '" text-anchor="middle" font-size="16" fill="#f2d98d">' + glyph + '</text>';
      s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 18).toFixed(1) + '" text-anchor="middle" font-size="7" fill="#8f84b8">' + Math.floor(normDeg(lon) % 30) + '°</text>';
    }
    /* 上升与中天标记 */
    const a1 = px(calc.asc, 142), a2 = px(calc.asc + 3.5, 128), a3 = px(calc.asc - 3.5, 128);
    s += '<polygon points="' + a1[0].toFixed(1) + ',' + a1[1].toFixed(1) + ' ' + a2[0].toFixed(1) + ',' + a2[1].toFixed(1) + ' ' + a3[0].toFixed(1) + ',' + a3[1].toFixed(1) + '" fill="#f2d98d"/>';
    const la = px(calc.asc, 182);
    s += '<text x="' + la[0].toFixed(1) + '" y="' + (la[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="10" fill="#f2d98d" letter-spacing="1">ASC</text>';
    const m1 = px(calc.mc - 4, 140), m2 = px(calc.mc + 4, 140), m3 = px(calc.mc, 132), m4 = px(calc.mc, 148);
    s += '<path d="M' + m1[0].toFixed(1) + ' ' + m1[1].toFixed(1) + ' L' + m2[0].toFixed(1) + ' ' + m2[1].toFixed(1) + ' M' + m3[0].toFixed(1) + ' ' + m3[1].toFixed(1) + ' L' + m4[0].toFixed(1) + ' ' + m4[1].toFixed(1) + '" stroke="#8fd0a0" stroke-width="1.6"/>';
    const lm = px(calc.mc, 182);
    s += '<text x="' + lm[0].toFixed(1) + '" y="' + (lm[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="10" fill="#8fd0a0" letter-spacing="1">MC</text>';
    /* 中心装饰 */
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="50" fill="rgba(13,10,31,0.65)" stroke="rgba(217,180,92,0.3)" stroke-width="1"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="44" fill="none" stroke="rgba(217,180,92,0.12)" stroke-dasharray="3 5"/>';
    s += '<text x="' + cx + '" y="' + (cy - 6) + '" text-anchor="middle" font-size="24" fill="#f2d98d">☾</text>';
    s += '<text x="' + cx + '" y="' + (cy + 18) + '" text-anchor="middle" font-size="10" fill="#8f84b8" letter-spacing="3">星月占卜馆</text>';
    s += '</svg>';
    return s;
  }

  function renderChart() {
    const dateStr = $('#chartDate').value || '2000-01-01';
    const timeStr = $('#chartTime').value || '12:00';
    const cityIdx = parseInt($('#chartCity').value, 10) || 0;
    const city = window.CHART_CITIES[cityIdx];
    const calc = calcChart(dateStr, timeStr, city);

    /* 行星列表 */
    let rows = PLANET_LIST.map(([name, glyph, key]) => {
      const so = signOf(calc[key]);
      return '<div class="cp-row"><span class="cp-glyph">' + glyph + '</span>' +
        '<span class="cp-name">' + name + '</span>' +
        '<span class="cp-sign" style="color:' + so.sign.color + '">' + so.sign.symbol + ' ' + so.sign.name + '</span>' +
        '<span class="cp-deg">' + so.deg + '°</span></div>';
    }).join('');
    const ascSo = signOf(calc.asc), mcSo = signOf(calc.mc);
    rows += '<div class="cp-row cp-special"><span class="cp-glyph">⤒</span><span class="cp-name">上升</span>' +
      '<span class="cp-sign" style="color:' + ascSo.sign.color + '">' + ascSo.sign.symbol + ' ' + ascSo.sign.name + '</span>' +
      '<span class="cp-deg">' + ascSo.deg + '°</span></div>';
    rows += '<div class="cp-row cp-special"><span class="cp-glyph">☊</span><span class="cp-name">中天</span>' +
      '<span class="cp-sign" style="color:' + mcSo.sign.color + '">' + mcSo.sign.symbol + ' ' + mcSo.sign.name + '</span>' +
      '<span class="cp-deg">' + mcSo.deg + '°</span></div>';

    /* 元素平衡 */
    const counts = { '火': 0, '土': 0, '风': 0, '水': 0 };
    for (const [, , key] of PLANET_LIST) counts[signOf(calc[key]).sign.element]++;
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const dominant = counts[sorted[0]] >= 3 ? sorted[0] : '均衡';

    /* 解读 */
    const sunSo = signOf(calc.sun), moonSo = signOf(calc.moon);
    const readings =
      '<div class="chart-reading"><b>☉ 太阳 · ' + sunSo.sign.name + '</b><p>' + sunSo.sign.desc + '</p></div>' +
      '<div class="chart-reading"><b>☽ 月亮 · ' + moonSo.sign.name + '</b><p>月亮掌管情绪与安全感：月落' + moonSo.sign.name + '的你，情绪的底色是「' + moonSo.sign.kw.join('、') + '」，内心深处最需要的是' + moonSo.sign.element + '元素带来的滋养。</p></div>' +
      '<div class="chart-reading"><b>⤒ 上升 · ' + ascSo.sign.name + '</b><p>' + window.ASC_TEXTS[ascSo.idx] + '</p></div>' +
      '<div class="chart-reading"><b>元素能量</b><p>' + window.ELEMENT_TEXTS[dominant] + '（火 ' + counts['火'] + ' · 土 ' + counts['土'] + ' · 风 ' + counts['风'] + ' · 水 ' + counts['水'] + '）</p></div>';

    $('#chartWheel').innerHTML = chartWheelSVG(calc, 'ch');
    $('#chartPlanets').innerHTML = rows;
    $('#chartReadings').innerHTML = readings;
    $('#chartResult').classList.remove('hidden');
    playChime([392, 523.25, 659.25], 2.0, 0.07);
  }

  function initChart() {
    if (!window.CHART_CITIES) return;
    const d = new Date();
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    $('#chartDate').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    $('#chartCity').innerHTML = window.CHART_CITIES.map((c, i) => '<option value="' + i + '">' + c.name + '</option>').join('');
    $('#chartCity').value = 0;
    renderChart();
  }
  $('#chartBtn').addEventListener('click', renderChart);

  /* ---------- 启动 ---------- */
  function init() {
    updateSoundBtn();
    /* 每步独立容错：单个模块失败不再拖垮整个页面 */
    const steps = [
      ['首页', renderHome],
      ['月相历法', renderMoonPage],
      ['星座运势', renderSignGrid],
      ['星座配对', fillSelects],
      ['出生星盘', initChart],
      ['许愿池', renderWishList]
    ];
    for (const [name, fn] of steps) {
      try { fn(); }
      catch (err) { console.error('初始化失败：' + name, err); }
    }
    const target = location.hash.replace('#', '');
    if (target && document.getElementById(target)) goTo(target);
    try { showZodiacDetail(todaySignIndex()); }
    catch (err) { console.error('星座详情初始化失败：', err); }
  }
  document.addEventListener('DOMContentLoaded', init);

  /* 全局兜底：任何未捕获异常都以提示条呈现，避免“卡死”错觉 */
  window.addEventListener('error', (e) => {
    try { toast('✨ 星尘波动：' + (e.message || '未知错误')); } catch (err) { /* 忽略 */ }
  });
})();
