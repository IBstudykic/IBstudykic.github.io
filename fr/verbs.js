// French verb engine for the French B section: builds every tense from a few principal parts, so tables and drills share one source.
// Works in the browser (window.FRV) and in node (module.exports) for testing.
(function (root) {
'use strict';
const P = ['je', 'tu', 'il/elle/on', 'nous', 'vous', 'ils/elles'];
const vow = s => /^[aeéèêiîoôuûhœ]/i.test(s);
// irregular verbs: present (6 forms), past participle, future stem, optional subjunctive / imperative / imparfait stem overrides
const IRR = {
  'être': {en: 'to be', pres: 'suis es est sommes êtes sont', pp: 'été', fut: 'ser', impf: 'ét', subj: 'sois sois soit soyons soyez soient', imp: 'sois soyons soyez'},
  'avoir': {en: 'to have', pres: 'ai as a avons avez ont', pp: 'eu', fut: 'aur', subj: 'aie aies ait ayons ayez aient', imp: 'aie ayons ayez'},
  'aller': {en: 'to go', pres: 'vais vas va allons allez vont', pp: 'allé', aux: 'être', fut: 'ir', subj: 'aille ailles aille allions alliez aillent', imp: 'va allons allez'},
  'faire': {en: 'to do, make', pres: 'fais fais fait faisons faites font', pp: 'fait', fut: 'fer', subj: 'fasse fasses fasse fassions fassiez fassent'},
  'pouvoir': {en: 'to be able to, can', pres: 'peux peux peut pouvons pouvez peuvent', pp: 'pu', fut: 'pourr', subj: 'puisse puisses puisse puissions puissiez puissent', imp: '-'},
  'vouloir': {en: 'to want', pres: 'veux veux veut voulons voulez veulent', pp: 'voulu', fut: 'voudr', subj: 'veuille veuilles veuille voulions vouliez veuillent', imp: 'veuille veuillons veuillez'},
  'devoir': {en: 'to have to, must; to owe', pres: 'dois dois doit devons devez doivent', pp: 'dû', fut: 'devr', imp: '-'},
  'savoir': {en: 'to know (a fact, how to)', pres: 'sais sais sait savons savez savent', pp: 'su', fut: 'saur', subj: 'sache saches sache sachions sachiez sachent', imp: 'sache sachons sachez'},
  'falloir': {en: 'to be necessary (il faut)', pres: '- - faut - - -', pp: 'fallu', fut: 'faudr', impf: 'fall', subj: '- - faille - - -', imp: '-', only3: 1},
  'pleuvoir': {en: 'to rain', pres: '- - pleut - - -', pp: 'plu', fut: 'pleuvr', impf: 'pleuv', subj: '- - pleuve - - -', imp: '-', only3: 1},
  'venir': {en: 'to come', pres: 'viens viens vient venons venez viennent', pp: 'venu', aux: 'être', fut: 'viendr'},
  'devenir': {en: 'to become', like: 'venir', aux: 'être'},
  'revenir': {en: 'to come back', like: 'venir', aux: 'être'},
  'se souvenir': {en: 'to remember', like: 'venir'},
  'tenir': {en: 'to hold', pres: 'tiens tiens tient tenons tenez tiennent', pp: 'tenu', fut: 'tiendr'},
  'obtenir': {en: 'to obtain', like: 'tenir'},
  'appartenir': {en: 'to belong', like: 'tenir'},
  'prendre': {en: 'to take', pres: 'prends prends prend prenons prenez prennent', pp: 'pris', fut: 'prendr'},
  'apprendre': {en: 'to learn', like: 'prendre'},
  'comprendre': {en: 'to understand', like: 'prendre'},
  'mettre': {en: 'to put, put on', pres: 'mets mets met mettons mettez mettent', pp: 'mis', fut: 'mettr'},
  'permettre': {en: 'to allow', like: 'mettre'},
  'promettre': {en: 'to promise', like: 'mettre'},
  'dire': {en: 'to say, tell', pres: 'dis dis dit disons dites disent', pp: 'dit', fut: 'dir'},
  'lire': {en: 'to read', pres: 'lis lis lit lisons lisez lisent', pp: 'lu', fut: 'lir'},
  'écrire': {en: 'to write', pres: 'écris écris écrit écrivons écrivez écrivent', pp: 'écrit', fut: 'écrir'},
  'décrire': {en: 'to describe', like: 'écrire'},
  'voir': {en: 'to see', pres: 'vois vois voit voyons voyez voient', pp: 'vu', fut: 'verr'},
  'croire': {en: 'to believe', pres: 'crois crois croit croyons croyez croient', pp: 'cru', fut: 'croir'},
  'boire': {en: 'to drink', pres: 'bois bois boit buvons buvez boivent', pp: 'bu', fut: 'boir'},
  'vivre': {en: 'to live', pres: 'vis vis vit vivons vivez vivent', pp: 'vécu', fut: 'vivr'},
  'suivre': {en: 'to follow', pres: 'suis suis suit suivons suivez suivent', pp: 'suivi', fut: 'suivr'},
  'connaître': {en: 'to know (a person, place)', pres: 'connais connais connaît connaissons connaissez connaissent', pp: 'connu', fut: 'connaîtr'},
  'reconnaître': {en: 'to recognise', like: 'connaître'},
  'paraître': {en: 'to seem, appear', pres: 'parais parais paraît paraissons paraissez paraissent', pp: 'paru', fut: 'paraîtr'},
  'partir': {en: 'to leave', pres: 'pars pars part partons partez partent', pp: 'parti', aux: 'être', fut: 'partir'},
  'sortir': {en: 'to go out', pres: 'sors sors sort sortons sortez sortent', pp: 'sorti', aux: 'être', fut: 'sortir'},
  'dormir': {en: 'to sleep', pres: 'dors dors dort dormons dormez dorment', pp: 'dormi', fut: 'dormir'},
  'sentir': {en: 'to feel, smell', pres: 'sens sens sent sentons sentez sentent', pp: 'senti', fut: 'sentir'},
  'servir': {en: 'to serve', pres: 'sers sers sert servons servez servent', pp: 'servi', fut: 'servir'},
  'ouvrir': {en: 'to open', pres: 'ouvre ouvres ouvre ouvrons ouvrez ouvrent', pp: 'ouvert', fut: 'ouvrir', er: 1},
  'offrir': {en: 'to offer', pres: 'offre offres offre offrons offrez offrent', pp: 'offert', fut: 'offrir', er: 1},
  'découvrir': {en: 'to discover', pres: 'découvre découvres découvre découvrons découvrez découvrent', pp: 'découvert', fut: 'découvrir', er: 1},
  'souffrir': {en: 'to suffer', pres: 'souffre souffres souffre souffrons souffrez souffrent', pp: 'souffert', fut: 'souffrir', er: 1},
  'recevoir': {en: 'to receive', pres: 'reçois reçois reçoit recevons recevez reçoivent', pp: 'reçu', fut: 'recevr'},
  'courir': {en: 'to run', pres: 'cours cours court courons courez courent', pp: 'couru', fut: 'courr'},
  'mourir': {en: 'to die', pres: 'meurs meurs meurt mourons mourez meurent', pp: 'mort', aux: 'être', fut: 'mourr'},
  'naître': {en: 'to be born', pres: 'nais nais naît naissons naissez naissent', pp: 'né', aux: 'être', fut: 'naîtr'},
  'conduire': {en: 'to drive', pres: 'conduis conduis conduit conduisons conduisez conduisent', pp: 'conduit', fut: 'conduir'},
  'construire': {en: 'to build', pres: 'construis construis construit construisons construisez construisent', pp: 'construit', fut: 'construir'},
  'produire': {en: 'to produce', pres: 'produis produis produit produisons produisez produisent', pp: 'produit', fut: 'produir'},
  'détruire': {en: 'to destroy', pres: 'détruis détruis détruit détruisons détruisez détruisent', pp: 'détruit', fut: 'détruir'},
  'plaire': {en: 'to please', pres: 'plais plais plaît plaisons plaisez plaisent', pp: 'plu', fut: 'plair'},
  'rire': {en: 'to laugh', pres: 'ris ris rit rions riez rient', pp: 'ri', fut: 'rir'},
  'craindre': {en: 'to fear', pres: 'crains crains craint craignons craignez craignent', pp: 'craint', fut: 'craindr'},
  'éteindre': {en: 'to switch off', pres: 'éteins éteins éteint éteignons éteignez éteignent', pp: 'éteint', fut: 'éteindr'},
  'atteindre': {en: 'to reach, achieve', pres: 'atteins atteins atteint atteignons atteignez atteignent', pp: 'atteint', fut: 'atteindr'},
  'envoyer': {en: 'to send', pres: 'envoie envoies envoie envoyons envoyez envoient', pp: 'envoyé', fut: 'enverr', er: 1},
  's\'asseoir': {en: 'to sit down', pres: 'assieds assieds assied asseyons asseyez asseyent', pp: 'assis', fut: 'assiér', er: 0},
};
// regular verbs: [infinitive, English, class] (class marks spelling changes: g = -ger, c = -cer, E = e→è, É = é→è, L = consonant doubling, Y = y→i)
const REG = [
  ['parler', 'to speak'], ['aimer', 'to like, love'], ['travailler', 'to work'], ['habiter', 'to live (in)'], ['regarder', 'to watch'], ['écouter', 'to listen'], ['jouer', 'to play'],
  ['penser', 'to think'], ['trouver', 'to find'], ['donner', 'to give'], ['arriver', 'to arrive'], ['rester', 'to stay'], ['tomber', 'to fall'], ['entrer', 'to enter'], ['rentrer', 'to go home'], ['monter', 'to go up'],
  ['retourner', 'to return'], ['utiliser', 'to use'], ['protéger', 'to protect', 'gÉ'], ['étudier', 'to study'], ['oublier', 'to forget'], ['créer', 'to create'], ['partager', 'to share', 'g'],
  ['manger', 'to eat', 'g'], ['voyager', 'to travel', 'g'], ['nager', 'to swim', 'g'], ['changer', 'to change', 'g'], ['commencer', 'to begin', 'c'], ['lancer', 'to launch, throw', 'c'], ['avancer', 'to move forward', 'c'],
  ['acheter', 'to buy', 'E'], ['lever', 'to raise', 'E'], ['mener', 'to lead', 'E'], ['amener', 'to bring (someone)', 'E'], ['préférer', 'to prefer', 'É'], ['espérer', 'to hope', 'É'], ['répéter', 'to repeat', 'É'], ['considérer', 'to consider', 'É'],
  ['appeler', 'to call', 'L'], ['jeter', 'to throw (away)', 'L'], ['rappeler', 'to remind, call back', 'L'], ['payer', 'to pay', 'Y'], ['essayer', 'to try', 'Y'], ['nettoyer', 'to clean', 'Y'], ['employer', 'to use, employ', 'Y'], ['ennuyer', 'to bore', 'Y'],
  ['finir', 'to finish'], ['choisir', 'to choose'], ['réussir', 'to succeed, pass'], ['grandir', 'to grow up'], ['réfléchir', 'to think, reflect'], ['agir', 'to act'], ['remplir', 'to fill'], ['investir', 'to invest'],
  ['vendre', 'to sell'], ['attendre', 'to wait (for)'], ['répondre', 'to answer'], ['perdre', 'to lose'], ['entendre', 'to hear'], ['descendre', 'to go down'], ['rendre', 'to give back; to make (+adj)'], ['défendre', 'to defend'],
  ['se lever', 'to get up', 'E'], ['se coucher', 'to go to bed'], ['s\'amuser', 'to have fun'], ['se réveiller', 'to wake up'], ['s\'habiller', 'to get dressed'], ['se reposer', 'to rest'], ['s\'inquiéter', 'to worry', 'É'],
  ['se sentir', 'to feel', '@sentir'], ['se promener', 'to go for a walk', 'E'], ['s\'intéresser', 'to be interested'], ['s\'engager', 'to commit, get involved', 'g'], ['s\'occuper', 'to look after, deal with'],
];
const ETRE = new Set('aller venir devenir revenir arriver partir rester tomber entrer rentrer monter descendre retourner sortir naître mourir'.split(' '));
const ER = new Set(); // -ir verbs conjugated like -er in the present (ouvrir…)
const V = {}; // infinitive -> spec
const split = s => s.split(' ');
for (const [inf, o] of Object.entries(IRR)) { const b = o.like ? IRR[o.like] : o; const pre = o.like && !inf.startsWith('se ') ? inf.slice(0, inf.length - o.like.length) : '';
  V[inf] = {inf, en: o.en, irr: 1, pres: o.pres ? split(o.pres) : split(b.pres).map(x => pre + x), pp: o.pp || pre + b.pp, fut: o.fut || pre + b.fut, aux: o.aux || 'avoir',
    subj: o.subj ? split(o.subj) : (o.like && b.subj ? split(b.subj).map(x => pre + x) : null), imp: o.imp ? (o.imp === '-' ? null : split(o.imp)) : undefined, impf: o.impf, only3: o.only3, er: b.er}; }
// se souvenir: base is venir with no prefix change
V['se souvenir'] = {...V['venir'], inf: 'se souvenir', en: 'to remember', pres: split(IRR.venir.pres).map(x => x.replace(/^v/, 'souv')), pp: 'souvenu', fut: 'souviendr', aux: 'être', refl: 1, subj: null};
V["s'asseoir"].refl = 1; V["s'asseoir"].aux = 'être';
function regSpec([inf0, en, cls = '']) {
  const refl = /^(se |s')/.test(inf0), inf = inf0.replace(/^(se |s')/, '');
  if (cls.startsWith('@')) { const b = V[cls.slice(1)]; return {...b, inf: inf0, en, refl: 1, aux: 'être', base: inf}; }
  const end = inf.slice(-2), st = inf.slice(0, -2); let pres, pp, fut;
  if (end === 'er') {
    const strong = (i) => i === 0 || i === 1 || i === 2 || i === 5; // stressed stem: je tu il ils
    const mk = i => { let s = st; const e = ['e', 'es', 'e', 'ons', 'ez', 'ent'][i];
      if (strong(i)) { if (cls.includes('E')) s = s.replace(/e([^e]+)$/, 'è$1'); if (cls.includes('É')) s = s.replace(/é([^é]+)$/, 'è$1'); if (cls.includes('L')) s = s + s.slice(-1); if (cls.includes('Y')) s = s.replace(/y$/, 'i'); }
      if (i === 3 && cls.includes('g')) s += 'e'; if (i === 3 && cls.includes('c')) s = s.replace(/c$/, 'ç');
      return s + e; };
    pres = [0, 1, 2, 3, 4, 5].map(mk); pp = st + 'é';
    fut = cls.includes('E') ? st.replace(/e([^e]+)$/, 'è$1') + 'er' : cls.includes('L') ? st + st.slice(-1) + 'er' : cls.includes('Y') && !/ayer$/.test(inf) ? st.replace(/y$/, 'i') + 'er' : inf;
  } else if (end === 'ir') { pres = ['is', 'is', 'it', 'issons', 'issez', 'issent'].map(e => st + e); pp = st + 'i'; fut = inf; }
  else { pres = ['s', 's', '', 'ons', 'ez', 'ent'].map(e => st + e); pp = st + 'u'; fut = inf.slice(0, -1); }
  return {inf: inf0, base: inf, en, pres, pp, fut, cls, aux: refl || ETRE.has(inf) ? 'être' : 'avoir', refl, er: end === 'er'};
}
for (const r of REG) V[r[0]] = regSpec(r);
for (const k of Object.keys(V)) { const v = V[k]; v.base = v.base || k.replace(/^(se |s')/, ''); if (/^(se |s')/.test(k)) { v.refl = 1; v.aux = 'être'; } if (!v.irr && !v.refl && ETRE.has(v.base)) v.aux = 'être'; }

const RP = ['me', 'te', 'se', 'nous', 'vous', 'se'];
// subject (+ reflexive pronoun) in front of a form, with elision
function front(i, form, refl) {
  let s = ['je', 'tu', 'il', 'nous', 'vous', 'ils'][i];
  if (refl) { const r = RP[i]; const rp = i < 3 || i === 5 ? (vow(form) ? r[0] + "'" : r + ' ') : r + ' '; return (i === 0 ? 'je ' : s + ' ') + rp + form; }
  return i === 0 && vow(form) ? "j'" + form : s + ' ' + form;
}
const AUXF = {
  pres: {avoir: split('ai as a avons avez ont'), 'être': split('suis es est sommes êtes sont')},
  impf: {avoir: split('avais avais avait avions aviez avaient'), 'être': split('étais étais était étions étiez étaient')},
  cond: {avoir: split('aurais aurais aurait aurions auriez auraient'), 'être': split('serais serais serait serions seriez seraient')},
  fut: {avoir: split('aurai auras aura aurons aurez auront'), 'être': split('serai seras sera serons serez seront')},
};
// optional feminine/plural endings in brackets (il/elle/on, ils/elles)
const agree = (pp, i) => { const s = /s$/.test(pp); return i === 4 ? pp + '(e)(s)' : i >= 3 ? pp + (s ? '(es)' : '(e)s') : pp + '(e)'; };
function stemImpf(v) { if (v.impf) return v.impf; const n = v.pres[3]; return n.replace(/ons$/, ''); }
function fixStem(stem, e) { if (/^i/.test(e)) { if (/ge$/.test(stem)) return stem.slice(0, -1); if (/ç$/.test(stem)) return stem.slice(0, -1) + 'c'; } return stem; }
function forms(v, t) { // bare forms (no subject), 6 entries; null = does not exist
  const imE = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
  if (t === 'pres') return v.pres.map(x => x === '-' ? null : x);
  if (t === 'impf') { const st = stemImpf(v); return imE.map((e, i) => v.only3 && i !== 2 ? null : fixStem(st, e) + e); }
  if (t === 'fut') return ['ai', 'as', 'a', 'ons', 'ez', 'ont'].map((e, i) => v.only3 && i !== 2 ? null : v.fut + e);
  if (t === 'cond') return imE.map((e, i) => v.only3 && i !== 2 ? null : v.fut + e);
  if (t === 'subj') { if (v.subj) return v.subj.map(x => x === '-' ? null : x); const s1 = v.pres[5].replace(/ent$/, ''), s2 = v.pres[3].replace(/ons$/, '');
    return ['e', 'es', 'e', 'ions', 'iez', 'ent'].map((e, i) => (i === 3 || i === 4 ? fixStem(s2, e) : s1) + e); }
  const aux = {pc: 'pres', pqp: 'impf', cp: 'cond', fa: 'fut'}[t];
  if (aux) { const A = AUXF[aux][v.aux]; return A.map((a, i) => v.only3 && i !== 2 ? null : a + ' ' + (v.aux === 'être' ? agree(v.pp, i) : v.pp)); }
  return null;
}
// full "subject + verb" strings for one tense; imperative has 3 forms
function conj(inf, t) {
  const v = V[inf]; if (!v) return null;
  if (t === 'imp') { if (v.imp === null || v.only3) return null;
    let f = v.imp || [v.pres[1], v.pres[3], v.pres[4]]; if (!v.imp && v.er) f = [f[0].replace(/s$/, ''), f[1], f[2]];
    if (v.refl) f = [f[0] + '-toi', f[1] + '-nous', f[2] + '-vous'];
    return f.map((x, i) => ({p: ['(tu)', '(nous)', '(vous)'][i], f: x, full: x})); }
  const F = forms(v, t), R = v.refl;
  const dub = t === 'subj' ? 'que ' : '';
  return F.map((f, i) => {
    if (!f) return null;
    let full = front(i, f, R); if (dub) full = (/^(il|ils)/.test(full) ? "qu'" : /^j'/.test(full) ? 'que ' : 'que ') + full;
    return {p: P[i], f, full};
  });
}
const T = [['pres', 'Présent'], ['pc', 'Passé composé'], ['impf', 'Imparfait'], ['pqp', 'Plus-que-parfait'], ['fut', 'Futur simple'], ['cond', 'Conditionnel présent'], ['cp', 'Conditionnel passé'], ['fa', 'Futur antérieur'], ['subj', 'Subjonctif présent'], ['imp', 'Impératif']];
// alternative spellings also accepted (1990 reform / common variants)
function variants(inf, t, s) { const out = [s];
  if (V[inf] && /ayer$/.test(V[inf].base)) out.push(s.replace(/ai(?=e(?!z))/g, 'ay'), s.replace(/ay(?=e(?!z))/g, 'ai'));
  if (V[inf] && V[inf].cls && V[inf].cls.includes('É') && (t === 'fut' || t === 'cond')) out.push(s.replace(/é(\w+)er(ai|as|a|ons|ez|ont|ais|ait|ions|iez|aient)\b/, 'è$1er$2'));
  if (V[inf] && /aître$/.test(V[inf].base)) out.push(s.replace(/î(t)/g, 'i$1'));
  return [...new Set(out)]; }
const api = {P, T, V, conj, forms, variants, list: () => Object.keys(V).sort((a, b) => a.replace(/^(se |s')/, '').localeCompare(b.replace(/^(se |s')/, ''), 'fr'))};
if (typeof module !== 'undefined') module.exports = api; else root.FRV = api;
})(typeof window !== 'undefined' ? window : globalThis);
