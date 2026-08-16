/* ============================================================
   星月占卜馆 · 手绘风格 SVG 牌面生成器
   22 张大阿卡纳 = 手绘线稿徽章；56 张小阿卡纳 = 元素圣徽 + 点数排列
   所有线条通过 feTurbulence/feDisplacementMap 抖动滤镜获得手绘笔触感
   ============================================================ */

window.TAROT_SVG = (function () {
  'use strict';

  /* ---------- 确定性随机（让每张牌的笔触抖动稳定） ---------- */
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

  /* ---------- 公共样式 ---------- */
  const INK = 'fill="none" stroke="#e6c87c" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"';
  const INK_THIN = 'fill="none" stroke="#c9a95e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
  const ACCENT = 'fill="none" stroke="#9ec1ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  function sketchFilter(uid) {
    return '<filter id="sk' + uid + '" x="-40%" y="-40%" width="180%" height="180%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.028 0.036" numOctaves="2" seed="' + (hashStr(uid) % 199) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/>' +
      '</filter>';
  }
  function glowFilter(uid) {
    return '<filter id="gl' + uid + '">' +
      '<feGaussianBlur stdDeviation="2" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>';
  }
  function grainFilter(uid) {
    return '<filter id="noi' + uid + '" x="0%" y="0%" width="100%" height="100%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.86  0 0 0 0 0.78  0 0 0 0 0.62  0 0 0 0.05 0"/>' +
      '</filter>';
  }

  /* ---------- 手绘边框（逐顶点抖动） ---------- */
  function framePath(uid) {
    const rng = mulberry32(hashStr(uid + 'fr'));
    const j = (a) => (a + (rng() - 0.5) * 4).toFixed(1);
    const x0 = 6, y0 = 6, x1 = 144, y1 = 244;
    const mx = 75, my = 125;
    return 'M ' + j(x0) + ' ' + j(my) + ' L ' + j(x0) + ' ' + j(y0) +
      ' L ' + j(mx) + ' ' + j(y0) + ' L ' + j(x1) + ' ' + j(y0) +
      ' L ' + j(x1) + ' ' + j(my) + ' L ' + j(x1) + ' ' + j(y1) +
      ' L ' + j(mx) + ' ' + j(y1) + ' L ' + j(x0) + ' ' + j(y1) + ' Z';
  }

  /* ---------- 22 张大阿卡纳线稿徽章（100×100 局部坐标，居中放置） ---------- */
  const MAJOR = [
    /* 0 愚者：行者手杖 + 远山太阳 */
    ['<circle cx="50" cy="36" r="7.5"/>', '<path d="M50 44 L50 62"/>', '<path d="M50 62 L44 76 M50 62 L56 76"/>',
     '<path d="M42 50 L28 62 M28 62 L24 57 M28 62 L31 68"/>',
     '<circle cx="82" cy="22" r="8"/>',
     '<path d="M82 9 L82 35 M68 22 L96 22 M77 4 L87 4 M77 40 L87 40"/>'],
    /* 1 魔术师：无穷符号 + 祭台 */
    ['<path d="M28 46 C 38 32 62 32 72 46 C 62 60 38 60 28 46" ' + INK + '/>',
     '<path d="M24 78 L76 78" ' + INK + '/>', '<path d="M50 78 L50 92" ' + INK + '/>',
     '<circle cx="33" cy="78" r="3.2" ' + INK + '/>', '<circle cx="67" cy="78" r="3.2" ' + INK + '/>',
     '<path d="M41 68 L41 76 M59 68 L59 76" ' + INK_THIN + '/>'],
    /* 2 女祭司：新月 + 帷幕 + 经卷 */
    ['<path d="M66 16 A 22 22 0 1 0 86 36 A 16 16 0 1 1 66 16" ' + INK + '/>',
     '<path d="M31 76 Q 50 28 69 76" ' + INK + '/>',
     '<path d="M40 82 L60 82 L60 95 L40 95 Z" ' + INK + '/>', '<path d="M50 82 L50 95" ' + INK_THIN + '/>',
     '<circle cx="50" cy="56" r="5" ' + INK_THIN + '/>'],
    /* 3 皇后：星冠 + 维纳斯 + 麦穗 */
    ['<path d="M36 32 L42 16 L50 26 L58 16 L64 32 Z" ' + INK + '/>', '<path d="M33 34 L67 34" ' + INK + '/>',
     '<circle cx="50" cy="70" r="8" ' + INK + '/>', '<path d="M50 78 L50 93 M44 86 L56 86" ' + INK + '/>',
     '<path d="M23 70 Q 19 54 25 40" ' + INK_THIN + '/>', '<path d="M77 70 Q 81 54 75 40" ' + INK_THIN + '/>',
     '<path d="M24 60 L17 57 M24 50 L17 47 M76 60 L83 57 M76 50 L83 47" ' + INK_THIN + '/>'],
    /* 4 皇帝：王冠 + 权杖 + 宝座 */
    ['<path d="M36 38 L42 24 L50 32 L58 24 L64 38 Z" ' + INK + '/>', '<path d="M34 40 L66 40" ' + INK + '/>',
     '<path d="M73 40 L73 90 M69 47 L77 47" ' + INK + '/>',
     '<path d="M25 88 L75 88 M29 66 L29 88 M71 66 L71 88 M29 66 L23 79 M71 66 L77 79" ' + INK + '/>'],
    /* 5 教皇：三重十字 + 双钥匙 */
    ['<path d="M50 20 L50 46 M42 26 L58 26 M45 33 L55 33" ' + INK + '/>',
     '<circle cx="34" cy="66" r="7" ' + INK + '/>', '<path d="M34 73 L34 86 M28 74 L28 83 M40 74 L40 83" ' + INK_THIN + '/>',
     '<circle cx="66" cy="66" r="7" ' + INK + '/>', '<path d="M66 73 L66 86 M60 74 L60 83 M72 74 L72 83" ' + INK_THIN + '/>'],
    /* 6 恋人：太阳 + 双环 + 心 */
    ['<circle cx="50" cy="14" r="5" ' + INK + '/>', '<path d="M50 5 L50 9 M50 19 L50 23 M39 14 L43 14 M57 14 L61 14" ' + INK_THIN + '/>',
     '<circle cx="36" cy="46" r="13" ' + INK + '/>', '<circle cx="64" cy="46" r="13" ' + INK + '/>',
     '<path d="M50 66 C 43 58 31 62 31 70 C 31 79 50 90 50 90 C 50 90 69 79 69 70 C 69 62 57 58 50 66 Z" ' + INK + ' fill="rgba(224,82,60,0.14)"/>'],
    /* 7 战车：华盖 + 车轮 + 车辕 */
    ['<path d="M30 22 L70 22 M33 22 L29 36 M67 22 L71 36" ' + INK + '/>',
     '<circle cx="50" cy="58" r="16" ' + INK + '/>',
     '<path d="M50 42 L50 74 M34 58 L66 58 M38.7 46.7 L61.3 69.3 M61.3 46.7 L38.7 69.3" ' + INK_THIN + '/>',
     '<path d="M50 74 L50 92" ' + INK + '/>'],
    /* 8 力量：∞ + 狮首鬃毛 */
    ['<path d="M40 20 A 9 9 0 1 0 60 26 A 9 9 0 1 0 40 20" ' + INK + '/>',
     '<path d="M33 62 L28 57 L33 54 L31 48 L37 47 L39 41 L46 44 L50 39 L54 44 L61 41 L63 47 L69 48 L67 54 L72 57 L67 62 L72 67 L67 70 L69 76 L63 77 L61 83 L54 80 L50 85 L46 80 L39 83 L37 77 L31 76 L33 70 L28 67 Z" ' + INK + ' fill="rgba(217,180,92,0.08)"/>',
     '<circle cx="50" cy="62" r="6" ' + INK + '/>'],
    /* 9 隐士：提灯 + 手杖 */
    ['<path d="M50 22 L50 40" ' + INK + '/>', '<path d="M42 40 L58 40 L58 56 L42 56 Z" ' + INK + ' fill="rgba(242,217,141,0.16)"/>',
     '<path d="M36 46 L42 46 M58 46 L64 46 M38 50 L35 53 M62 50 L65 53" ' + INK_THIN + '/>',
     '<path d="M68 18 L54 88" ' + INK + '/>'],
    /* 10 命运之轮：双环 + 辐条 + 顶弧 */
    ['<circle cx="50" cy="52" r="26" ' + INK + '/>', '<circle cx="50" cy="52" r="15" ' + INK + '/>',
     '<path d="M50 26 L50 78 M24 52 L76 52 M31.6 33.6 L68.4 70.4 M68.4 33.6 L31.6 70.4" ' + INK_THIN + '/>',
     '<path d="M40 12 A 34 34 0 0 1 60 12" ' + INK + '/>', '<circle cx="50" cy="6" r="2.2" ' + INK + '/>'],
    /* 11 正义：天平 + 剑 */
    ['<path d="M50 14 L50 90" ' + INK + '/>', '<path d="M30 32 L70 32" ' + INK + '/>',
     '<path d="M30 32 L24 46 M70 32 L76 46" ' + INK + '/>',
     '<path d="M15 46 A 9 9 0 0 0 33 46" ' + INK + '/>', '<path d="M67 46 A 9 9 0 0 0 85 46" ' + INK + '/>',
     '<path d="M50 14 L50 5 M44 8 L56 8" ' + INK_THIN + '/>'],
    /* 12 倒吊人：绞架 + 倒悬之躯 */
    ['<path d="M50 10 L50 88 M28 22 L72 22" ' + INK + '/>',
     '<circle cx="50" cy="28" r="4.5" ' + INK + '/>',
     '<path d="M50 33 L50 45 M50 36 L38 42 M38 42 L38 56 M50 36 L62 42 M62 42 L62 56 M38 56 L50 60 M62 56 L50 60" ' + INK + '/>'],
    /* 13 死神：镰刀 + 旗幡 */
    ['<path d="M26 76 Q 40 28 80 25" ' + INK + '/>', '<path d="M80 25 L84 29" ' + INK + '/>',
     '<path d="M50 52 L58 90" ' + INK + '/>',
     '<path d="M26 16 L60 16 L60 30 L26 30 Z" ' + INK_THIN + '/>', '<path d="M43 16 L43 30 M34 23 L52 23" ' + INK_THIN + '/>'],
    /* 14 节制：双杯流转 + 星 */
    ['<path d="M30 44 L30 64 L44 64 L44 44 Z" ' + INK + '/>', '<path d="M27 67 L47 67" ' + INK + '/>',
     '<path d="M56 44 L56 64 L70 64 L70 44 Z" ' + INK + '/>', '<path d="M53 67 L73 67" ' + INK + '/>',
     '<path d="M44 42 Q 50 28 56 42" ' + INK + '/>', '<path d="M44 40 L48 33 M56 40 L52 33" ' + INK_THIN + '/>',
     '<path d="M50 16 L51.9 20.2 L56.5 20.7 L53.2 23.9 L54.2 28.4 L50 26 L45.8 28.4 L46.8 23.9 L43.5 20.7 L48.1 20.2 Z" ' + INK_THIN + '/>'],
    /* 15 恶魔：倒五芒星 + 双角 */
    ['<path d="M50 28 L35.9 70.7 L71 44.6 L29 44.6 L64.1 70.7 Z" ' + INK + ' fill="rgba(200,107,138,0.10)"/>',
     '<path d="M36 26 Q 27 16 35 11" ' + INK + '/>', '<path d="M64 26 Q 73 16 65 11" ' + INK + '/>'],
    /* 16 高塔：塔楼 + 闪电 + 落石 */
    ['<path d="M36 88 L36 40 L64 40 L64 88 Z" ' + INK + '/>',
     '<path d="M36 40 L36 32 L44 32 L44 38 M50 32 L50 38 M56 32 L56 38 L64 32" ' + INK + '/>',
     '<path d="M44 88 L44 74 A 6 6 0 0 1 56 74 L56 88" ' + INK_THIN + '/>',
     '<path d="M60 14 L45 40 L56 40 L42 64" ' + ACCENT + '/>',
     '<circle cx="30" cy="52" r="1.6" ' + INK_THIN + '/>', '<circle cx="68" cy="58" r="1.6" ' + INK_THIN + '/>', '<circle cx="34" cy="34" r="1.6" ' + INK_THIN + '/>'],
    /* 17 星星：大星 + 小星 + 水波 */
    ['<path d="M50 34 L60 64.5 L34.5 45.5 L65.5 45.5 L40 64.5 Z" ' + INK + ' fill="rgba(242,217,141,0.22)"/>',
     '<circle cx="18" cy="26" r="1.8" ' + INK_THIN + '/>', '<circle cx="82" cy="24" r="1.8" ' + INK_THIN + '/>',
     '<circle cx="24" cy="72" r="1.8" ' + INK_THIN + '/>', '<circle cx="76" cy="74" r="1.8" ' + INK_THIN + '/>',
     '<path d="M28 80 Q 34 76 40 80 T 52 80 T 64 80 T 76 80" ' + ACCENT + '/>',
     '<path d="M28 89 Q 34 85 40 89 T 52 89 T 64 89 T 76 89" ' + ACCENT + '/>'],
    /* 18 月亮：新月 + 双塔 + 小径 */
    ['<path d="M56 18 A 23 23 0 1 0 75 44 A 17 17 0 1 1 56 18" ' + INK + ' fill="rgba(158,193,255,0.10)"/>',
     '<path d="M28 54 L28 78 M24 78 L32 78" ' + INK + '/>', '<path d="M36 54 L36 76 M32 76 L40 76" ' + INK + '/>',
     '<path d="M28 66 Q 32 62 36 66" ' + INK_THIN + '/>',
     '<circle cx="62" cy="64" r="1.5" ' + INK_THIN + '/>', '<circle cx="67" cy="72" r="1.5" ' + INK_THIN + '/>', '<circle cx="58" cy="73" r="1.5" ' + INK_THIN + '/>'],
    /* 19 太阳：光芒万丈 */
    ['<circle cx="50" cy="50" r="15" ' + INK + ' fill="rgba(242,217,141,0.25)"/>',
     '<path d="M50 24 L50 30 M50 70 L50 76 M24 50 L30 50 M70 50 L76 50 M31.6 31.6 L35.9 35.9 M64.1 64.1 L68.4 68.4 M31.6 68.4 L35.9 64.1 M64.1 35.9 L68.4 31.6" ' + INK + '/>',
     '<path d="M38 42 Q 50 50 62 42 Q 50 56 38 50" ' + INK_THIN + '/>',
     '<path d="M28 82 L72 82 M32 87 L68 87" ' + INK_THIN + '/>'],
    /* 20 审判：号角 + 旗帜 + 苏醒之人 */
    ['<path d="M25 78 L36 58" ' + INK + '/>', '<path d="M21 78 Q 17 83 24 86 L28 82" ' + INK + '/>',
     '<path d="M36 58 L34 50 M40 60 L40 48" ' + INK_THIN + '/>',
     '<path d="M48 16 L48 60 M48 16 L82 24 M48 26 L74 32" ' + INK + '/>',
     '<circle cx="58" cy="72" r="5" ' + INK + '/>', '<path d="M58 77 L58 90 M53 82 L63 82" ' + INK + '/>'],
    /* 21 世界：桂冠 + 舞者 + 四角 */
    ['<ellipse cx="50" cy="52" rx="20" ry="27" ' + INK + '/>', '<ellipse cx="50" cy="52" rx="15" ry="22" ' + INK_THIN + '/>',
     '<path d="M50 34 C 44 44 56 48 50 58 C 44 68 56 72 50 82" ' + INK + '/>',
     '<path d="M50 18 L51.9 22.2 L56.5 22.7 L53.2 25.9 L54.2 30.4 L50 28 L45.8 30.4 L46.8 25.9 L43.5 22.7 L48.1 22.2 Z" ' + INK_THIN + '/>',
     '<path d="M24 20 L29 25 M29 20 L24 25" ' + INK_THIN + '/>', '<path d="M76 20 L71 25 M71 20 L76 25" ' + INK_THIN + '/>',
     '<path d="M24 84 L29 79 M29 84 L24 79" ' + INK_THIN + '/>', '<path d="M76 84 L71 79 M71 84 L76 79" ' + INK_THIN + '/>']
  ];

  /* ---------- 四元素圣徽（24×24） ---------- */
  const SUIT_ICONS = {
    wands: {
      c: '#e8a04c',
      p: ['<path d="M12 3 L12 21"/>', '<path d="M5 8 L19 13 M5 15 L19 10"/>', '<path d="M12 3 Q 8 1 7 5 M12 3 Q 16 1 17 5"/>']
    },
    cups: {
      c: '#8fb8e8',
      p: ['<path d="M5 7 Q 12 15 19 7"/>', '<path d="M5 7 L19 7"/>', '<path d="M12 14 L12 19"/>', '<path d="M9 19 L15 19"/>']
    },
    swords: {
      c: '#d8dff0',
      p: ['<path d="M12 3 L12 13"/>', '<path d="M8 13 L16 13 M8 13 L6 12 M16 13 L18 12"/>', '<path d="M12 15 L12 18"/>', '<circle cx="12" cy="19.5" r="1.5"/>']
    },
    pentacles: {
      c: '#a8c89a',
      p: ['<circle cx="12" cy="12" r="7.5"/>', '<path d="M12 7.5 L13.99 14.16 L8.72 10.28 L15.28 10.28 L10.01 14.16 Z"/>']
    }
  };

  function suitIcon(suitKey, uid) {
    const s = SUIT_ICONS[suitKey];
    return '<g stroke="' + s.c + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none">' + s.p.join('') + '</g>';
  }

  /* ---------- 点数排列（100×100 局部坐标） ---------- */
  const PIP_POS = {
    1: [[50, 50]], 2: [[50, 20], [50, 80]], 3: [[50, 16], [50, 50], [50, 84]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
    7: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78], [50, 14]],
    8: [[25, 18], [75, 18], [25, 40], [75, 40], [25, 62], [75, 62], [25, 84], [75, 84]],
    9: [[25, 18], [75, 18], [25, 40], [75, 40], [50, 50], [25, 62], [75, 62], [25, 84], [75, 84]],
    10: [[25, 15], [75, 15], [25, 34], [75, 34], [25, 53], [75, 53], [25, 72], [75, 72], [50, 26], [50, 88]]
  };

  /* ---------- 宫廷牌徽章（60×60） ---------- */
  const COURT = {
    Page: ['<path d="M14 46 Q 24 16 48 10"/>', '<path d="M22 37 L30 33 M28 28 L36 25 M34 20 L42 17"/>', '<path d="M14 46 L48 10"/>'],
    Knight: ['<path d="M14 42 Q 14 14 30 14 Q 46 14 46 42"/>', '<path d="M22 30 L38 30"/>', '<path d="M30 14 Q 27 4 36 6"/>', '<path d="M11 42 L49 42"/>'],
    Queen: ['<path d="M16 42 L16 24 Q 16 12 30 12 Q 44 12 44 24 L44 42 Z"/>', '<circle cx="16" cy="22" r="2.2"/><circle cx="30" cy="10" r="2.2"/><circle cx="44" cy="22" r="2.2"/>', '<path d="M12 42 L48 42"/>'],
    King: ['<path d="M16 42 L16 20 L22 14 L30 22 L38 14 L44 20 L44 42 Z"/>', '<path d="M12 42 L48 42"/>', '<path d="M52 42 L52 8"/>', '<circle cx="52" cy="6" r="2.4"/>']
  };

  /* ---------- 组装整张牌面 ---------- */
  function face(card, uid) {
    const major = card.arcana === 'major';
    let emblem = '';
    if (major) {
      emblem = '<g transform="translate(25 66)" filter="url(#sk' + uid + ')">' + MAJOR[card.id].join('') + '</g>';
    } else if (['Page', 'Knight', 'Queen', 'King'].indexOf(card.num) >= 0) {
      const c = SUIT_ICONS[card.suitKey] ? SUIT_ICONS[card.suitKey].c : '#e6c87c';
      emblem = '<g transform="translate(45 94)" stroke="' + c + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#sk' + uid + ')">' +
        COURT[card.num].join('') + '</g>';
    } else {
      const RANK_NUM = { Ace: 1, Two: 2, Three: 3, Four: 4, Five: 5, Six: 6, Seven: 7, Eight: 8, Nine: 9, Ten: 10 };
      const n = RANK_NUM[card.num] || 1;
      const scale = card.num === 'Ace' ? 1.45 : 1;
      const pos = PIP_POS[n];
      emblem = '<g transform="translate(25 66)" filter="url(#sk' + uid + ')">' +
        pos.map(([x, y]) => {
          const s = 0.92 * scale;
          return '<g transform="translate(' + (x - 12 * s).toFixed(1) + ' ' + (y - 12 * s).toFixed(1) + ') scale(' + s.toFixed(2) + ')">' + suitIcon(card.suitKey, uid) + '</g>';
        }).join('') + '</g>';
    }

    const numText = major ? card.num : (card.num === 'Ace' ? 'A' : card.num);
    const enText = card.en;

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 250" width="150" height="250" role="img" aria-label="' + card.name + '">' +
      '<defs>' +
      sketchFilter(uid) + glowFilter(uid) + grainFilter(uid) +
      '<linearGradient id="bg' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#1b1340"/><stop offset="55%" stop-color="#150f2e"/><stop offset="100%" stop-color="#0e0a22"/>' +
      '</linearGradient>' +
      '<radialGradient id="glow' + uid + '" cx="50%" cy="40%" r="65%">' +
      '<stop offset="0%" stop-color="rgba(217,180,92,0.20)"/><stop offset="100%" stop-color="rgba(217,180,92,0)"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<rect width="150" height="250" rx="10" fill="url(#bg' + uid + ')"/>' +
      '<rect width="150" height="250" rx="10" fill="url(#glow' + uid + ')"/>' +
      '<rect width="150" height="250" rx="10" filter="url(#noi' + uid + ')" opacity="0.55"/>' +
      '<path d="' + framePath(uid) + '" stroke="rgba(217,180,92,0.55)" stroke-width="1.6" fill="none" filter="url(#sk' + uid + ')"/>' +
      '<path d="' + framePath(uid + 'b') + '" stroke="rgba(158,193,255,0.18)" stroke-width="0.8" fill="none" filter="url(#sk' + uid + ')"/>' +
      emblem +
      '<text x="75" y="30" text-anchor="middle" font-size="12.5" letter-spacing="2" fill="#b08f3e" font-family="\'Cormorant Garamond\',\'Noto Serif SC\',serif">' + numText + '</text>' +
      '<text x="75" y="211" text-anchor="middle" font-size="16.5" letter-spacing="3" fill="#f2d98d" font-family="\'Noto Serif SC\',\'STSong\',serif">' + card.name + '</text>' +
      '<text x="75" y="228" text-anchor="middle" font-size="7.2" letter-spacing="1.4" fill="#8f84b8" font-family="\'Cormorant Garamond\',serif">' + enText + '</text>' +
      '</svg>';
  }

  return { face: face };
})();
