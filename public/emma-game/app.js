/* ===================================================================
   Emma's Learning Land — pre-K learning games
   Logic lifted from the Claude Designer prototype (Emma Learning Land.dc.html),
   adapted to plain JavaScript. The prototype's window.claude.complete()
   calls are replaced with local generators (praise pool, story templates,
   rule-based parent insights) so the site runs fully static.
   =================================================================== */

const CHILD_NAME = 'Emma';
const AUDIO_ON = true;

const GAMES = {
  letters: { title: 'Letter Game', color: '#FF6B6B', sticker: '🦋' },
  numbers: { title: 'Number Game', color: '#4DA6FF', sticker: '🐬' },
  shapes:  { title: 'Shapes & Colors', color: '#d9a91e', sticker: '🌈' },
  words:   { title: 'Sight Words', color: '#3fa254', sticker: '🦉' },
};
const GAME_DOT_COLORS = { letters: '#FF6B6B', numbers: '#4DA6FF', shapes: '#FFC933', words: '#57C46B' };
const LETTERS = 'ABCDEFGHJKMNPRSTW'.split('');
const WORDS = ['the', 'and', 'see', 'I', 'can', 'we', 'go', 'my', 'like', 'to', 'a', 'is'];
const EMOJIS = ['🍎', '🐟', '⭐', '🌸', '🐞', '🎈', '🐤', '🍓'];
const SHAPES = [{ g: '●', n: 'circle' }, { g: '■', n: 'square' }, { g: '▲', n: 'triangle' }, { g: '★', n: 'star' }, { g: '♥', n: 'heart' }, { g: '◆', n: 'diamond' }];
const COLORS = [{ n: 'red', h: '#FF6B6B' }, { n: 'blue', h: '#4DA6FF' }, { n: 'green', h: '#57C46B' }, { n: 'yellow', h: '#E8B900' }, { n: 'purple', h: '#A78BFA' }, { n: 'orange', h: '#FF9950' }];
const HEROES = [{ label: '🐰 Bunny', word: 'a little bunny' }, { label: '🐱 Kitten', word: 'a fluffy kitten' }, { label: '🐶 Puppy', word: 'a happy puppy' }, { label: '🐉 Dragon', word: 'a friendly baby dragon' }];
const PLACES = [{ label: '🌲 Forest', word: 'a magical forest' }, { label: '🚀 Space', word: 'outer space' }, { label: '🏖️ Beach', word: 'a sunny beach' }, { label: '🏰 Castle', word: 'a rainbow castle' }];
const ROUTINE = [
  { id: 'wake', emoji: '☀️', label: 'Wake up & get dressed' },
  { id: 'teeth', emoji: '🪥', label: 'Brush my teeth' },
  { id: 'learn', emoji: '📚', label: 'Learning time' },
  { id: 'play', emoji: '🧸', label: 'Play time' },
  { id: 'tidy', emoji: '🧺', label: 'Tidy up my toys' },
];
const VOICES = ['coral', 'nova', 'shimmer', 'fable'];

const state = {
  screen: 'hub', quiz: null, feedback: null,
  stars: 0, stickers: [],
  praise: '', earnedSticker: '🌟',
  story: { hero: 0, place: 0, text: '', loading: false },
  routineDone: {},
  parentTips: '', tipsLoading: false,
  ttsKey: '', ttsVoice: 'coral', voiceStatus: '', voiceStatusColor: '#9a92ae',
};

let _audio = null;
let _speakSeq = 0;
let _ac = null;
const _ttsCache = new Map();

/* ---------------- persistence ---------------- */

function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem('emma_progress_v1') || '{}');
    state.stars = p.stars || 0;
    state.stickers = p.stickers || [];
    state.routineDone = p.routineDone || {};
    state.ttsKey = localStorage.getItem('emma_tts_key') || '';
    state.ttsVoice = localStorage.getItem('emma_tts_voice') || 'coral';
  } catch (e) {}
}
function saveProgress() {
  try {
    localStorage.setItem('emma_progress_v1', JSON.stringify({
      stars: state.stars, stickers: state.stickers, routineDone: state.routineDone,
    }));
  } catch (e) {}
}
function logEvent(game, item, correct) {
  try {
    const arr = JSON.parse(localStorage.getItem('emma_stats_v1') || '[]');
    arr.push({ g: game, i: item, c: correct ? 1 : 0, t: Date.now() });
    localStorage.setItem('emma_stats_v1', JSON.stringify(arr.slice(-600)));
  } catch (e) {}
}
function readEvents() {
  try { return JSON.parse(localStorage.getItem('emma_stats_v1') || '[]'); } catch (e) { return []; }
}

/* ---------------- audio ---------------- */

function speak(text) {
  if (!AUDIO_ON || !text) return;
  stopAudio();
  if (state.ttsKey) { openaiSpeak(text); return; }
  browserSpeak(text);
}
function browserSpeak(text) {
  if (!window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92; u.pitch = 1.15;
    speechSynthesis.speak(u);
  } catch (e) {}
}
function stopAudio() {
  try { speechSynthesis.cancel(); } catch (e) {}
  if (_audio) { try { _audio.pause(); } catch (e) {} _audio = null; }
  _speakSeq++;
}
async function openaiSpeak(text) {
  const seq = _speakSeq;
  try {
    const cacheKey = state.ttsVoice + '|' + text;
    let url = _ttsCache.get(cacheKey);
    if (!url) {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + state.ttsKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          voice: state.ttsVoice,
          input: text,
          instructions: 'Speak warmly and cheerfully, like a kind storyteller talking to a 4-year-old child. Clear, gentle, not too fast.',
        }),
      });
      if (!r.ok) throw new Error('TTS error ' + r.status);
      url = URL.createObjectURL(await r.blob());
      _ttsCache.set(cacheKey, url);
    }
    if (seq !== _speakSeq) return;
    const a = new Audio(url);
    _audio = a;
    a.play();
  } catch (e) {
    setState({ voiceStatus: 'AI voice failed (' + (e.message || 'network') + ') — using device voice instead. Check the key.', voiceStatusColor: '#d97706' });
    if (seq === _speakSeq) browserSpeak(text);
  }
}
function tone(freq, dur, type) {
  if (!AUDIO_ON) return;
  try {
    _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = _ac.createOscillator(), g = _ac.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.12, _ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, _ac.currentTime + dur);
    o.connect(g); g.connect(_ac.destination);
    o.start(); o.stop(_ac.currentTime + dur);
  } catch (e) {}
}
function ding() { tone(660, 0.15); setTimeout(() => tone(880, 0.25), 120); }
function buzz() { tone(200, 0.25, 'square'); }

/* ---------------- question generation ---------------- */

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickN(arr, n, must) {
  const rest = shuffle(arr.filter(x => x !== must)).slice(0, n - 1);
  return shuffle([must, ...rest]);
}

function makeQuestion(game) {
  if (game === 'letters') {
    const t = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const opts = pickN(LETTERS, 4, t);
    return {
      prompt: 'Find the letter ' + t + '!', say: 'Find the letter ' + t + '!',
      options: opts.map(l => ({ label: l, correct: l === t, color: '#3B3355', size: 56, item: l })),
    };
  }
  if (game === 'numbers') {
    const n = 1 + Math.floor(Math.random() * 10);
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const nums = pickN(Array.from({ length: 10 }, (_, i) => i + 1), 3, n);
    return {
      prompt: 'How many do you see?', say: 'Count them! How many do you see?',
      emojiRow: Array.from({ length: n }, () => emoji).join(' '),
      options: nums.map(x => ({ label: String(x), correct: x === n, color: '#2f7fd0', size: 56, item: 'count-' + n })),
    };
  }
  if (game === 'shapes') {
    if (Math.random() < 0.5) {
      const t = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const opts = pickN(SHAPES, 4, t);
      return {
        prompt: 'Find the ' + t.n + '!', say: 'Find the ' + t.n + '!',
        options: opts.map(s => ({ label: s.g, correct: s.n === t.n, color: '#4DA6FF', size: 64, item: 'shape-' + t.n })),
      };
    }
    const t = COLORS[Math.floor(Math.random() * COLORS.length)];
    const opts = pickN(COLORS, 4, t);
    return {
      prompt: 'Tap the ' + t.n + ' one!', say: 'Tap the ' + t.n + ' one!',
      options: opts.map(c => ({ label: '●', correct: c.n === t.n, color: c.h, size: 72, item: 'color-' + t.n })),
    };
  }
  const t = WORDS[Math.floor(Math.random() * WORDS.length)];
  const opts = pickN(WORDS, 3, t);
  return {
    prompt: 'Listen, then tap the word!', say: 'Find the word: ' + t,
    options: opts.map(w => ({ label: w, correct: w === t, color: '#3fa254', size: 44, item: w })),
  };
}

/* ---------------- quiz flow ---------------- */

function startGame(game) {
  const q = makeQuestion(game);
  setState({ screen: 'quiz', feedback: null, quiz: { game, qIndex: 0, score: 0, q } });
  setTimeout(() => speak(q.say), 300);
}

function pick(optIndex) {
  const quiz = state.quiz;
  if (!quiz || (state.feedback && state.feedback.lock)) return;
  const opt = quiz.q.options[optIndex];
  if (!opt) return;
  logEvent(quiz.game, opt.item, opt.correct);
  if (opt.correct) {
    ding();
    const cheers = ['Yes! 🎉', 'Great job! ⭐', 'Wow! 🌟', 'You got it! 🎈'];
    setState({ feedback: { text: cheers[Math.floor(Math.random() * cheers.length)], color: '#3fa254', lock: true } });
    speak(['Yes!', 'Great job!', 'Wow, you got it!'][Math.floor(Math.random() * 3)]);
    const nextIndex = quiz.qIndex + 1;
    setTimeout(() => {
      if (nextIndex >= 5) finishRound(quiz.score + 1);
      else {
        const q = makeQuestion(quiz.game);
        setState({ quiz: { ...quiz, qIndex: nextIndex, score: quiz.score + 1, q }, feedback: null });
        setTimeout(() => speak(q.say), 250);
      }
    }, 1100);
  } else {
    buzz();
    setState({ feedback: { text: 'Almost! Try again 💪', color: '#d97706', lock: false } });
    speak('Almost! Try again.');
  }
}

function finishRound(score) {
  const quiz = state.quiz;
  const meta = GAMES[quiz.game];
  const stickers = [...state.stickers, { emoji: meta.sticker, game: quiz.game, t: Date.now() }];
  const stars = state.stars + score;
  const praise = makePraise(quiz.game, score);
  setState({ screen: 'done', stars, stickers, earnedSticker: meta.sticker, praise, quiz: { ...quiz, score } });
  saveProgress();
  speak('Hooray ' + CHILD_NAME + '! You finished the game and earned a sticker!');
  setTimeout(() => speak(praise.replace(/[^\p{L}\p{N}\s.,!?']/gu, '')), 3200);
}

/* Praise: the prototype asked Claude for one cheerful sentence as "Bella".
   Static version draws from a canned pool in the same voice. */
function makePraise(game, score) {
  const name = CHILD_NAME;
  const perfect = [
    'Wow ' + name + ', five out of five — you are a superstar! 🌟',
    name + ', you got them ALL right! Amazing! 🎉',
    'Perfect round, ' + name + '! Bella is hopping with joy! 🐰',
    'You are so smart, ' + name + '! Every one was right! ⭐',
  ];
  const great = [
    'Great job, ' + name + '! You worked so hard! 🎈',
    'Bella is so proud of you, ' + name + '! 🥕',
    'You did it, ' + name + '! High five! ✋',
    'Super work, ' + name + '! Let\'s play again soon! 🌈',
  ];
  const pool = score >= 5 ? perfect : great;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------------- story generator ----------------
   The prototype asked Claude for an 8-sentence bedtime story.
   Static version builds one from templates with random details,
   keeping the same rules: hero + place, child appears as a kind
   friend, simple pre-K vocabulary, warm ending, newline-separated. */

const STORY_TREASURES = ['a shiny gold star', 'a big red balloon', 'a basket of berries', 'a tiny music box', 'a sparkly seashell', 'a soft blue blanket'];
const STORY_FRIENDS = ['a wise old owl', 'a giggly ladybug', 'a gentle deer', 'a singing bird', 'a smiley turtle'];

function generateStory(heroWord, placeWord) {
  const name = CHILD_NAME;
  const treasure = STORY_TREASURES[Math.floor(Math.random() * STORY_TREASURES.length)];
  const friend = STORY_FRIENDS[Math.floor(Math.random() * STORY_FRIENDS.length)];
  const templates = [
    [
      'Once upon a time, ' + heroWord + ' lived in ' + placeWord + '.',
      'One sunny morning, the little hero found ' + treasure + '.',
      '"Who lost this?" the hero wondered.',
      'Along came ' + name + ', a very kind friend.',
      '"Let\'s find the owner together!" said ' + name + ' with a smile.',
      'They asked ' + friend + ', who clapped and said it belonged to the moon.',
      'So they waited for night and gave it back, and the moon glowed extra bright.',
      name + ' and her friend hugged, happy and sleepy, and dreamed sweet dreams.',
    ],
    [
      'In ' + placeWord + ' there lived ' + heroWord + ' who loved to play.',
      'One day the hero heard a tiny cry near the big hill.',
      'It was ' + friend + ', feeling lost and a little scared.',
      'Just then ' + name + ' arrived, because ' + name + ' always helps her friends.',
      '"Hold my hand," said ' + name + ' softly, "we will find your home."',
      'They walked and sang a happy song until they saw the friend\'s cozy house.',
      'Everyone cheered and shared ' + treasure + ' as a thank-you gift.',
      'The hero, the friend, and ' + name + ' smiled big smiles and lived happily ever after.',
    ],
    [
      heroWord.charAt(0).toUpperCase() + heroWord.slice(1) + ' woke up in ' + placeWord + ' feeling curious.',
      'Today was the day of the big surprise hunt!',
      'The hero looked high and low but could not find the surprise.',
      'Then ' + name + ' came skipping by with her kind, helpful heart.',
      '"Two friends can find anything!" said ' + name + '.',
      'Together they peeked behind a flower and found ' + treasure + '.',
      'They shared it with ' + friend + ' and everyone laughed with joy.',
      'That night the hero thanked ' + name + ' for being the best friend ever.',
    ],
  ];
  const t = templates[Math.floor(Math.random() * templates.length)];
  return t.join('\n');
}

function makeStory() {
  const s = state.story;
  setState({ story: { ...s, loading: true, text: '' } });
  // Small delay keeps the fun "Bella is thinking…" moment from the prototype.
  setTimeout(() => {
    const text = generateStory(HEROES[state.story.hero].word, PLACES[state.story.place].word);
    setState({ story: { ...state.story, loading: false, text } });
  }, 1400);
}
function readStory() { speak(state.story.text); }

/* ---------------- my day ---------------- */

function toggleRoutine(id) {
  const key = new Date().toDateString() + ':' + id;
  const routineDone = { ...state.routineDone, [key]: !state.routineDone[key] };
  if (routineDone[key]) ding();
  setState({ routineDone });
  saveProgress();
}

/* ---------------- parent insights ----------------
   The prototype sent aggregated stats to Claude for a written analysis.
   Static version produces the same structure (overall, strengths,
   what to practice, offline tips) from the logged events directly. */

function statsSummary() {
  const ev = readEvents();
  const by = {};
  for (const e of ev) {
    by[e.g] = by[e.g] || { n: 0, c: 0, missed: {} };
    by[e.g].n++; by[e.g].c += e.c;
    if (!e.c) by[e.g].missed[e.i] = (by[e.g].missed[e.i] || 0) + 1;
  }
  return { ev, by };
}

const OFFLINE_TIPS = {
  letters: ['Point out letters on cereal boxes and street signs and ask "what letter is that?"', 'Trace letters together in a tray of salt or sand — touch helps them stick.'],
  numbers: ['Count real things together: stairs, crackers at snack time, toys during cleanup.', 'Play "give me N" — ask her to hand you exactly 4 blocks, then 7, then 2.'],
  shapes: ['Go on a shape hunt around the house — find three circles, two squares, one triangle.', 'Sort laundry or toys by color together and name each color out loud.'],
  words: ['Point to sight words like "the" and "and" while reading bedtime books.', 'Write sight words on sticky notes and let her slap the one you say.'],
};

function getTips() {
  const { ev, by } = statsSummary();
  if (!ev.length) {
    setState({ parentTips: 'No play data yet — have ' + CHILD_NAME + ' play a few games first, then come back!' });
    return;
  }
  setState({ tipsLoading: true });
  setTimeout(() => {
    const name = CHILD_NAME;
    const games = Object.keys(by);
    const total = ev.length;
    const correct = ev.reduce((s, e) => s + e.c, 0);
    const pct = Math.round((correct / total) * 100);
    const acc = g => by[g].c / by[g].n;

    const overall = pct >= 80
      ? name + ' is doing wonderfully — ' + pct + '% of her ' + total + ' answers were right. Note that every tap is logged, so retries count as misses.'
      : pct >= 60
        ? name + ' is making steady progress — ' + pct + '% of her ' + total + ' answers were right (every tap is logged, so retries count as misses).'
        : name + ' is still warming up — ' + pct + '% of ' + total + ' answers were right, which is normal while she learns the games (retries count as misses).';

    const strong = games.filter(g => by[g].n >= 5 && acc(g) >= 0.8).map(g => GAMES[g].title);
    const strengths = strong.length
      ? 'Strengths: ' + strong.join(' and ') + ' — she answers these quickly and accurately. Keep celebrating it!'
      : 'Strengths: she keeps trying after a miss, which is exactly the habit that matters most at this age.';

    const weakest = games.slice().sort((a, b) => acc(a) - acc(b))[0];
    const unplayed = Object.keys(GAMES).filter(g => !by[g]);
    let practice, tipGame;
    if (unplayed.length && acc(weakest) >= 0.8) {
      // Everything she's played is going well — nudge toward the games she hasn't tried.
      practice = 'What to practice: she\'s doing great in what she\'s played so far — mix in ' + unplayed.map(g => GAMES[g].title).join(' and ') + ' next for variety.';
      tipGame = unplayed[0];
    } else {
      const missed = Object.entries(by[weakest].missed).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0].replace(/^(shape-|color-|count-)/, ''));
      practice = 'What to practice: ' + GAMES[weakest].title + ' (' + by[weakest].c + '/' + by[weakest].n + ' correct' +
        (missed.length ? '; trickiest: ' + missed.join(', ') : '') + '). Short, playful practice beats long drills.';
      tipGame = weakest;
    }

    const tips = 'Try offline:\n• ' + OFFLINE_TIPS[tipGame].join('\n• ');

    setState({ parentTips: overall + '\n\n' + strengths + '\n\n' + practice + '\n\n' + tips, tipsLoading: false });
  }, 600);
}

/* ---------------- voice settings ---------------- */

function setTtsKey(v) {
  const ttsKey = v.trim();
  setState({
    ttsKey,
    voiceStatus: ttsKey ? 'Key saved on this device. Tap Test voice to try it.' : 'Key removed — using device voice.',
    voiceStatusColor: '#9a92ae',
  });
  try { localStorage.setItem('emma_tts_key', ttsKey); } catch (e) {}
}
function setTtsVoice(v) {
  setState({ ttsVoice: v });
  try { localStorage.setItem('emma_tts_voice', v); } catch (e) {}
  _ttsCache.clear();
}

/* ---------------- rendering ---------------- */

const appEl = document.getElementById('app');

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bellaHTML(size) {
  const cls = size === 'lg' ? 'bella bella-lg' : 'bella bella-sm';
  return '<div class="' + cls + '"><div class="ear ear-l"></div><div class="ear ear-r"></div><div class="face"></div><div class="eye-l"></div><div class="eye-r"></div><div class="nose"></div></div>';
}

function renderHub() {
  const tiles = [
    { action: 'start-letters', cls: 'tile-red', glyph: '<div class="tile-glyph">Aa</div>', title: 'Letters', sub: 'Sounds & phonics' },
    { action: 'start-numbers', cls: 'tile-blue', glyph: '<div class="tile-glyph">1 2 3</div>', title: 'Numbers', sub: 'Counting fun' },
    { action: 'start-shapes', cls: 'tile-yellow', glyph: '<div class="tile-shapes-row"><div class="mini-square"></div><div class="mini-circle"></div><div class="mini-triangle"></div></div>', title: 'Shapes & Colors', sub: 'Match & sort' },
    { action: 'start-words', cls: 'tile-green', glyph: '<div class="tile-glyph" style="font-family:\'Nunito\',sans-serif;font-weight:800;font-size:40px">the</div>', title: 'Sight Words', sub: 'Reading readiness' },
    { action: 'go-story', cls: 'tile-pink', glyph: '<div class="tile-glyph" style="font-size:40px">📖</div>', title: 'Story Time', sub: 'Bella writes you a story!' },
    { action: 'go-myday', cls: 'tile-purple', glyph: '<div class="tile-glyph" style="font-size:40px">📅</div>', title: 'My Day', sub: 'Calendar & routine' },
  ];
  return `
  <div class="hub-top">
    <div class="hub-id">
      <div class="avatar">${esc(CHILD_NAME.charAt(0).toUpperCase())}</div>
      <div class="hub-name">${esc(CHILD_NAME)}'s Learning Land</div>
    </div>
    <div class="hub-right">
      <button class="icon-btn" data-action="say-hello">🔊</button>
      <div class="star-pill">⭐ ${state.stars}</div>
    </div>
  </div>
  <div class="greeting">
    ${bellaHTML('lg')}
    <div>
      <div class="greeting-hi">Hi ${esc(CHILD_NAME)}! 👋</div>
      <div class="greeting-sub">Bella the bunny says: let's play and learn today!</div>
    </div>
  </div>
  <div class="tile-grid">
    ${tiles.map(t => `
    <button class="tile ${t.cls}" data-action="${t.action}">
      ${t.glyph}
      <div class="tile-title">${t.title}</div>
      <div class="tile-sub">${t.sub}</div>
    </button>`).join('')}
  </div>
  <div class="hub-footer">
    <button class="stickers-btn" data-action="go-stickers">🌟 My Stickers <span class="sticker-count">${state.stickers.length}</span></button>
    <button class="parent-link" data-action="go-parent">Parent Corner</button>
  </div>`;
}

function renderQuiz() {
  const quiz = state.quiz;
  const q = quiz.q;
  const meta = GAMES[quiz.game];
  const dots = [0, 1, 2, 3, 4].map(i => {
    const c = i < quiz.qIndex ? '#57C46B' : i === quiz.qIndex ? '#FFC933' : '#E8E0D0';
    return '<div class="dot" style="background:' + c + '"></div>';
  }).join('');
  const cols = Math.min(q.options.length, 4);
  return `
  <div class="screen-head">
    <button class="home-btn" data-action="go-home">🏠</button>
    <div class="screen-title" style="color:${meta.color}">${esc(meta.title)}</div>
    <div class="progress-dots">${dots}</div>
  </div>
  <div class="quiz-bubble-row">
    ${bellaHTML('sm')}
    <div class="speech-bubble">
      <div class="quiz-prompt">${esc(q.prompt)}</div>
      <button class="replay-btn" data-action="replay-prompt">🔊</button>
    </div>
    ${state.feedback ? `<div class="feedback" style="color:${state.feedback.color}">${state.feedback.text}</div>` : ''}
  </div>
  ${q.emojiRow ? `<div class="emoji-row">${q.emojiRow}</div>` : ''}
  <div class="options-grid" style="grid-template-columns:repeat(${cols},1fr)">
    ${q.options.map((o, i) => `<button class="option-btn" data-action="pick" data-i="${i}" style="font-size:${o.size}px;color:${o.color}${quiz.game === 'words' ? ";font-family:'Nunito',sans-serif" : ''}">${esc(o.label)}</button>`).join('')}
  </div>`;
}

function renderDone() {
  return `
  <div class="done-wrap">
    <div class="done-sticker">${state.earnedSticker}</div>
    <div class="done-title">You did it, ${esc(CHILD_NAME)}!</div>
    <div class="done-score">You got ${state.quiz ? state.quiz.score : 0} out of 5 stars — and a new sticker!</div>
    <div class="praise-card">🐰 ${esc(state.praise)}</div>
    <div class="done-actions">
      <button class="btn-primary" data-action="play-again">▶ Play again</button>
      <button class="btn-ghost" data-action="go-home">🏠 Home</button>
    </div>
  </div>`;
}

function renderStory() {
  const s = state.story;
  return `
  <div class="screen-head">
    <button class="home-btn" data-action="go-home">🏠</button>
    <div class="screen-title" style="color:#FF8FA3">📖 Story Time with Bella</div>
  </div>
  <div class="story-q">Who is the story about?</div>
  <div class="chips">
    ${HEROES.map((h, i) => `<button class="chip${s.hero === i ? ' selected' : ''}" data-action="pick-hero" data-i="${i}">${h.label}</button>`).join('')}
  </div>
  <div class="story-q">Where does it happen?</div>
  <div class="chips">
    ${PLACES.map((p, i) => `<button class="chip${s.place === i ? ' selected' : ''}" data-action="pick-place" data-i="${i}">${p.label}</button>`).join('')}
  </div>
  <div class="story-actions">
    <button class="btn-story" data-action="make-story">✨ Make my story!</button>
    ${s.text && !s.loading ? '<button class="btn-read" data-action="read-story">🔊 Read it to me</button>' : ''}
  </div>
  ${s.loading ? '<div class="story-loading">🐰 Bella is thinking of a wonderful story…</div>' : ''}
  ${s.text && !s.loading ? `<div class="story-card">${esc(s.text)}</div>` : ''}`;
}

function renderMyDay() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const todayKey = now.toDateString();
  return `
  <div class="screen-head">
    <button class="home-btn" data-action="go-home">🏠</button>
    <div class="screen-title" style="color:#A78BFA">📅 My Day</div>
  </div>
  <div class="myday-cols">
    <button class="today-card" data-action="say-today">
      <div class="today-label">TODAY IS</div>
      <div class="today-day">${days[now.getDay()]}</div>
      <div class="today-date">${months[now.getMonth()]} ${now.getDate()}</div>
      <div class="today-hint">tap to hear 🔊</div>
    </button>
    <div class="routine-card">
      <div class="routine-title">My routine — tap when you finish!</div>
      <div class="routine-list">
        ${ROUTINE.map(r => {
          const done = !!state.routineDone[todayKey + ':' + r.id];
          return `<button class="routine-row${done ? ' done' : ''}" data-action="toggle-routine" data-id="${r.id}">
            <span class="routine-emoji">${r.emoji}</span>
            <span class="routine-label">${r.label}</span>
            <span class="routine-check">${done ? '✅' : '⬜'}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

function renderStickers() {
  return `
  <div class="screen-head">
    <button class="home-btn" data-action="go-home">🏠</button>
    <div class="screen-title" style="color:#FFC933">🌟 ${esc(CHILD_NAME)}'s Sticker Book</div>
  </div>
  ${state.stickers.length
    ? `<div class="sticker-grid">${state.stickers.map(s => `<div class="sticker-cell">${s.emoji}</div>`).join('')}</div>`
    : '<div class="stickers-empty">No stickers yet — finish a game to earn your first one! 🎮</div>'}`;
}

function renderParent() {
  const { ev, by } = statsSummary();
  const statRows = Object.keys(GAMES).map(g => {
    const detail = by[g] ? by[g].c + '/' + by[g].n + ' correct' : 'not played yet';
    return `<div class="stat-row">
      <div class="stat-dot" style="background:${GAME_DOT_COLORS[g]}"></div>
      <div class="stat-game">${GAMES[g].title}</div>
      <div class="stat-detail">${detail}</div>
    </div>`;
  }).join('');
  return `
  <div class="parent">
    <div class="screen-head">
      <button class="home-btn" data-action="go-home">🏠</button>
      <div class="screen-title">Parent Corner</div>
    </div>
    <div class="parent-cols">
      <div class="parent-card summary-card">
        <div class="card-heading">Play summary</div>
        <div class="stat-rows">${statRows}</div>
        <div class="stat-foot">${ev.length} answers recorded on this device</div>
      </div>
      <div class="parent-card insights-card">
        <div class="insights-head">
          <div class="card-heading">Learning insights</div>
          <button class="btn-analyze" data-action="get-tips">✨ Analyze ${esc(CHILD_NAME)}'s progress</button>
        </div>
        ${state.tipsLoading ? '<div class="insights-loading">Analyzing play patterns…</div>' : ''}
        ${state.parentTips && !state.tipsLoading ? `<div class="insights-text">${esc(state.parentTips)}</div>` : ''}
        ${!state.parentTips && !state.tipsLoading ? `<div class="insights-loading">Every answer in the games is tracked here. Once ${esc(CHILD_NAME)} has played a bit, tap the button for a summary — strengths, gentle tips, and what to practice next.</div>` : ''}
      </div>
    </div>
    <div class="parent-card voice-card">
      <div class="card-heading" style="font-size:16px">Voice settings</div>
      <div class="voice-sub">By default the site uses your device's built-in voice (a bit robotic). Paste an OpenAI API key to switch to a natural, warm AI voice for all games and stories. The key is stored only on this device.</div>
      <div class="voice-row">
        <input class="key-input" type="password" placeholder="sk-..." value="${esc(state.ttsKey)}" data-action="set-tts-key">
        <button class="btn-test" data-action="test-voice">🔊 Test voice</button>
      </div>
      <div class="voice-pills">
        <div class="voice-label">Voice:</div>
        ${VOICES.map(v => `<button class="voice-pill${state.ttsVoice === v ? ' selected' : ''}" data-action="set-voice" data-id="${v}">${v}</button>`).join('')}
      </div>
      <div class="voice-status" style="color:${state.voiceStatusColor}">${esc(state.voiceStatus || (state.ttsKey ? 'AI voice is on (' + state.ttsVoice + ').' : 'Using device voice — paste a key above for the natural AI voice.'))}</div>
    </div>
  </div>`;
}

function render() {
  const screens = {
    hub: renderHub, quiz: renderQuiz, done: renderDone,
    story: renderStory, myday: renderMyDay, stickers: renderStickers, parent: renderParent,
  };
  appEl.innerHTML = (screens[state.screen] || renderHub)();
}

/* ---------------- events ---------------- */

function go(screen) { stopAudio(); setState({ screen, feedback: null }); }

const actions = {
  'go-home': () => go('hub'),
  'say-hello': () => speak('Hi ' + CHILD_NAME + '! Welcome to your learning land. Pick a game!'),
  'start-letters': () => startGame('letters'),
  'start-numbers': () => startGame('numbers'),
  'start-shapes': () => startGame('shapes'),
  'start-words': () => startGame('words'),
  'go-story': () => go('story'),
  'go-myday': () => go('myday'),
  'go-stickers': () => go('stickers'),
  'go-parent': () => go('parent'),
  'replay-prompt': () => state.quiz && speak(state.quiz.q.say),
  'pick': el => pick(Number(el.dataset.i)),
  'play-again': () => state.quiz && startGame(state.quiz.game),
  'pick-hero': el => setState({ story: { ...state.story, hero: Number(el.dataset.i) } }),
  'pick-place': el => setState({ story: { ...state.story, place: Number(el.dataset.i) } }),
  'make-story': () => makeStory(),
  'read-story': () => readStory(),
  'say-today': () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    speak('Today is ' + days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + '.');
  },
  'toggle-routine': el => toggleRoutine(el.dataset.id),
  'get-tips': () => getTips(),
  'test-voice': () => speak('Hi ' + CHILD_NAME + "! I am Bella the bunny. Let's play and learn together!"),
  'set-voice': el => setTtsVoice(el.dataset.id),
};

appEl.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.dataset.action === 'set-tts-key') return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el);
});
appEl.addEventListener('change', e => {
  const el = e.target.closest('[data-action="set-tts-key"]');
  if (el) setTtsKey(el.value);
});

/* ---------------- boot ---------------- */

loadProgress();
render();
