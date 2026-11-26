// French B (SL) study section: course guide, grammar, verb trainer, themed vocabulary, Paper 1 writing with Claude feedback,
// Paper 2 reading practice, individual oral practice. Loaded after the main script; uses its helpers ($, esc, api, mdx, shell, …).
'use strict';
const FR = {data: null, loading: null, sec: 'home'};
const FRSEC = [['home', 'Overview', 'home'], ['gram', 'Grammar', 'book'], ['verbs', 'Verbs', 'loop'], ['vocab', 'Vocabulary', 'cards'], ['write', 'Paper 1 · Writing', 'pen'], ['read', 'Paper 2 · Reading', 'note'], ['oral', 'Individual oral', 'speak'], ['guide', 'Exam guide', 'flask']];
const FRTH = ['Identités', 'Expériences', 'Ingéniosité humaine', 'Organisation sociale', 'Partage de la planète'];
const FRTHE = {'Identités': 'Identities', 'Expériences': 'Experiences', 'Ingéniosité humaine': 'Human ingenuity', 'Organisation sociale': 'Social organization', 'Partage de la planète': 'Sharing the planet'};
async function frLoad() {
  if (FR.data) return FR.data;
  if (!FR.loading) FR.loading = Promise.all(['grammar', 'vocab', 'exam'].map(f => fetch('fr/' + f + '.json', {cache: 'no-cache'}).then(r => r.ok ? r.json() : null).catch(() => null)))
    .then(([grammar, vocab, exam]) => (FR.data = {grammar: grammar || [], vocab: vocab || [], exam: exam || {}}));
  return FR.loading;
}
// progress lives in the synced progress object
function frP() { const p = S.prog.fr = S.prog.fr || {}; for (const k of ['g', 'v', 'r', 'vq']) p[k] = p[k] || {}; p.w = p.w || []; p.o = p.o || []; return p; }
function frSave() { frP().t = Date.now(); saveProg(); }
// answers: lower case, straight apostrophes, single spaces, no final full stop; accents optional only when asked
const frN = s => String(s || '').normalize('NFC').toLowerCase().replace(/[’`´]/g, "'").replace(/\s*'\s*/g, "'").replace(/[«»"!?.;,]+$/g, '').replace(/\s+/g, ' ').trim();
const frBare = s => frN(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
function frExpand(s) { // "allé(e)(s)" -> every spelling
  let out = [s]; const re = /\(([^()]*)\)/;
  while (out.some(x => re.test(x))) out = out.flatMap(x => { const m = x.match(re); return m ? [x.replace(re, ''), x.replace(re, m[1])] : [x]; });
  return [...new Set(out)];
}
// 'ok' | 'accent' (right apart from accents) | 'no'
// verb answers: elle/on count as il, elles as ils
const frSubj = s => s.replace(/^(que |qu')?(elles|elle|on) /, (m, q, w) => (q ? (q === "qu'" ? "qu'" : 'que ') : '') + (w === 'elles' ? 'ils ' : 'il ')).replace(/^qu'(elles?|on) /, "qu'il ");
const frBareV = full => full.replace(/^(que |qu')?(je |j'|tu |il |nous |vous |ils )/, '');
function frCheck(given, answers, verb) { let g = frN(given); if (verb) g = frSubj(g); if (!g) return 'no'; const A = answers.flatMap(frExpand).map(frN);
  if (A.includes(g)) return 'ok'; const gb = frBare(g); return A.some(a => frBare(a) === gb) ? 'accent' : 'no'; }
const FRACC = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ç', 'î', 'ï', 'ô', 'ù', 'û', 'œ', '«', '»'];
const frKeys = id => `<div class="frk" data-for="${id}">${FRACC.map(c => `<button type="button" tabindex="-1" data-c="${c}">${c}</button>`).join('')}</div>`;
function frWireKeys(root) { (root || document).querySelectorAll('.frk').forEach(k => k.onmousedown = e => { const b = e.target.closest('[data-c]'); if (!b) return; e.preventDefault();
  const el = document.getElementById(k.dataset.for) || document.activeElement; if (!el || !('value' in el)) return; const a = el.selectionStart ?? el.value.length, z = el.selectionEnd ?? a;
  el.value = el.value.slice(0, a) + b.dataset.c + el.value.slice(z); el.selectionStart = el.selectionEnd = a + 1; el.focus(); el.dispatchEvent(new Event('input', {bubbles: true})); }); }
// French text to speech
function frVoice() { const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || []; return vs.find(v => /^fr(-|_)FR/i.test(v.lang) && /google|amélie|thomas|audrey|natural/i.test(v.name)) || vs.find(v => /^fr(-|_)FR/i.test(v.lang)) || vs.find(v => /^fr/i.test(v.lang)); }
function frSay(text, btn) { const ss = window.speechSynthesis; if (!ss) return;
  if (ss.speaking || ss.pending) { ss.cancel(); document.querySelectorAll('.frsay.on').forEach(x => x.classList.remove('on')); if (btn && btn.classList.contains('on')) return; }
  const u = new SpeechSynthesisUtterance(String(text).replace(/\(e\)|\(s\)|\(es\)/g, '')); const v = frVoice(); if (v) u.voice = v; u.lang = v ? v.lang : 'fr-FR'; u.rate = .92 * (+SETG().ttsRate || 1);
  if (btn) { btn.classList.add('on'); u.onend = u.onerror = () => btn.classList.remove('on'); } ss.speak(u); }
const frSayB = t => `<button type="button" class="ghost ic2 frsay" data-say="${esc(t)}" title="Hear it" aria-label="Hear it"><svg class="i"><use href="#i-speak"/></svg></button>`;
function frWireSay(root) { (root || document).querySelectorAll('[data-say]').forEach(b => b.onclick = e => { e.stopPropagation(); frSay(b.dataset.say, b); }); }
const frShuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const frPct = (s, m) => m ? Math.round(s / m * 100) : 0;
const frWords = t => (String(t).match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length;
async function frAsk(sys, user) { // one marking call through the relay; returns parsed JSON (or text)
  const r = await api('ask', {mode: 'mark', rubric: sys, book: (S.book && S.book.id) || '', pages: [], messages: [{role: 'user', content: user}]});
  return r.text || '';
}

// ---------- shell ----------
function renderFrench(sec, id) {
  shell('fr'); FR.sec = sec = FRSEC.some(x => x[0] === sec) ? sec : 'home'; FR.id = id || ''; FR.ctx = null;
  setHash('#/fr' + (sec !== 'home' ? '/' + sec + (id ? '/' + encodeURIComponent(id) : '') : ''));
  title(sec === 'home' ? ['French B'] : [['French B', 'fr'], FRSEC.find(x => x[0] === sec)[1]]);
  MATH = false; scrollTo(0, 0);
  $('#main').innerHTML = `<div class="prac fr" style="max-width:980px"><div class="frnav seg" role="tablist">${FRSEC.map(([k, l]) => `<button data-fs="${k}" class="${k === sec ? 'on' : ''}">${l}</button>`).join('')}</div><div id="frb" style="margin-top:16px"><p><span class="spin"></span> Loading…</p></div></div>`;
  document.querySelectorAll('[data-fs]').forEach(b => b.onclick = () => renderFrench(b.dataset.fs));
  { const on = document.querySelector('.frnav .on'); if (on) on.scrollIntoView({block: 'nearest', inline: 'center'}); }
  frLoad().then(D => { if (S.tab !== 'fr' || FR.sec !== sec) return;
    ({home: frHome, gram: frGram, verbs: frVerbs, vocab: frVocab, write: frWrite, read: frRead, oral: frOral, guide: frGuide})[sec](D, id); });
}
const frBox = () => $('#frb');

// ---------- overview ----------
function frHome(D) {
  const p = frP(), G = D.grammar, gDone = G.filter(t => p.g[t.id] && p.g[t.id].b >= .8).length;
  const vq = Object.values(p.v), vOk = vq.reduce((s, x) => s + x[0], 0), vN = vq.reduce((s, x) => s + x[1], 0);
  const rd = D.exam.reading || [], rDone = rd.filter(r => p.r[r.id]).length, lastW = p.w[p.w.length - 1];
  const decks = myDecks().filter(d => /^French · /.test(d.name)), cards = decks.reduce((s, d) => s + d.cards.length, 0), due = decks.reduce((s, d) => s + deckStats(d).due, 0);
  const weakG = G.filter(t => p.g[t.id] && p.g[t.id].b < .8).sort((a, b) => p.g[a.id].b - p.g[b.id].b).slice(0, 3);
  const tile = (sec, h, sub, stat) => `<button class="card frt" data-go="${sec}"><b>${h}</b><span class="meta">${sub}</span>${stat ? `<span class="frst">${stat}</span>` : ''}</button>`;
  frBox().innerHTML = `<div class="row" style="align-items:flex-end;gap:12px;flex-wrap:wrap"><div><h2>Français B · SL</h2><p class="meta" style="margin:4px 0 0">Five themes, three exams: Paper 1 writing (25%), Paper 2 listening + reading (50%), individual oral (25%).</p></div><span class="sp"></span><button class="pri" id="frWarm"><svg class="i"><use href="#i-spark"/></svg>5-minute warm-up</button></div>
    <div class="grid frtiles" style="margin-top:16px">
      ${tile('gram', 'Grammar', `${G.length} topics with explanations, common mistakes and self-marking checks`, G.length ? `${gDone}/${G.length} mastered` : '')}
      ${tile('verbs', 'Verb trainer', `${FRV.list().length} verbs in 10 tenses · tables and drills`, vN ? `${frPct(vOk, vN)}% right · ${vN} answered` : '')}
      ${tile('vocab', 'Vocabulary', 'Words, phrases and oral questions for every theme', cards ? `${cards} cards · ${due} due` : '')}
      ${tile('write', 'Paper 1 · Writing', 'Text types, 30 prompts, timed drafts marked by Claude against A, B and C', lastW ? `Last: ${lastW.total}/30` : '')}
      ${tile('read', 'Paper 2 · Reading', 'Practice texts with exam question types, plus new ones on demand', rd.length ? `${rDone}/${rd.length} done` : '')}
      ${tile('oral', 'Individual oral', 'Visual stimuli, 15-minute prep timer, conversation practice with Claude', p.o.length ? `${p.o.length} practice${p.o.length > 1 ? 's' : ''}` : '')}
      ${tile('guide', 'Exam guide', 'Components, criteria, what makes a 7, Paper 2 strategies', '')}
    </div>
    ${weakG.length ? `<h3 style="margin-top:26px">Grammar to revisit</h3><div class="card lst">${weakG.map(t => `<a href="#" data-g="${t.id}" class="row" style="text-decoration:none;color:inherit"><span>${esc(t.title)}</span><span class="sp"></span><span class="tag w">${Math.round(p.g[t.id].b * 100)}%</span></a>`).join('')}</div>` : ''}
    <h3 style="margin-top:26px">The five themes</h3><div class="grid">${FRTH.map(th => { const V = D.vocab.find(v => v.theme === th); return `<button class="card frt" data-th="${esc(th)}"><b>${V && V.icon ? V.icon + ' ' : ''}${esc(th)}</b><span class="meta">${esc(FRTHE[th])}${V ? ' · ' + V.topics.map(t => esc(t.topic)).join(', ') : ''}</span></button>`; }).join('')}</div>`;
  document.querySelectorAll('#frb [data-go]').forEach(b => b.onclick = () => renderFrench(b.dataset.go));
  document.querySelectorAll('#frb [data-g]').forEach(a => a.onclick = e => { e.preventDefault(); renderFrench('gram', a.dataset.g); });
  document.querySelectorAll('#frb [data-th]').forEach(b => b.onclick = () => renderFrench('vocab', b.dataset.th));
  $('#frWarm').onclick = () => frWarmup(D);
}
// mixed quick quiz: verb forms, vocabulary and grammar checks, weakest first
function frWarmup(D) {
  const p = frP(), items = [];
  const vs = frShuffle(FRV.list().filter(v => FRV.V[v].irr || Math.random() < .3)).slice(0, 4);
  for (const v of vs) { const t = frShuffle(['pres', 'pc', 'impf', 'fut', 'cond', 'subj'])[0], c = (FRV.conj(v, t) || []).filter(Boolean); if (!c.length) continue; const x = c[Math.floor(Math.random() * c.length)];
    items.push({q: `<b>${esc(v)}</b> · ${esc(FRV.T.find(z => z[0] === t)[1])} · <i>${esc(x.p)}</i>`, a: FRV.variants(v, t, x.full).concat(FRV.variants(v, t, frBareV(x.full))), show: x.full, vk: v + '|' + t}); }
  const words = D.vocab.filter(v => FRTH.includes(v.theme)).flatMap(v => v.topics.flatMap(t => t.words.map(w => ({...w, tp: t.topic}))));
  for (const w of frShuffle(words).slice(0, 4)) items.push({q: `In French: <b>${esc(w.en)}</b> <span class="meta">(${esc(w.tp)})</span>`, a: frVocabAns(w.fr), show: w.fr, lax: 1});
  const G = D.grammar, gs = frShuffle(G).sort((a, b) => ((p.g[a.id] || {b: .5}).b) - ((p.g[b.id] || {b: .5}).b)).slice(0, 4);
  for (const t of gs) { const c = frShuffle(t.check || [])[0]; if (c) items.push({q: `<span class="meta">${esc(t.title)}</span><br>${esc(c.q)}`, a: c.a, show: c.a[0], why: c.why}); }
  frQuiz(frShuffle(items), '5-minute warm-up', () => renderFrench('home'));
}
// the vocab answer can drop the article: "le sommeil" also accepts "sommeil"; "épuisé(e)" accepts both forms
function frVocabAns(fr) { const base = String(fr).split(/\s*[\/;]\s*/), out = [];
  for (const b of base) { out.push(b); const m = b.match(/^(le |la |les |l'|l’|un |une |des )(.+)$/i); if (m) out.push(m[2]); }
  return out; }
// generic typed quiz: items {q (html), a [answers], show, why?, lax? (accents optional), vk? (verb stat key)}
function frQuiz(items, name, back, onEnd) {
  let i = 0, ok = 0, res = [];
  const p = frP();
  const draw = () => {
    if (i >= items.length) { const html = `<div class="card fb"><h3 style="margin-top:0">${esc(name)}: ${ok} / ${items.length}</h3><div class="lst">${res.map(r => `<div><span class="tag ${r.r === 'ok' ? 'g' : 'w'}">${r.r === 'ok' ? '✓' : r.r === 'accent' ? 'accent' : '✗'}</span> ${r.it.q}<div class="meta">${r.r === 'ok' ? '' : 'You wrote: ' + esc(r.g || '—') + ' · '}Answer: <b>${esc(r.it.show)}</b>${r.it.why ? ' · ' + esc(r.it.why) : ''}</div></div>`).join('')}</div><div class="row" style="margin-top:14px"><button class="pri" id="qAgain">Again</button><button id="qBack">Back</button></div></div>`;
      frBox().innerHTML = html; $('#qBack').onclick = back; $('#qAgain').onclick = () => frQuiz(frShuffle(items), name, back, onEnd); if (onEnd) onEnd(ok, items.length, res); frSave(); return; }
    const it = items[i];
    frBox().innerHTML = `<div class="card qbig frq"><div class="meta">${esc(name)} · ${i + 1} / ${items.length}</div><div style="margin:10px 0 14px">${it.q}</div>
      <form id="qF" class="row" autocomplete="off"><input id="qA" autocapitalize="off" autocorrect="off" spellcheck="false" lang="fr" placeholder="Type the answer" style="flex:1;min-width:200px"><button class="pri">Check</button><button type="button" id="qSkip" class="ghost">Skip</button></form>${frKeys('qA')}<div id="qR"></div></div>`;
    frWireKeys(frBox()); $('#qA').focus();
    let done = false;
    const finish = r => { done = true; const g = $('#qA').value; res.push({it, r, g}); if (r === 'ok') ok++;
      if (it.vk) { const s = p.v[it.vk] = p.v[it.vk] || [0, 0]; s[1]++; if (r === 'ok') s[0]++; }
      $('#qR').innerHTML = `<div class="frres ${r}">${r === 'ok' ? '✓ Correct' : r === 'accent' ? '≈ Nearly: check the accents' : '✗ Not quite'} · <b>${esc(it.show)}</b> ${frSayB(it.show)}${it.why ? `<div class="meta">${esc(it.why)}</div>` : ''}</div><div class="meta" style="margin-top:6px">Enter for the next one</div>`;
      frWireSay($('#qR')); $('#qA').readOnly = true; };
    $('#qF').onsubmit = e => { e.preventDefault(); if (done) { i++; return draw(); } let r = frCheck($('#qA').value, it.a, !!it.vk); if (r === 'accent' && it.lax) r = 'ok'; finish(r); };
    $('#qSkip').onclick = () => { if (!done) finish('no'); i++; draw(); };
  };
  draw();
}

// ---------- grammar ----------
function frGram(D, id) {
  const G = D.grammar, p = frP();
  if (!G.length) { frBox().innerHTML = '<p class="meta">Grammar notes are not available yet.</p>'; return; }
  const t = id && G.find(x => x.id === id);
  if (t) return frGramTopic(D, t);
  const groups = {}; for (const x of G) (groups[x.group] = groups[x.group] || []).push(x);
  const draw = q => { q = (q || '').toLowerCase();
    $('#gl').innerHTML = Object.entries(groups).map(([g, L]) => { L = L.filter(x => !q || (x.title + x.summary + x.body).toLowerCase().includes(q)); if (!L.length) return '';
      return `<h3>${esc(g)}</h3><div class="card lst">${L.map(x => { const s = p.g[x.id]; return `<a href="#" class="frg" data-g="${x.id}"><div><b>${esc(x.title)}</b>${x.level === 'stretch' ? ' <span class="tag">stretch</span>' : ''}<div class="meta">${esc(x.summary || '')}</div></div>${s ? `<span class="tag ${s.b >= .8 ? 'g' : 'w'}">${Math.round(s.b * 100)}%</span>` : ''}</a>`; }).join('')}</div>`; }).join('') || '<p class="meta">No matches.</p>';
    document.querySelectorAll('#gl [data-g]').forEach(a => a.onclick = e => { e.preventDefault(); renderFrench('gram', a.dataset.g); }); };
  frBox().innerHTML = `<div class="row"><h2 style="margin:0">Grammar</h2><span class="sp"></span><button id="gMix">Mixed check (12)</button></div><p class="meta">Each topic: how it works, when the exam rewards it, the mistakes English speakers make, and a self-marking check. <span class="tag">stretch</span> topics are the structures that lift Criterion A at SL.</p><input id="gq" type="search" placeholder="Search grammar (e.g. subjonctif, dont, si)" style="max-width:360px;margin:4px 0 8px"><div id="gl"></div>`;
  $('#gq').oninput = e => draw(e.target.value); draw('');
  $('#gMix').onclick = () => frQuiz(frShuffle(G.flatMap(t => (t.check || []).map(c => ({q: `<span class="meta">${esc(t.title)}</span><br>${esc(c.q)}`, a: c.a, show: c.a[0], why: c.why, gid: t.id})))).slice(0, 12), 'Mixed grammar check', () => renderFrench('gram'));
}
function frGramTopic(D, t) {
  const G = D.grammar, i = G.indexOf(t), p = frP(), s = p.g[t.id];
  FR.ctx = {label: 'French grammar: ' + t.title, screen: `French B grammar topic "${t.title}": ${t.summary}`};
  title([['French B', 'fr'], ['Grammar', 'fr'], t.title]); $('#ttl').querySelectorAll('[data-go]')[1].onclick = () => renderFrench('gram');
  frBox().innerHTML = `<div class="row"><button class="ghost" id="gBack"><svg class="i"><use href="#i-l"/></svg>All grammar</button><span class="sp"></span>${s ? `<span class="tag ${s.b >= .8 ? 'g' : 'w'}">Best check ${Math.round(s.b * 100)}%</span>` : ''}</div>
    <article class="card page frpage" lang="fr"><div class="meta" style="font-family:var(--f-ui)">${esc(t.group)}${t.level === 'stretch' ? ' · stretch (lifts Criterion A)' : ''}</div><h1>${esc(t.title)}</h1><p><i>${esc(t.summary || '')}</i></p>
      ${t.exam ? `<div class="co tip"><div class="ct">In the exam</div><p>${mdx(t.exam, true)}</p></div>` : ''}
      ${mdx(t.body || '')}
      ${(t.pitfalls || []).length ? `<h2>Common mistakes</h2><ul class="frpit">${t.pitfalls.map(x => `<li>${mdx(x, true)}</li>`).join('')}</ul>` : ''}</article>
    ${(t.check || []).length ? `<h3 style="margin-top:22px">Check yourself</h3><div class="card fb" id="gc">${t.check.map((c, k) => `<div class="frci"><div>${k + 1}. ${esc(c.q)}</div><input data-k="${k}" id="gci${k}" lang="fr" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="answer"><div class="frcr" id="gcr${k}"></div></div>`).join('')}
      ${frKeys('')}<div class="row" style="margin-top:12px"><button class="pri" id="gChk">Check answers</button><button id="gRe" class="ghost">Clear</button><span class="meta" id="gSc"></span></div></div>` : ''}
    <div class="row" style="margin-top:16px;flex-wrap:wrap"><button id="gAsk"><svg class="i"><use href="#i-spark"/></svg>Ask Claude about this</button><button id="gMore"><svg class="i"><use href="#i-spark"/></svg>10 more exercises</button><button id="gCards">Make flashcards from the checks</button><span class="sp"></span>
      ${i > 0 ? `<button class="ghost" data-g="${G[i - 1].id}">← ${esc(G[i - 1].title)}</button>` : ''}${i < G.length - 1 ? `<button class="ghost" data-g="${G[i + 1].id}">${esc(G[i + 1].title)} →</button>` : ''}</div>`;
  frWireKeys(frBox());
  $('#gBack').onclick = () => renderFrench('gram');
  document.querySelectorAll('#frb [data-g]').forEach(b => b.onclick = () => { renderFrench('gram', b.dataset.g); scrollTo(0, 0); });
  if ($('#gChk')) {
    $('#gChk').onclick = () => { let sc = 0; t.check.forEach((c, k) => { const r = frCheck($('#gci' + k).value, c.a); if (r === 'ok') sc++;
      $('#gcr' + k).innerHTML = `<span class="frres ${r}">${r === 'ok' ? '✓' : r === 'accent' ? '≈ accents' : '✗'}</span> ${r === 'ok' ? '' : '<b>' + esc(c.a[0]) + '</b> · '}<span class="meta">${esc(c.why || '')}</span>`; });
      const b = sc / t.check.length, o = p.g[t.id] || {b: 0}; p.g[t.id] = {b: Math.max(o.b, b), l: b, t: Date.now()}; frSave();
      $('#gSc').textContent = `${sc} / ${t.check.length}${b >= .8 ? ' · mastered' : ''}`; };
    $('#gRe').onclick = () => { document.querySelectorAll('#gc input').forEach(x => x.value = ''); document.querySelectorAll('.frcr').forEach(x => x.innerHTML = ''); $('#gSc').textContent = ''; };
    document.querySelectorAll('#gc input').forEach(x => x.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const n = $('#gci' + (+x.dataset.k + 1)); if (n) n.focus(); else $('#gChk').click(); } });
  }
  $('#gAsk').onclick = () => openChat({title: 'French · ' + t.title, book: S.book && S.book.id, pages: [], intro: `[I'm studying French B SL grammar: "${t.title}" (${t.summary}). Explain in English with French examples; correct my French when I write it.]\n\n`});
  $('#gMore').onclick = () => { openChat({title: 'French · ' + t.title, book: S.book && S.book.id, pages: [], intro: ''}); sendChat(`Give me 10 new fill-in-the-gap exercises on the French grammar point "${t.title}" at IB French B SL level (B1-B2). Use themes from the IB syllabus. Number them, put the clue (verb, tense or English) in brackets, and put the answers with one-line explanations at the very end under a heading "Réponses" so I can try first.`); };
  $('#gCards').onclick = () => { const d = addCards('French · Grammar', '', t.check.map(c => ({f: c.q, b: c.a[0] + (c.why ? '\n\n' + c.why : '')}))); $('#gCards').textContent = `Added to “${d.name}” ✓`; $('#gCards').disabled = true; };
}

// ---------- verbs ----------
function frVerbs(D, id) {
  const L = FRV.list(), v = id && FRV.V[id] ? id : (FR.verb || 'être'); FR.verb = v;
  const p = frP();
  const weak = Object.entries(p.v).filter(([, x]) => x[1] >= 2 && x[0] / x[1] < .7).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).slice(0, 8);
  frBox().innerHTML = `<div class="row" style="flex-wrap:wrap"><h2 style="margin:0">Verbs</h2><span class="sp"></span><input id="vS" list="vL" placeholder="Look up a verb…" value="" style="width:220px" lang="fr" autocapitalize="off"><datalist id="vL">${L.map(x => `<option value="${esc(x)}">${esc(FRV.V[x].en)}</option>`).join('')}</datalist></div>
    <div class="card fb" style="margin-top:12px"><b>Drill</b><div class="meta">Type each form with its subject (e.g. <i>nous sommes allés</i>); the subject on its own can be left off. Past participles agree in brackets: any agreement is accepted.</div>
      <div class="fl" style="margin-top:10px">Tenses</div><div class="chips" id="vT">${FRV.T.map(([k, n]) => `<label class="ck"><input type="checkbox" value="${k}" ${(LS.get('fr-vt', ['pres', 'pc', 'impf', 'fut']) || []).includes(k) ? 'checked' : ''}>${esc(n)}</label>`).join('')}</div>
      <div class="fl" style="margin-top:10px">Verbs</div><div class="seg" id="vSet">${[['irr', 'Key irregulars'], ['reg', 'Regular + spelling changes'], ['refl', 'Reflexive'], ['all', 'All'], ['weak', 'My weak ones']].map(([k, l]) => `<button data-v="${k}" class="${(LS.get('fr-vs', 'irr')) === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="row" style="margin-top:12px"><label class="ck"><input type="checkbox" id="vLax" ${LS.get('fr-vlax', 0) ? 'checked' : ''}>Accept missing accents</label><span class="sp"></span><select id="vN" style="width:auto">${[10, 20, 30].map(n => `<option ${n === LS.get('fr-vn', 20) ? 'selected' : ''}>${n}</option>`).join('')}</select><button class="pri" id="vGo">Start drill</button></div></div>
    ${weak.length ? `<p class="meta" style="margin-top:10px">Slipping: ${weak.map(([k, x]) => { const [vv, t] = k.split('|'); return `<a href="#" data-vv="${esc(vv)}">${esc(vv)}</a> (${esc(FRV.T.find(z => z[0] === t)[1].toLowerCase())}, ${x[0]}/${x[1]})`; }).join(', ')}</p>` : ''}
    <div id="vTab" style="margin-top:18px"></div>`;
  const pick = x => { const vv = x.trim().toLowerCase().replace(/’/g, "'"); if (FRV.V[vv]) { FR.verb = vv; history.replaceState(null, '', '#/fr/verbs/' + encodeURIComponent(vv)); frVerbTable(vv); } };
  $('#vS').onchange = e => pick(e.target.value); $('#vS').onkeydown = e => { if (e.key === 'Enter') pick(e.target.value); };
  document.querySelectorAll('[data-vv]').forEach(a => a.onclick = e => { e.preventDefault(); pick(a.dataset.vv); });
  document.querySelectorAll('#vSet [data-v]').forEach(b => b.onclick = () => { LS.set('fr-vs', b.dataset.v); document.querySelectorAll('#vSet button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#vGo').onclick = () => {
    const ts = [...document.querySelectorAll('#vT input:checked')].map(x => x.value), set = LS.get('fr-vs', 'irr'), n = +$('#vN').value, lax = $('#vLax').checked;
    LS.set('fr-vt', ts); LS.set('fr-vn', n); LS.set('fr-vlax', lax ? 1 : 0); if (!ts.length) return alert('Pick at least one tense.');
    let vs = L.filter(x => set === 'all' || (set === 'irr' ? FRV.V[x].irr && !FRV.V[x].refl : set === 'reg' ? !FRV.V[x].irr && !FRV.V[x].refl : set === 'refl' ? FRV.V[x].refl : true));
    const pool = [];
    if (set === 'weak') { for (const [k] of Object.entries(p.v).filter(([, x]) => x[0] / x[1] < .8).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])) { const [vv, t] = k.split('|'); if (FRV.V[vv]) pool.push([vv, t]); } if (!pool.length) return alert('Nothing weak yet: do a few drills first.'); }
    else for (const vv of vs) for (const t of ts) pool.push([vv, t]);
    const items = [];
    for (const [vv, t] of frShuffle(pool)) { if (items.length >= n) break; const c = (FRV.conj(vv, t) || []).filter(Boolean); if (!c.length) continue; const x = c[Math.floor(Math.random() * c.length)];
      const ans = [...FRV.variants(vv, t, x.full), ...FRV.variants(vv, t, frBareV(x.full))]; if (t === 'subj') ans.push(...FRV.variants(vv, t, x.full.replace(/^que |^qu'/, '')));
      items.push({q: `<b style="font-size:1.25em">${esc(vv)}</b> <span class="meta">${esc(FRV.V[vv].en)}</span><br><span class="tag">${esc(FRV.T.find(z => z[0] === t)[1])}</span> <i>${esc(x.p)}</i>`, a: ans, show: x.full, vk: vv + '|' + t, lax}); }
    frQuiz(items, 'Verb drill', () => renderFrench('verbs'));
  };
  frVerbTable(v);
}
function frVerbTable(v) {
  const V = FRV.V[v]; FR.ctx = {label: 'French verb tables: ' + v, screen: 'Verb tables for ' + v};
  $('#vTab').innerHTML = `<div class="row" style="align-items:baseline;gap:10px"><h3 style="margin:0;font:600 24px var(--f-read)" lang="fr">${esc(v)}</h3><span class="meta">${esc(V.en)} · auxiliary <b>${V.aux}</b> · past participle <b lang="fr">${esc(V.pp)}</b>${V.irr ? ' · irregular' : V.cls ? ' · spelling change' : ''}</span>${frSayB(v)}</div>
    <div class="grid frvt" style="margin-top:12px">${FRV.T.map(([t, n]) => { const c = FRV.conj(v, t); return c ? `<div class="card"><div class="row"><b>${esc(n)}</b><span class="sp"></span>${frSayB(c.filter(Boolean).map(x => x.full).join(', '))}</div><div lang="fr">${c.filter(Boolean).map(x => `<div>${esc(x.full).replace(esc(x.f), '<b>' + esc(x.f) + '</b>')}</div>`).join('')}</div></div>` : ''; }).join('')}</div>
    <p class="meta">Imparfait stem = <i>nous</i> present minus <i>-ons</i>; future and conditional share the stem <b lang="fr">${esc(V.fut)}-</b>; subjunctive from <i>ils</i> present (<i>nous</i>/<i>vous</i> from <i>nous</i>).</p>`;
  frWireSay($('#vTab'));
}

// ---------- vocabulary ----------
function frVocab(D, id) {
  const VB = D.vocab; if (!VB.length) { frBox().innerHTML = '<p class="meta">Vocabulary is not available yet.</p>'; return; }
  const [thN, tpN] = String(id || '').split('|'), th = VB.find(x => x.theme === thN);
  if (th && tpN) { const tp = th.topics.find(x => x.topic === tpN); if (tp) return frVocabTopic(th, tp); }
  const cur = th || null;
  frBox().innerHTML = `<div class="row"><h2 style="margin:0">Vocabulary</h2><span class="sp"></span><input id="vq" type="search" placeholder="Search French or English…" style="max-width:260px"></div>
    <div class="seg" id="vth" style="margin-top:12px;flex-wrap:wrap">${VB.map(x => `<button data-th="${esc(x.theme)}" class="${cur === x ? 'on' : ''}">${x.icon ? x.icon + ' ' : ''}${esc(x.theme)}</button>`).join('')}</div><div id="vb" style="margin-top:14px"></div>`;
  const draw = () => { const q = frBare($('#vq').value);
    if (q.length > 1) { const hits = []; for (const T of VB) for (const tp of T.topics) for (const w of tp.words.concat(tp.phrases || [])) if (frBare(w.fr + ' ' + w.en).includes(q)) hits.push({w, tp, T});
      $('#vb').innerHTML = `<p class="meta">${hits.length} match${hits.length === 1 ? '' : 'es'}</p><div class="card lst frwl">${hits.slice(0, 120).map(h => `<div><span lang="fr"><b>${esc(h.w.fr)}</b></span>${frSayB(h.w.fr)}<span class="sp"></span><span>${esc(h.w.en)}</span><span class="meta" style="margin-left:10px">${esc(h.tp.topic)}</span></div>`).join('')}</div>`; frWireSay($('#vb')); return; }
    const T = cur || VB[0];
    $('#vb').innerHTML = `<div class="grid">${T.topics.map(tp => { const d = myDecks().find(x => x.name === 'French · ' + tp.topic); const st = d ? deckStats(d) : null; const qd = frP().vq[tp.topic];
      return `<button class="card frt" data-tp="${esc(tp.topic)}"><b lang="fr">${esc(tp.topic)}</b><span class="meta">${esc(tp.en)} · ${tp.words.length} words${(tp.phrases || []).length ? ' · ' + tp.phrases.length + ' phrases' : ''}</span>${d || qd ? `<span class="frst">${d ? 'In flashcards' + (st.due ? ' · ' + st.due + ' due' : '') : ''}${d && qd ? ' · ' : ''}${qd ? 'Quiz best ' + Math.round(qd * 100) + '%' : ''}</span>` : ''}</button>`; }).join('')}</div>`;
    document.querySelectorAll('#vb [data-tp]').forEach(b => b.onclick = () => renderFrench('vocab', T.theme + '|' + b.dataset.tp)); };
  document.querySelectorAll('#vth [data-th]').forEach(b => b.onclick = () => renderFrench('vocab', b.dataset.th));
  $('#vq').oninput = draw; draw();
}
function frVocabTopic(T, tp) {
  FR.ctx = {label: 'French vocabulary: ' + tp.topic, screen: `French B vocabulary topic "${tp.topic}" (${tp.en}), theme ${T.theme}. Words: ${tp.words.slice(0, 60).map(w => w.fr + ' = ' + w.en).join('; ')}`};
  title([['French B', 'fr'], ['Vocabulary', 'fr'], tp.topic]); $('#ttl').querySelectorAll('[data-go]')[1].onclick = () => renderFrench('vocab', T.theme);
  const dn = 'French · ' + tp.topic, inDeck = () => myDecks().find(x => x.name === dn);
  frBox().innerHTML = `<div class="row" style="flex-wrap:wrap"><button class="ghost" id="vBack"><svg class="i"><use href="#i-l"/></svg>${esc(T.theme)}</button><span class="sp"></span><button id="vQ">Quiz (EN → FR)</button><button id="vQ2">Quiz (FR → EN, flip)</button><button class="pri" id="vAdd"></button></div>
    <h2 style="margin:12px 0 2px" lang="fr">${esc(tp.topic)}</h2><p class="meta" style="margin:0 0 12px">${esc(tp.en)} · theme: ${esc(T.theme)} (${esc(T.en || FRTHE[T.theme] || '')})</p>
    <div class="card lst frwl">${tp.words.map(w => `<div><span lang="fr"><b>${esc(w.fr)}</b>${w.g ? ` <span class="meta">(${w.g === 'f' ? 'f' : 'm'})</span>` : ''}</span>${frSayB(w.fr)}<span class="sp"></span><span>${esc(w.en)}</span></div>`).join('')}</div>
    ${(tp.phrases || []).length ? `<h3>Useful phrases</h3><div class="card lst frwl">${tp.phrases.map(w => `<div><span lang="fr"><b>${esc(w.fr)}</b></span>${frSayB(w.fr)}<span class="sp"></span><span>${esc(w.en)}</span></div>`).join('')}</div>` : ''}
    ${(tp.questions || []).length ? `<h3>Oral questions on this topic</h3><div class="card lst">${tp.questions.map((q, k) => `<div class="row"><span lang="fr">${esc(q)}</span>${frSayB(q)}<span class="sp"></span><button class="ghost" data-oq="${k}">Practise</button></div>`).join('')}</div>` : ''}`;
  frWireSay(frBox());
  const setAdd = () => { const d = inDeck(); $('#vAdd').innerHTML = d ? `Study flashcards${deckStats(d).due ? ' · ' + deckStats(d).due + ' due' : ''}` : 'Add to my flashcards'; };
  setAdd();
  $('#vAdd').onclick = () => { let d = inDeck(); if (!d) { d = addCards(dn, '', [...tp.words, ...(tp.phrases || [])].map(w => ({f: w.fr + (w.g ? ` (${w.g})` : ''), b: w.en}))); return setAdd(); }
    const L = d.cards.map(c => deckCard(d, c)), due = L.filter(c => { const s = S.prog.terms[c.key]; return !s || cardDue(s); });
    if (!due.length) return alert('Nothing due in this deck right now. Try the quiz.'); shell('terms'); studyCards(frShuffle(due).slice(0, 20), () => renderFrench('vocab', T.theme + '|' + tp.topic)); };
  $('#vBack').onclick = () => renderFrench('vocab', T.theme);
  const save = (s, m) => { const p = frP(); p.vq[tp.topic] = Math.max(p.vq[tp.topic] || 0, s / m); };
  $('#vQ').onclick = () => frQuiz(frShuffle(tp.words).slice(0, 15).map(w => ({q: `In French: <b>${esc(w.en)}</b>`, a: frVocabAns(w.fr), show: w.fr, lax: 1})), tp.topic, () => frVocabTopic(T, tp), save);
  $('#vQ2').onclick = () => { shell('fr'); studyCards(frShuffle(tp.words).slice(0, 20).map(w => ({key: 'fr~' + tp.topic + '~' + w.fr, f: w.fr, b: w.en, book: '', src: 'French · ' + tp.topic})), () => renderFrench('vocab', T.theme + '|' + tp.topic)); };
  document.querySelectorAll('[data-oq]').forEach(b => b.onclick = () => frOralQ(tp.questions[+b.dataset.oq], tp.topic));
}

// ---------- Paper 1 writing ----------
const FR_P1_SYS = `You are an experienced IB French B examiner marking a Standard Level Paper 1 (writing) response. The task asks for 250-400 words in a given text type. Mark strictly against the IB French B SL Paper 1 criteria:
A Language (0-12): vocabulary range and accuracy, grammatical structures (range, complexity, accuracy), how errors affect communication.
B Message (0-12): relevance of ideas to the task, development and support of ideas, organisation and coherence (cohesive devices, paragraphing).
C Conceptual understanding (0-6): choice of text type, register and tone for the audience and purpose, recognisable conventions of the text type.
Use the IB markbands faithfully: a 10-12 in A needs a wide, idiomatic range and complex structures (subjunctive, si clauses, relative pronouns like dont/lequel, gérondif) used mostly accurately; frequent basic errors (agreements, auxiliaries, tenses) keep A at 7-9 or below. Penalise B if ideas are listed rather than developed. Responses well under 250 words usually cannot fully meet B. Do not reward memorised content that ignores the task.
Write feedback in English. Quote the student's exact words when correcting. Return ONLY a JSON object:
{"A":{"mark":n,"why":"2-3 sentences"},"B":{"mark":n,"why":"..."},"C":{"mark":n,"why":"..."},"total":n,"grade":"likely IB grade 1-7 for this paper alone","strengths":["..."],"corrections":[{"wrong":"exact words","right":"corrected French","why":"short rule"}],"upgrades":[{"from":"simple phrase they used","to":"more sophisticated French","why":"what it shows"}],"next":["the 2-3 most valuable things to do next time"],"model":"one paragraph of their text rewritten at a grade-7 standard, keeping their ideas"}
List up to 12 corrections, most important first (grammar that recurs, then accuracy, then style).`;
function frWrite(D, id) {
  const E = D.exam, TT = E.textTypes || [], PR = E.prompts || [], p = frP();
  if (id && id.startsWith('tt:')) { const t = TT.find(x => x.id === id.slice(3)); if (t) return frTextType(D, t); }
  if (id === 'draft') return frDraft(D, LS.get('fr-draft', null));
  const dr = LS.get('fr-draft', null);
  frBox().innerHTML = `<h2 style="margin:0">Paper 1 · Writing</h2><p class="meta">1 h 15 min · choose one of three tasks · 250–400 words · /30 (Language 12, Message 12, Conceptual understanding 6) · 25% of the grade.</p>
    ${dr && dr.text ? `<div class="card fb row" style="margin-top:6px"><div><b>Draft in progress</b><div class="meta">${esc(dr.task.text.slice(0, 120))}… · ${frWords(dr.text)} words</div></div><span class="sp"></span><button class="pri" id="wRes">Continue</button></div>` : ''}
    <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="pri" id="wExam"><svg class="i"><use href="#i-pen"/></svg>Exam conditions: 3 tasks, 75 min</button><button id="wFree">Write on my own task</button></div>
    <h3>Tasks by theme</h3><div class="seg" id="wTh" style="flex-wrap:wrap"><button data-t="" class="on">All</button>${FRTH.map(t => `<button data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div><div class="card lst" id="wPl" style="margin-top:10px"></div>
    <h3>Text types</h3><p class="meta">Criterion C is marked on text type, register and conventions: know the layout of each one.</p><div class="grid">${TT.map(t => `<button class="card frt" data-tt="${t.id}"><b>${esc(t.name)}</b><span class="meta">${esc(t.category || '')}${t.register ? ' · ' + esc(t.register) : ''}</span></button>`).join('')}</div>
    ${p.w.length ? `<h3>Your marked pieces</h3><div class="card lst">${p.w.slice().reverse().map((w, k) => `<a href="#" class="row" data-wi="${p.w.length - 1 - k}" style="text-decoration:none;color:inherit"><span>${esc(new Date(w.t).toLocaleDateString())} · ${esc((TT.find(x => x.id === w.type) || {}).name || w.type || 'Own task')}</span><span class="sp"></span><span class="meta">${w.words} words</span><span class="tag ${w.total >= 24 ? 'g' : 'w'}">${w.total}/30</span></a>`).join('')}</div>` : ''}
    <div class="card page frpage" style="margin-top:22px">${mdx(E.paper1Tips || '')}</div>`;
  const drawP = th => { const L = PR.filter(x => !th || x.theme === th);
    $('#wPl').innerHTML = L.map(x => `<div class="row frpr"><div style="flex:1;min-width:240px"><div class="meta">${esc(x.theme)} · ${esc((TT.find(t => t.id === x.type) || {}).name || x.type)}</div><div lang="fr">${esc(x.text)}</div></div><button data-pi="${PR.indexOf(x)}">Write</button></div>`).join('');
    document.querySelectorAll('#wPl [data-pi]').forEach(b => b.onclick = () => frStartDraft(D, PR[+b.dataset.pi])); };
  document.querySelectorAll('#wTh [data-t]').forEach(b => b.onclick = () => { document.querySelectorAll('#wTh button').forEach(x => x.classList.toggle('on', x === b)); drawP(b.dataset.t); }); drawP('');
  document.querySelectorAll('[data-tt]').forEach(b => b.onclick = () => renderFrench('write', 'tt:' + b.dataset.tt));
  document.querySelectorAll('[data-wi]').forEach(a => a.onclick = e => { e.preventDefault(); frShowFb(D, p.w[+a.dataset.wi]); });
  if ($('#wRes')) $('#wRes').onclick = () => renderFrench('write', 'draft');
  $('#wFree').onclick = () => { const t = prompt('Paste or type the task (in French):'); if (t && t.trim()) frStartDraft(D, {theme: '', type: '', text: t.trim()}); };
  $('#wExam').onclick = () => { const three = frShuffle(FRTH).slice(0, 3).map(th => frShuffle(PR.filter(x => x.theme === th))[0]).filter(Boolean);
    openModal(`<h3 style="margin:0 0 6px;font:600 20px var(--f-read)">Choose one task</h3><p class="meta">As in the exam: three tasks from different themes. The 75-minute timer starts when you choose.</p><div class="lst">${three.map((x, k) => `<div><div class="meta">${esc(x.theme)} · ${esc((TT.find(t => t.id === x.type) || {}).name || x.type)}</div><div lang="fr" style="margin:4px 0 8px">${esc(x.text)}</div><button class="pri" data-ch="${k}">Choose this task</button></div>`).join('')}</div><div class="row" style="margin-top:10px"><span class="sp"></span><button id="mClose">Cancel</button></div>`);
    document.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { $('#modal').remove(); frStartDraft(D, three[+b.dataset.ch], 75); }); };
}
function frTextType(D, t) {
  title([['French B', 'fr'], ['Paper 1', 'fr'], t.name]); $('#ttl').querySelectorAll('[data-go]')[1].onclick = () => renderFrench('write');
  const PR = (D.exam.prompts || []).filter(x => x.type === t.id);
  frBox().innerHTML = `<button class="ghost" id="tBack"><svg class="i"><use href="#i-l"/></svg>Paper 1</button><article class="card page frpage" style="margin-top:10px"><h1>${esc(t.name)}</h1><p class="meta" style="font-family:var(--f-ui)">${esc(t.category || '')}${t.register ? ' · register: ' + esc(t.register) : ''}</p>
    <h2>Conventions</h2>${mdx(t.conventions || '')}<h2>Template</h2><div lang="fr" class="frtpl">${mdx(t.template || '')}</div>
    ${(t.phrases || []).length ? `<h2>Useful phrases</h2><table><tbody>${t.phrases.map(x => `<tr><td lang="fr"><b>${esc(x.fr)}</b></td><td>${esc(x.en)}</td></tr>`).join('')}</tbody></table>` : ''}</article>
    ${PR.length ? `<h3>Practise this text type</h3><div class="card lst">${PR.map(x => `<div class="row frpr"><div style="flex:1;min-width:240px"><div class="meta">${esc(x.theme)}</div><div lang="fr">${esc(x.text)}</div></div><button data-pi="${D.exam.prompts.indexOf(x)}">Write</button></div>`).join('')}</div>` : ''}`;
  $('#tBack').onclick = () => renderFrench('write');
  document.querySelectorAll('[data-pi]').forEach(b => b.onclick = () => frStartDraft(D, D.exam.prompts[+b.dataset.pi]));
}
function frStartDraft(D, task, mins) {
  const old = LS.get('fr-draft', null); if (old && old.text && old.text.trim() && !confirm('Replace your draft in progress?')) return;
  LS.set('fr-draft', {task, text: '', start: Date.now(), mins: mins || 0}); renderFrench('write', 'draft');
}
function frDraft(D, dr) {
  if (!dr) return renderFrench('write');
  const TT = D.exam.textTypes || [], tt = TT.find(x => x.id === dr.task.type);
  title([['French B', 'fr'], ['Paper 1', 'fr'], 'Draft']); $('#ttl').querySelectorAll('[data-go]')[1].onclick = () => renderFrench('write');
  frBox().innerHTML = `<div class="row"><button class="ghost" id="dBack"><svg class="i"><use href="#i-l"/></svg>Paper 1</button><span class="sp"></span><span id="dTim" class="meta"></span></div>
    <div class="qctx" style="margin-top:10px"><div class="meta">${esc(dr.task.theme || 'Own task')}${tt ? ' · ' + esc(tt.name) : ''} · 250–400 words</div><div lang="fr">${esc(dr.task.text)}</div>${tt ? `<details style="margin-top:6px"><summary class="meta">Conventions for this text type</summary><div style="font-size:.95em">${mdx(tt.conventions || '')}</div></details>` : ''}</div>
    <textarea id="dT" lang="fr" spellcheck="false" rows="18" style="width:100%;font:17px/1.6 var(--f-read);padding:14px" placeholder="Écrivez ici…">${esc(dr.text)}</textarea>${frKeys('dT')}
    <div class="row" style="margin-top:8px;flex-wrap:wrap"><span id="dW" class="tag"></span><span class="meta">Spell-check is off, as in the exam.</span><span class="sp"></span><button id="dDel" class="ghost">Discard</button><button class="pri" id="dMark"><svg class="i"><use href="#i-spark"/></svg>Mark with Claude</button></div><div id="dFb"></div>`;
  frWireKeys(frBox());
  const ta = $('#dT'), wc = () => { const n = frWords(ta.value); $('#dW').textContent = n + ' words'; $('#dW').className = 'tag ' + (n >= 250 && n <= 400 ? 'g' : n > 400 ? 'w' : ''); };
  FR.ctx = {label: 'your French Paper 1 draft', screen: () => `French B SL Paper 1 task: ${dr.task.text}\n\nStudent's draft so far:\n${ta.value || '(empty)'}`};
  let svT = 0; ta.oninput = () => { wc(); clearTimeout(svT); svT = setTimeout(() => { dr.text = ta.value; LS.set('fr-draft', dr); }, 400); }; wc();
  if (dr.mins) { const end = dr.start + dr.mins * 60000, tick = () => { if (!$('#dTim')) return clearInterval(iv); const left = end - Date.now();
      $('#dTim').innerHTML = left > 0 ? `⏱ ${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')} left` : '<b style="color:var(--bad)">Time is up</b>'; }, iv = setInterval(tick, 1000); tick(); }
  $('#dBack').onclick = () => { dr.text = ta.value; LS.set('fr-draft', dr); renderFrench('write'); };
  $('#dDel').onclick = () => { if (!ta.value.trim() || confirm('Discard this draft?')) { LS.set('fr-draft', null); renderFrench('write'); } };
  $('#dMark').onclick = async () => {
    const text = ta.value.trim(), n = frWords(text); dr.text = ta.value; LS.set('fr-draft', dr);
    if (n < 60) return alert('Write a bit more first (aim for 250–400 words).');
    $('#dMark').disabled = true; $('#dFb').innerHTML = '<div class="card fb"><span class="spin"></span> Marking against criteria A, B and C…</div>';
    try {
      const raw = await frAsk(FR_P1_SYS, `Task (theme ${dr.task.theme || 'not given'}; text type: ${tt ? tt.name : 'as stated in the task'}):\n${dr.task.text}\n\nStudent response (${n} words):\n"""\n${text}\n"""`);
      const fb = pj(raw); if (!fb || fb.A == null) throw new Error('the marking came back in an unexpected format');
      const tot = (+fb.A.mark || 0) + (+fb.B.mark || 0) + (+fb.C.mark || 0);
      const rec = {t: Date.now(), type: dr.task.type || '', theme: dr.task.theme || '', task: dr.task.text, text: text.slice(0, 6000), words: n, total: tot, fb};
      const p = frP(); p.w.push(rec); if (p.w.length > 40) p.w.splice(0, p.w.length - 40); frSave(); act('q');
      LS.set('fr-draft', null); frShowFb(D, rec);
    } catch (e) { $('#dFb').innerHTML = `<div class="card fb">Could not mark: ${esc(e.message)}. Your draft is saved; try again.</div>`; $('#dMark').disabled = false; }
  };
}
function frShowFb(D, w) {
  const f = w.fb || {}, TT = D.exam.textTypes || [], tt = TT.find(x => x.id === w.type), L = (a) => (a || []).map(x => `<li>${esc(x)}</li>`).join('');
  FR.ctx = {label: 'your marked French Paper 1 piece', screen: `French Paper 1 task: ${w.task}\n\nStudent text:\n${w.text}\n\nMarks: A ${f.A && f.A.mark}/12, B ${f.B && f.B.mark}/12, C ${f.C && f.C.mark}/6.`};
  title([['French B', 'fr'], ['Paper 1', 'fr'], 'Feedback']); scrollTo(0, 0); $('#ttl').querySelectorAll('[data-go]')[1].onclick = () => renderFrench('write');
  const cr = (k, n, max) => `<div class="card frcrit"><div class="row"><b>${k}</b><span class="sp"></span><span class="frbig">${f[k] ? f[k].mark : '–'}<span class="meta">/${max}</span></span></div><div class="meta">${n}</div><p>${esc(f[k] ? f[k].why : '')}</p></div>`;
  frBox().innerHTML = `<div class="row"><button class="ghost" id="fBack"><svg class="i"><use href="#i-l"/></svg>Paper 1</button><span class="sp"></span><span class="meta">${new Date(w.t).toLocaleString()}</span></div>
    <div class="row" style="margin:12px 0;align-items:baseline;gap:12px"><h2 style="margin:0">${w.total}/30</h2>${f.grade ? `<span class="tag">≈ grade ${esc(f.grade)}</span>` : ''}<span class="meta">${w.words} words${tt ? ' · ' + esc(tt.name) : ''}</span></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${cr('A', 'Language', 12)}${cr('B', 'Message', 12)}${cr('C', 'Conceptual understanding', 6)}</div>
    <div class="card fb">${(f.strengths || []).length ? `<h4>What works</h4><ul>${L(f.strengths)}</ul>` : ''}
      ${(f.corrections || []).length ? `<h4>Corrections</h4><table class="frcor"><thead><tr><th>You wrote</th><th>Correct</th><th>Why</th></tr></thead><tbody>${f.corrections.map(c => `<tr><td lang="fr"><s>${esc(c.wrong)}</s></td><td lang="fr"><b>${esc(c.right)}</b></td><td class="meta">${esc(c.why)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${(f.upgrades || []).length ? `<h4>Lift Criterion A</h4><ul>${f.upgrades.map(u => `<li><span lang="fr">${esc(u.from)}</span> → <b lang="fr">${esc(u.to)}</b> <span class="meta">${esc(u.why)}</span></li>`).join('')}</ul>` : ''}
      ${(f.next || []).length ? `<h4>Next time</h4><ul>${L(f.next)}</ul>` : ''}
      ${f.model ? `<h4>A paragraph at grade-7 standard</h4><blockquote lang="fr" style="font-family:var(--f-read)">${esc(f.model)}</blockquote>` : ''}</div>
    <details class="card" style="margin-top:12px;padding:12px 16px"><summary>Task and your text</summary><p lang="fr" class="meta">${esc(w.task)}</p><div lang="fr" style="white-space:pre-wrap;font-family:var(--f-read)">${esc(w.text)}</div></details>
    <div class="row" style="margin-top:14px;flex-wrap:wrap"><button id="fChat"><svg class="i"><use href="#i-spark"/></svg>Discuss the feedback</button><button id="fCards">Corrections → flashcards</button><button id="fRe">Rewrite this task</button></div>`;
  $('#fBack').onclick = () => renderFrench('write');
  $('#fChat').onclick = () => openChat({title: 'French · Paper 1 feedback', book: S.book && S.book.id, pages: [], intro: `[My French B SL Paper 1 piece and its marking. Task: ${w.task}\n\nMy text:\n${w.text}\n\nMarks: A ${f.A && f.A.mark}/12, B ${f.B && f.B.mark}/12, C ${f.C && f.C.mark}/6. Help me understand and improve it.]\n\n`});
  $('#fCards').onclick = () => { const c = (f.corrections || []).map(x => ({f: 'Correct this: ' + x.wrong, b: x.right + '\n\n' + x.why})); if (!c.length) return; const d = addCards('French · My mistakes', '', c); $('#fCards').textContent = `Added to “${d.name}” ✓`; $('#fCards').disabled = true; };
  $('#fRe').onclick = () => { LS.set('fr-draft', {task: {theme: w.theme, type: w.type, text: w.task}, text: w.text, start: Date.now(), mins: 0}); renderFrench('write', 'draft'); };
}

// ---------- Paper 2 reading ----------
const FR_GEN_SYS = `You write ORIGINAL IB French B Standard Level Paper 2 reading practice (CEFR B1-B2). Never copy real exam papers or published texts. Return ONLY JSON:
{"title":"...","theme":"one of the five IB themes in French","type":"text type, e.g. article, blog, interview, brochure, lettre","text":"Markdown French text, 320-450 words, in paragraphs numbered with bold [1], [2] ... at the start of each","qs":[ ... 9 questions ... ]}
Each question is one of:
{"kind":"mcq","q":"...","opts":["A ...","B ...","C ...","D ..."],"a":"B"}
{"kind":"tf","q":"statement","a":true,"just":"exact justifying words from the text"}
{"kind":"word","q":"Trouvez dans le paragraphe [n] le mot qui signifie « ... »","a":["mot"]}
{"kind":"short","q":"...","a":["acceptable answer","variant"],"note":"what to accept"}
Mix the kinds (at least 2 tf, 2 word, 2 mcq, 2 short). Questions and options in French, in text order, answers unambiguous and checkable from the text.`;
function frRead(D, id) {
  const R = D.exam.reading || [], p = frP(), gen = LS.get('fr-genread', []) || [];
  const all = [...R, ...gen], r = id && all.find(x => x.id === id);
  if (r) return frReadText(D, r);
  frBox().innerHTML = `<h2 style="margin:0">Paper 2 · Reading</h2><p class="meta">SL reading: 1 hour, 40 marks, three texts across the themes. Listening is a separate 45-minute section (25 marks).</p>
    <div class="grid" style="margin-top:12px">${all.map(x => { const s = p.r[x.id]; return `<button class="card frt" data-r="${esc(x.id)}"><b lang="fr">${esc(x.title)}</b><span class="meta">${esc(x.theme || '')} · ${esc(x.type || '')}${x.gen ? ' · made by Claude' : ''}</span>${s ? `<span class="frst">Best ${s.s}/${s.m}</span>` : ''}</button>`; }).join('')}</div>
    <div class="card fb row" style="margin-top:14px;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>New practice text</b><div class="meta">Claude writes an original exam-style text with nine questions on the theme you choose.</div></div><select id="rTh" style="width:auto">${FRTH.map(t => `<option>${esc(t)}</option>`).join('')}</select><button class="pri" id="rGen"><svg class="i"><use href="#i-spark"/></svg>Write one</button></div>
    <div class="card fb" style="margin-top:14px"><b>Listening practice</b><p class="meta" style="margin:4px 0 0">Open any text and press <b>Listen first</b>: it is read aloud by a French voice with the text hidden, so you can answer as in the listening paper, then reveal it.</p></div>
    <div class="card page frpage" style="margin-top:22px">${mdx(D.exam.paper2 || '')}</div>`;
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => renderFrench('read', b.dataset.r));
  $('#rGen').onclick = async () => { const th = $('#rTh').value; $('#rGen').disabled = true; $('#rGen').innerHTML = '<span class="spin"></span> Writing…';
    try { const j = pj(await frAsk(FR_GEN_SYS, `Theme: ${th}. Choose a recommended topic within it that is different from: ${all.filter(x => x.theme === th).map(x => x.title).join('; ') || 'none'}.`));
      if (!j || !j.text || !(j.qs || []).length) throw new Error('unexpected format'); j.id = 'g' + uid(); j.gen = 1; j.theme = j.theme || th;
      const L = LS.get('fr-genread', []) || []; L.push(j); LS.set('fr-genread', L.slice(-12)); renderFrench('read', j.id); }
    catch (e) { alert('Could not write a text: ' + e.message); $('#rGen').disabled = false; $('#rGen').textContent = 'Write one'; } };
}
function frReadText(D, r) {
  const p = frP(); title([['French B', 'fr'], ['Paper 2', 'fr'], r.title.length > 38 ? r.title.slice(0, 36) + '…' : r.title]); scrollTo(0, 0); $('#ttl').querySelectorAll('[data-go]')[1].onclick = () => renderFrench('read');
  FR.ctx = {label: 'French reading text “' + r.title + '”', screen: `French reading text "${r.title}":\n${r.text}\n\nQuestions:\n${r.qs.map((q, k) => (k + 1) + '. ' + q.q).join('\n')}\n(Help them find answers in the text; do not just give answers before they try.)`};
  const qh = (q, k) => { const n = k + 1, inp = `<input id="ra${k}" lang="fr" autocapitalize="off" spellcheck="false" placeholder="answer">`;
    if (q.kind === 'mcq') return `<div class="frci"><div>${n}. ${esc(q.q)}</div>${q.opts.map(o => `<label class="ck" style="display:flex"><input type="radio" name="ra${k}" value="${esc(o.trim()[0])}">${esc(o)}</label>`).join('')}<div class="frcr" id="rr${k}"></div></div>`;
    if (q.kind === 'tf') return `<div class="frci"><div>${n}. ${esc(q.q)}</div><div class="row"><label class="ck"><input type="radio" name="ra${k}" value="1">Vrai</label><label class="ck"><input type="radio" name="ra${k}" value="0">Faux</label></div><input id="rj${k}" lang="fr" placeholder="Justification: the exact words from the text" style="margin-top:6px"><div class="frcr" id="rr${k}"></div></div>`;
    return `<div class="frci"><div>${n}. ${esc(q.q)}</div>${inp}<div class="frcr" id="rr${k}"></div></div>`; };
  frBox().innerHTML = `<div class="row"><button class="ghost" id="rBack"><svg class="i"><use href="#i-l"/></svg>Paper 2</button><span class="sp"></span><button id="rLis"><svg class="i"><use href="#i-speak"/></svg>Listen first</button>${r.gen ? '<button class="ghost" id="rDel">Delete</button>' : ''}</div>
    <div class="frread"><article class="card page frpage" id="rTxt" lang="fr"><div class="meta" style="font-family:var(--f-ui)">${esc(r.theme || '')} · ${esc(r.type || '')}</div><h1>${esc(r.title)}</h1>${mdx(r.text.replace(/^#[^\n]*\n+/, ''))}</article>
    <div class="card fb" id="rQs" style="margin-top:0">${r.qs.map(qh).join('')}${frKeys('')}<div class="row" style="margin-top:12px"><button class="pri" id="rChk">Check answers</button><span class="meta" id="rSc"></span></div></div></div>`;
  frWireKeys(frBox());
  $('#rBack').onclick = () => renderFrench('read');
  if ($('#rDel')) $('#rDel').onclick = () => { if (!confirm('Delete this practice text?')) return; LS.set('fr-genread', (LS.get('fr-genread', []) || []).filter(x => x.id !== r.id)); renderFrench('read'); };
  $('#rLis').onclick = () => { const t = $('#rTxt'), hid = t.classList.toggle('frhid'); $('#rLis').innerHTML = hid ? 'Stop and show the text' : '<svg class="i"><use href="#i-speak"/></svg>Listen first';
    if (hid) { const d = document.createElement('div'); d.innerHTML = mdx(r.text); frSay(d.innerText.replace(/\[\d+\]/g, '')); } else if (window.speechSynthesis) speechSynthesis.cancel(); };
  $('#rChk').onclick = () => { let s = 0; const m = r.qs.length;
    r.qs.forEach((q, k) => { let ok = false, ex = '';
      if (q.kind === 'mcq') { const v = (document.querySelector(`[name=ra${k}]:checked`) || {}).value; ok = v === q.a; ex = q.a; }
      else if (q.kind === 'tf') { const v = (document.querySelector(`[name=ra${k}]:checked`) || {}).value, j = frBare($('#rj' + k).value), jj = frBare(q.just || '');
        const right = v != null && (v === '1') === !!q.a, words = jj.split(/\W+/).filter(w => w.length > 3), hit = words.length ? words.filter(w => j.includes(w)).length / words.length : 1;
        ok = right && (!q.just || hit >= .5); ex = (q.a ? 'Vrai' : 'Faux') + (q.just ? ' — « ' + q.just + ' »' : ''); if (right && !ok) ex = 'Right choice, but the justification needs the words: « ' + q.just + ' »'; }
      else { const g = $('#ra' + k).value; const A = q.a || []; ok = frCheck(g, A) !== 'no' || (q.kind === 'short' && A.some(a => frBare(g).length > 2 && (frBare(a).includes(frBare(g)) || frBare(g).includes(frBare(a))))); ex = A[0] + (q.note ? ' · ' + q.note : ''); }
      if (ok) s++; $('#rr' + k).innerHTML = `<span class="frres ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span> <span class="meta">${esc(ex)}</span>`; });
    const o = p.r[r.id]; if (!o || s > o.s) p.r[r.id] = {s, m, t: Date.now()}; frSave(); act('q'); $('#rSc').textContent = `${s} / ${m}`; };
}

// ---------- individual oral ----------
const FR_ORAL_SYS = `You are an IB French B SL teacher running a mock individual oral. Speak French at B1-B2 level, one question at a time, and wait for the student's answer. Structure: (1) the student gives a 3-4 minute presentation on the visual stimulus (they will type or dictate it); (2) you ask 4-5 follow-up questions on the stimulus and its theme, linking to francophone cultures; (3) a general conversation on at least one other theme, about 5 questions. Keep your turns short (1-3 sentences). When the student writes "FIN" (or after the conversation), stop and give feedback in English: marks against criterion A Language /12, B1 Message visual stimulus /6, B2 Message conversation /6, C Interactive skills /6, with specific corrections of their French and three things to improve.`;
function frOral(D) {
  const E = D.exam, ST = E.stimuli || [], p = frP();
  const qs = D.vocab.filter(v => FRTH.includes(v.theme)).flatMap(v => v.topics.flatMap(t => (t.questions || []).map(q => ({q, tp: t.topic, th: v.theme}))));
  frBox().innerHTML = `<h2 style="margin:0">Individual oral</h2><p class="meta">15 min preparation with a visual stimulus · 3–4 min presentation · 4–5 min follow-up · 5–6 min general conversation · /30 · 25% of the grade.</p>
    <div class="grid" style="margin-top:12px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
      <div class="card fb" style="margin:0"><b>Mock oral</b><p class="meta">A random visual stimulus, a 15-minute preparation timer with a notes box (10 bullet points, as allowed), then a full mock with Claude as your teacher.</p><button class="pri" id="oMock">Start a mock oral</button></div>
      <div class="card fb" style="margin:0"><b>Quick-fire conversation</b><p class="meta">A random general-conversation question, read aloud. Answer out loud (or dictate), then get feedback on your French.</p><button id="oQ">Ask me a question</button></div></div>
    <h3>Stimuli to practise with</h3><div class="grid">${ST.map((s, k) => `<button class="card frt" data-st="${k}"><b lang="fr">« ${esc(s.caption)} »</b><span class="meta">${esc(s.theme)} · ${esc(s.scene.slice(0, 110))}${s.scene.length > 110 ? '…' : ''}</span></button>`).join('')}</div>
    ${p.o.length ? `<p class="meta" style="margin-top:12px">${p.o.length} practice session${p.o.length > 1 ? 's' : ''} so far.</p>` : ''}
    <div class="card page frpage" style="margin-top:22px">${mdx(E.oral || '')}</div>`;
  $('#oMock').onclick = () => frStim(ST[Math.floor(Math.random() * ST.length)]);
  document.querySelectorAll('[data-st]').forEach(b => b.onclick = () => frStim(ST[+b.dataset.st]));
  $('#oQ').onclick = () => { const x = qs[Math.floor(Math.random() * qs.length)]; if (x) frOralQ(x.q, x.tp); };
}
function frStim(s) {
  if (!s) return; const p = frP();
  title([['French B', 'fr'], ['Oral', 'fr'], 'Preparation']); $('#ttl').querySelectorAll('[data-go]')[1].onclick = () => renderFrench('oral');
  FR.ctx = {label: 'French oral preparation', screen: `Visual stimulus for an IB French B SL individual oral. Caption: « ${s.caption} ». Theme: ${s.theme}. Scene: ${s.scene}`};
  const start = Date.now();
  frBox().innerHTML = `<div class="row"><button class="ghost" id="sBack"><svg class="i"><use href="#i-l"/></svg>Oral</button><span class="sp"></span><span class="tag" id="sTim">15:00</span></div>
    <div class="card frstim"><div class="meta">${esc(s.theme)}</div><div class="frscene">${esc(s.scene)}</div><div class="frcap" lang="fr">« ${esc(s.caption)} »</div></div>
    <div class="card fb"><b>Your notes</b> <span class="meta">(up to 10 bullet points: the exam allows a short note sheet)</span><textarea id="sN" rows="9" lang="fr" style="width:100%;margin-top:8px" placeholder="- Au premier plan, on voit…&#10;- Le lien avec le thème…&#10;- Dans le monde francophone…">${esc(LS.get('fr-onotes', ''))}</textarea>${frKeys('sN')}
      <details style="margin-top:8px"><summary class="meta">Possible follow-up questions</summary><ul lang="fr">${(s.prompts || []).map(q => `<li>${esc(q)} ${frSayB(q)}</li>`).join('')}</ul></details>
      <div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="pri" id="sGo"><svg class="i"><use href="#i-spark"/></svg>Start the mock with Claude</button><button id="sSelf">Record myself instead</button></div></div>`;
  frWireKeys(frBox()); frWireSay(frBox());
  $('#sN').oninput = e => { const L = e.target.value.split('\n').filter(x => x.trim()); LS.set('fr-onotes', e.target.value); e.target.style.borderColor = L.length > 10 ? 'var(--bad)' : ''; };
  const iv = setInterval(() => { const el = $('#sTim'); if (!el) return clearInterval(iv); const left = 15 * 60000 - (Date.now() - start); el.textContent = left > 0 ? `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}` : 'Time: present!'; el.className = 'tag ' + (left > 0 ? '' : 'w'); }, 1000);
  $('#sBack').onclick = () => renderFrench('oral');
  $('#sGo').onclick = () => { p.o.push({t: Date.now(), cap: s.caption}); frSave(); act('q');
    openChat({title: 'Mock oral · ' + s.caption, book: S.book && S.book.id, pages: [], intro: `[${FR_ORAL_SYS}\n\nThe visual stimulus: caption « ${s.caption} », theme ${s.theme}. Scene: ${s.scene}\nMy preparation notes:\n${$('#sN').value || '(none)'}\n\nI will now give my presentation. Reply only in French until I write FIN.]\n\n`});
    $('#ci').placeholder = 'Type or dictate your presentation in French…'; };
  $('#sSelf').onclick = () => frRecorder(s);
}
// record on the device (nothing is uploaded) so the student can listen back to their own presentation
async function frRecorder(s) {
  if (!navigator.mediaDevices || !window.MediaRecorder) return alert('This browser cannot record audio.');
  let st; try { st = await navigator.mediaDevices.getUserMedia({audio: true}); } catch (e) { return alert('Microphone access was refused.'); }
  const rec = new MediaRecorder(st), ch = []; rec.ondataavailable = e => ch.push(e.data);
  const m = openModal(`<h3 style="margin:0 0 8px;font:600 20px var(--f-read)">Recording…</h3><p class="meta">Present for 3–4 minutes. The recording stays on this device.</p><div class="frbig" id="rcT">0:00</div><div class="row" style="margin-top:12px"><span class="sp"></span><button class="pri" id="rcStop">Stop</button></div>`);
  const t0 = Date.now(), iv = setInterval(() => { const el = $('#rcT'); if (!el) return; const s = Math.floor((Date.now() - t0) / 1000); el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); el.style.color = s > 240 ? 'var(--bad)' : s >= 180 ? 'var(--good)' : ''; }, 500);
  rec.onstop = () => { clearInterval(iv); st.getTracks().forEach(t => t.stop()); const url = URL.createObjectURL(new Blob(ch, {type: rec.mimeType}));
    m.querySelector('.mbox').innerHTML = `<h3 style="margin:0 0 8px;font:600 20px var(--f-read)">Listen back</h3><audio controls src="${url}" style="width:100%"></audio><p class="meta">Check: did you describe, link to the theme, mention the francophone world, give an opinion? Did you vary tenses?</p><div class="row"><a href="${url}" download="oral-practice.webm" class="meta">Save the recording</a><span class="sp"></span><button id="mClose">Close</button></div>`; $('#mClose').onclick = () => m.remove(); };
  rec.start(); $('#rcStop').onclick = () => rec.stop();
  m.onclick = e => { if (e.target === m && rec.state === 'recording') rec.stop(); };
}
const FR_OQ_SYS = `You are an IB French B SL teacher giving feedback on a student's spoken answer (transcribed) to a general-conversation question. Feedback in English, short and specific. Return ONLY JSON: {"mark":"rough level for criterion A /12","good":["..."],"fix":[{"wrong":"exact words","right":"corrected","why":"rule"}],"better":"a model answer in French of 4-6 sentences at grade-7 level using their ideas","follow":"one natural follow-up question in French"}`;
function frOralQ(q, tp) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const m = openModal(`<div class="meta">${esc(tp || 'General conversation')}</div><h3 lang="fr" style="margin:6px 0 10px;font:600 20px var(--f-read)">${esc(q)} ${frSayB(q)}</h3>
    <textarea id="oA" rows="6" lang="fr" style="width:100%" placeholder="Answer out loud first, then type (or dictate) what you said…"></textarea>${frKeys('oA')}
    <div class="row" style="margin-top:8px;flex-wrap:wrap">${SR ? '<button id="oMic"><svg class="i"><use href="#i-speak"/></svg>Dictate</button>' : ''}<span class="sp"></span><button id="mClose" class="ghost">Close</button><button class="pri" id="oFb"><svg class="i"><use href="#i-spark"/></svg>Feedback</button></div><div id="oR"></div>`);
  frWireKeys(m); frWireSay(m); setTimeout(() => frSay(q), 200);
  if (SR) { let r = null; $('#oMic').onclick = () => { if (r) { r.stop(); return; } r = new SR(); r.lang = 'fr-FR'; r.continuous = true; r.interimResults = false; const base = $('#oA').value;
    r.onresult = e => { $('#oA').value = (base ? base + ' ' : '') + [...e.results].map(x => x[0].transcript).join(' '); }; r.onend = () => { r = null; if ($('#oMic')) $('#oMic').classList.remove('on'); };
    r.start(); $('#oMic').classList.add('on'); }; }
  $('#oFb').onclick = async () => { const a = $('#oA').value.trim(); if (frWords(a) < 5) return alert('Answer in a few sentences first.');
    $('#oFb').disabled = true; $('#oR').innerHTML = '<p><span class="spin"></span> Listening…</p>';
    try { const j = pj(await frAsk(FR_OQ_SYS, `Question: ${q}\n\nStudent answer:\n"""${a}"""`));
      $('#oR').innerHTML = `<div class="fb" style="padding:12px 0 0">${j.mark ? `<span class="tag">Language ≈ ${esc(j.mark)}</span>` : ''}${(j.good || []).length ? `<h4>Good</h4><ul>${j.good.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${(j.fix || []).length ? `<h4>Fix</h4><ul>${j.fix.map(x => `<li><s lang="fr">${esc(x.wrong)}</s> → <b lang="fr">${esc(x.right)}</b> <span class="meta">${esc(x.why)}</span></li>`).join('')}</ul>` : ''}
        ${j.better ? `<h4>Model answer</h4><blockquote lang="fr">${esc(j.better)} ${frSayB(j.better)}</blockquote>` : ''}${j.follow ? `<div class="row"><span lang="fr"><b>Follow-up:</b> ${esc(j.follow)}</span><span class="sp"></span><button id="oNext">Answer it</button></div>` : ''}</div>`;
      frWireSay($('#oR')); if ($('#oNext')) $('#oNext').onclick = () => frOralQ(j.follow, tp); }
    catch (e) { $('#oR').innerHTML = `<p class="meta">Could not get feedback: ${esc(e.message)}</p>`; $('#oFb').disabled = false; } };
}

// ---------- exam guide ----------
function frGuide(D) {
  const E = D.exam;
  frBox().innerHTML = `<article class="card page frpage">${mdx(E.overview || '')}</article>
    <h3 style="margin-top:22px">Paper 1 · writing</h3><article class="card page frpage">${mdx(E.paper1Tips || '')}</article>
    <h3 style="margin-top:22px">Paper 2 · reading and listening</h3><article class="card page frpage">${mdx(E.paper2 || '')}</article>
    <h3 style="margin-top:22px">Individual oral</h3><article class="card page frpage">${mdx(E.oral || '')}</article>`;
}

// search box: French grammar topics and vocabulary
function frSuggest(v, out) { if (!FR.data) return; const has = t => frBare(t).includes(frBare(v));
  for (const t of FR.data.grammar) if (out.length < 30 && has(t.title)) out.push({k: 'French', s: 'Grammar · ' + t.title, f: () => renderFrench('gram', t.id)});
  for (const T of FR.data.vocab) for (const tp of T.topics) { if (out.length < 34 && has(tp.topic + ' ' + tp.en)) out.push({k: 'French', s: 'Vocabulary · ' + tp.topic, f: () => renderFrench('vocab', T.theme + '|' + tp.topic)});
    for (const w of tp.words) if (out.length < 36 && v.length > 2 && frBare(w.fr).startsWith(frBare(v))) out.push({k: 'Mot', s: w.fr + ' — ' + w.en, f: () => renderFrench('vocab', T.theme + '|' + tp.topic)}); }
  for (const vb of FRV.list()) if (out.length < 38 && v.length > 2 && frBare(vb) === frBare(v)) out.push({k: 'Verbe', s: vb + ' — tables', f: () => renderFrench('verbs', vb)});
}
frLoad();
