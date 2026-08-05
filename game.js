"use strict";
/* =========================================================
   ドリームステージ ☆ アイドル計算オーディション
   育成シミュレーション本体
   ========================================================= */
const $ = id => document.getElementById(id);
const ri = MATH.ri, pick = MATH.pick;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ================= マスタデータ ================= */
const STATS = [
  { k: "vo", n: "ボーカル", c: "#ff5f9e" },
  { k: "da", n: "ダンス",   c: "#7c6cff" },
  { k: "vi", n: "ビジュアル", c: "#ff9f43" },
  { k: "tk", n: "トーク",   c: "#2fb79c" },
  { k: "me", n: "メンタル", c: "#4aa8ff" },
];
const RANKS = [[93,"S","#ff3d8b"],[85,"A","#ff7b3d"],[75,"B","#f2b705"],[62,"C","#3fbf7f"],[48,"D","#3f9fdf"],[32,"E","#7b7bd6"],[16,"F","#a08fb0"],[0,"G","#b0a5b8"]];
const rank = v => RANKS.find(r => v >= r[0]);

const AVATARS = [
  { id: "mc_a", n: "ゆめ系", img: "img/mc_a.jpg" },
  { id: "mc_b", n: "しずか系", img: "img/mc_b.jpg" },
  { id: "mc_c", n: "ふわり系", img: "img/mc_c.jpg" },
  { id: "mc_d", n: "げんき系", img: "img/mc_d.jpg" },
];
const COLORS = ["#ff5f9e", "#b98cff", "#4aa8ff", "#2fb79c", "#ff9f43"];
const TYPES = [
  { id: "vo", e: "🎤", n: "うたウマ型", d: "ボーカルがぐんぐん伸びる", boost: { vo: 1.35, da: .9 } },
  { id: "da", e: "💃", n: "おどりウマ型", d: "ダンスがぐんぐん伸びる", boost: { da: 1.35, vo: .9 } },
  { id: "vi", e: "✨", n: "かわいい型", d: "ビジュアルとトークが伸びる", boost: { vi: 1.3, tk: 1.15, me: .9 } },
  { id: "ba", e: "⚖️", n: "バランス型", d: "ぜんぶ平均的に伸びる。体力おおめ", boost: {}, stam: 15 },
];

const CHARS = {
  hinano:  { n: "ひなの", img: "img/hinano.jpg", role: "同期・ムードメーカー", c: "#ff8a3d" },
  sakura:  { n: "咲良",   img: "img/sakura.jpg", role: "同期・優等生",       c: "#b98cff" },
  luna:    { n: "ルナ",   img: "img/luna.jpg",   role: "同期・クール",       c: "#4aa8ff" },
  rena:    { n: "玲奈",   img: "img/rena.jpg",   role: "最強のライバル",     c: "#e8b93d" },
  misaki:  { n: "美咲",   img: "img/manager.jpg", role: "マネージャー",      c: "#2fb79c" },
};
const CHAR_IDS = ["hinano", "sakura", "luna", "rena", "misaki"];

const CMDS = [
  { id: "vo", g: "yomi",    e: "🎤", n: "ボーカル",   s: "漢字の読み",  main: "vo", sub: "me", st: 22 },
  { id: "da", g: "kanyoku", e: "💃", n: "ダンス",     s: "慣用句",      main: "da", sub: "vi", st: 24 },
  { id: "vi", g: "kotowaza", e: "💄", n: "ビジュアル", s: "ことわざ",   main: "vi", sub: "tk", st: 18 },
  { id: "tk", g: "keigo", e: "🎙", n: "トーク",     s: "敬語",        main: "tk", sub: "me", st: 20 },
  { id: "sk", g: "goi",   e: "📚", n: "自主トレ",   s: "対義語・類義語", main: "me", sub: "*", st: 26 },
  { id: "bn", g: "yoji",  e: "📖", n: "台本読解",   s: "四字熟語", main: "tk", sub: "me", st: 22 },
];

const AUDS = [
  { w: 8,  n: "新人発掘オーディション", sub: "まずは名前を覚えてもらう", theme: ["da", "vo"],           q: 10, lv: 2, need: 50, rival: 52, fans: 400 },
  { w: 16, n: "センター候補 選考会",   sub: "前に立つのは、だれ？",     theme: ["vo", "tk"],           q: 12, lv: 3, need: 60, rival: 63, fans: 1200 },
  { w: 24, n: "全国ステージ 予選",     sub: "ここを抜ければ全国",       theme: ["vi", "da", "me"],     q: 12, lv: 4, need: 68, rival: 73, fans: 2600 },
  { w: 32, n: "デビュー審査ライブ",     sub: "すべてが決まる、最後の夜", theme: ["vo", "da", "vi", "tk", "me"], q: 14, lv: 5, need: 76, rival: 84, fans: 6000 },
];
const TOTAL_W = 32;
const PHASE = w => w <= 8 ? "春・きそ体力づくり" : w <= 16 ? "初夏・レッスン強化" : w <= 24 ? "秋・実力しょうぶ" : "冬・デビューへの道";

const CONDS = [
  { n: "絶不調", c: "#8a8a9a", m: .70 },
  { n: "不調",   c: "#7ba6c9", m: .85 },
  { n: "ふつう", c: "#69bf8f", m: 1.00 },
  { n: "好調",   c: "#ff9f43", m: 1.15 },
  { n: "絶好調", c: "#ff3d8b", m: 1.35 },
];

const OUTFITS = [
  { id: "o1", n: "ふわふわパーカー", e: "🧥", cost: 300,  vi: 3 },
  { id: "o2", n: "リボンのワンピース", e: "🎀", cost: 900,  vi: 6 },
  { id: "o3", n: "きらめきドレス",   e: "👗", cost: 2000, vi: 10 },
  { id: "o4", n: "スターステージ衣装", e: "⭐️", cost: 3800, vi: 14 },
  { id: "o5", n: "天使のつばさ",     e: "🪽", cost: 6000, vi: 18 },
  { id: "o6", n: "クイーンの王冠",   e: "👑", cost: 9000, vi: 24 },
];
const ITEMS = [
  { id: "drink", n: "エナジードリンク", e: "🥤", cost: 250, d: "体力が 45 かいふく" },
  { id: "omamori", n: "がんばりお守り", e: "🧿", cost: 700, d: "次のレッスンの上がり 1.6倍" },
  { id: "note", n: "計算ノート",       e: "📓", cost: 1200, d: "レッスンの制限時間 +30%（ずっと）" },
];

const SKILLS = [
  { id: "pi3",   n: "漢字の申し子",   e: "📖", d: "ボーカルレッスンの上がり +30%", chk: G => G.pf.yomi >= 3,   fx: { g: { yomi: .3 } } },
  { id: "pi8",   n: "読みのクイーン", e: "👑", d: "オーディションの点数 +6",       chk: G => G.pf.yomi >= 8,   fx: { aud: 6 } },
  { id: "fr3",   n: "慣用句コレクター", e: "🗣", d: "ダンスレッスンの上がり +30%", chk: G => G.pf.kanyoku >= 3, fx: { g: { kanyoku: .3 } } },
  { id: "fr8",   n: "言い回しの魔術師", e: "🪄", d: "オーディションの点数 +6",       chk: G => G.pf.kanyoku >= 8, fx: { aud: 6 } },
  { id: "ra3",   n: "ことわざセンサー", e: "🏮", d: "ビジュアルレッスンの上がり +30%", chk: G => G.pf.kotowaza >= 3, fx: { g: { kotowaza: .3 } } },
  { id: "ra8",   n: "ことわざの女王", e: "💯", d: "もらえるファンが +25%",       chk: G => G.pf.kotowaza >= 8, fx: { fan: .25 } },
  { id: "gy3",   n: "敬語マスター",   e: "🎩", d: "トークレッスンの上がり +30%",   chk: G => G.pf.keigo >= 3, fx: { g: { keigo: .3 } } },
  { id: "gy8",   n: "ことばづかいの品格", e: "🔍", d: "オーディションの点数 +6",       chk: G => G.pf.keigo >= 8, fx: { aud: 6 } },
  { id: "ku3",   n: "語彙の天才",     e: "💡", d: "自主トレの上がり +30%",         chk: G => G.pf.goi >= 3, fx: { g: { goi: .3 } } },
  { id: "queen", n: "ことばの女王",   e: "♛",  d: "ぜんぶのレッスン +20%／審査 +10", chk: G => ["yomi","kanyoku","kotowaza","yoji","goi","keigo"].every(k => G.pf[k] >= 5), fx: { all: .2, aud: 10 } },
  { id: "combo", n: "コンボクイーン", e: "🔥", d: "コンボが切れにくくなる（1回まもる）", chk: G => G.bestCombo >= 15, fx: { shield: 1 } },
  { id: "nomiss",n: "ノーミスの誇り", e: "🛡", d: "レッスンの体力しょうひ −5",     chk: G => G.perfectLesson >= 1, fx: { st: -5 } },
  { id: "iron",  n: "鉄のメンタル",   e: "⛰", d: "本番でも実力を出しきれる",       chk: G => G.st.me >= 70, fx: { iron: 1 } },
  { id: "smile", n: "アイドルの笑顔", e: "😊", d: "もらえるファンが +30%",         chk: G => CHAR_IDS.reduce((s, c) => s + G.aff[c], 0) >= 200, fx: { fan: .3 } },
];

/* ================= キャラ会話（交流） ================= */
const TALKS = {
  hinano: [
    { t: "「ねーねー{name}ちゃん！ 今日のレッスンさ、ぜんぜん歌えなくて…でもさ、へこんでてもしょうがないよね！」", c: [
      { t: "「うん、明日いっしょに練習しよ！」", a: 14 },
      { t: "「どこがむずかしかった？聞かせて」", a: 11 },
      { t: "「ひなのなら大丈夫だよ」", a: 8 } ] },
    { t: "「あたし、じつは計算がいちばん苦手なんだ…3.14って見るだけで頭がぐるぐるする」", c: [
      { t: "「3.14の段、いっしょに覚えよう」", a: 15 },
      { t: "「わたしも最初はそうだったよ」", a: 10 },
      { t: "「なれれば平気だよ」", a: 6 } ] },
  ],
  sakura: [
    { t: "「{name}さん。わたし、練習ノートを作っているんです。よかったら…見ますか？」", c: [
      { t: "「見たい！すごくきれい…」", a: 14 },
      { t: "「ありがとう、参考にするね」", a: 10 },
      { t: "「咲良ってまじめだよね」", a: 5 } ] },
    { t: "「完ぺきにやらないと、意味がない気がして。…変ですか？」", c: [
      { t: "「完ぺきじゃなくても前に進めるよ」", a: 15 },
      { t: "「その真剣さ、かっこいいと思う」", a: 12 },
      { t: "「変じゃないよ」", a: 7 } ] },
  ],
  luna: [
    { t: "「……ん。（イヤホンを片方さしだす）……この曲、いいから」", c: [
      { t: "（だまって受けとって、いっしょに聞く）", a: 15 },
      { t: "「なんて曲？」", a: 10 },
      { t: "「いま練習中だから、あとでね」", a: 3 } ] },
    { t: "「わたしは、うまくしゃべれない。でも、ステージの上でならぜんぶ言える」", c: [
      { t: "「じゃあ、ステージで見せて」", a: 15 },
      { t: "「わかる気がする」", a: 11 },
      { t: "「しゃべる練習もしようよ」", a: 5 } ] },
  ],
  rena: [
    { t: "「あなた、最近のびてるわね。……べつに、ほめてないけど」", c: [
      { t: "「玲奈のおかげだよ、ありがとう」", a: 14 },
      { t: "「次は勝つから」", a: 12 },
      { t: "「そっちこそ、油断しないでね」", a: 9 } ] },
    { t: "「わたしね、負けたことがないの。……だから、負けるのがこわい」", c: [
      { t: "「こわいのは、本気の証だよ」", a: 16 },
      { t: "「わたしも、こわいよ」", a: 13 },
      { t: "「玲奈は負けないよ」", a: 6 } ] },
  ],
  misaki: [
    { t: "「{name}ちゃん、体調はどう？ むりしてない？ ……その顔、むりしてるでしょ」", c: [
      { t: "「ちょっとだけ、つかれてます」", a: 14 },
      { t: "「大丈夫です！やれます！」", a: 8 },
      { t: "「見ぬかれてました？」", a: 12 } ] },
    { t: "「わたしね、むかしはステージに立つ側だったの。……とちゅうでやめちゃったけど」", c: [
      { t: "「その分まで、わたしが立ちます」", a: 16 },
      { t: "「なんでやめたんですか？」", a: 10 },
      { t: "「そうだったんですね」", a: 7 } ] },
  ],
};

/* 好感度しきい値イベント */
const BONDS = {
  hinano: [
    { at: 30, t: "「{name}ちゃんとレッスンしてると、なんか調子出るんだよね！ ねっ、コンビ組も！」", fx: { st: { da: 4 }, msg: "ひなのとコンビ結成！ ダンス +4" } },
    { at: 60, t: "「あたしね、{name}ちゃんが計算しながら歌ってるの見て、まねしてみたんだ。そしたら…できた！」", fx: { st: { vo: 5, da: 3 }, stam: 20, msg: "ひなのの本気が伝わった！" } },
    { at: 90, t: "「デビューしても、ずっと同期だからね。…ぜったい、いっしょのステージ立とうね」", fx: { st: { vo: 6, da: 6, me: 6 }, msg: "ひなのとの絆・最大！" } },
  ],
  sakura: [
    { at: 30, t: "「{name}さん。このノート、コピーしました。…わたしの計算のコツ、ぜんぶ書いてあります」", fx: { st: { me: 4 }, msg: "咲良のノートを受け取った！ メンタル +4" } },
    { at: 60, t: "「{name}さんと勉強すると、わたし、まちがえるのがこわくなくなるんです」", fx: { st: { me: 5, tk: 4 }, msg: "咲良が変わりはじめた" } },
    { at: 90, t: "「完ぺきじゃなくていいって、{name}さんが教えてくれた。だから…わたし、歌います」", fx: { st: { me: 8, vo: 5, tk: 5 }, msg: "咲良との絆・最大！" } },
  ],
  luna: [
    { at: 30, t: "「……はい。（プレイリストを共有された）……練習用。使って」", fx: { st: { vo: 4 }, msg: "ルナのプレイリスト！ ボーカル +4" } },
    { at: 60, t: "「あなたの声、好き。……いま、聞かなかったことにして」", fx: { st: { vo: 5, vi: 4 }, msg: "ルナが心を開いた" } },
    { at: 90, t: "「わたしのとなりに立って。……ふたりなら、もっと遠くまで行ける」", fx: { st: { vo: 7, vi: 6, me: 5 }, msg: "ルナとの絆・最大！" } },
  ],
  rena: [
    { at: 30, t: "「練習に付きあってあげる。…感謝しなさいよ、わたしのレッスンは高いんだから」", fx: { st: { vi: 4 }, msg: "玲奈の特訓！ ビジュアル +4" } },
    { at: 60, t: "「あなたがいるから、わたしは手をぬけない。……それって、けっこう幸せなことね」", fx: { st: { vi: 5, me: 5 }, msg: "ライバルから、好敵手へ" } },
    { at: 90, t: "「勝ちなさい。わたしに勝てないなら、あなたの夢もそこまでよ。……待ってるから」", fx: { st: { vo: 6, da: 6, vi: 6 }, msg: "玲奈との絆・最大！" } },
  ],
  misaki: [
    { at: 30, t: "「はい、これ。{name}ちゃん用のスケジュール。…むりのない範囲で、本気でいこう」", fx: { stam: 40, msg: "美咲さんの調整！ 体力かいふく" } },
    { at: 60, t: "「あなたを見てると、あのころの自分を思い出す。…でも、あなたのほうがずっと強い」", fx: { st: { me: 6 }, fans: 500, msg: "美咲さんが本気で売り込んでくれた" } },
    { at: 90, t: "「わたしは、あなたをデビューさせるためにこの仕事をしてる。ぜったい、連れていく」", fx: { st: { me: 8, tk: 6 }, fans: 1500, msg: "美咲さんとの絆・最大！" } },
  ],
};

/* ランダムイベント */
const EVENTS = [
  { id: "e1", c: "hinano", t: "「{name}ちゃん、ろうかで転んだ！ …あ、だいじょうぶ、ジャージ破れただけ！」", ch: [
    { t: "ぬってあげる", fx: { aff: { hinano: 10 }, stam: -5 } },
    { t: "笑ってしまう", fx: { aff: { hinano: 4 }, cond: 1 } } ] },
  { id: "e2", c: "misaki", t: "「臨時のテレビ出演の話が来てる。…出る？ 体力は使うけど、ファンは増えるよ」", ch: [
    { t: "出ます！", fx: { stam: -25, fans: 600, aff: { misaki: 6 } } },
    { t: "レッスンを優先します", fx: { st: { me: 3 }, aff: { misaki: 3 } } } ] },
  { id: "e3", c: "rena", t: "「あなたのレッスン、見せてもらったわ。…そのフォーム、10年前のやり方よ」", ch: [
    { t: "教えてもらう", fx: { st: { da: 5 }, aff: { rena: 8 } } },
    { t: "自分のやり方をつらぬく", fx: { st: { me: 5 }, aff: { rena: 2 } } } ] },
  { id: "e4", c: "sakura", t: "「{name}さん、この問題…どうしても解けなくて。いっしょに考えてくれませんか」", ch: [
    { t: "いっしょに解く", fx: { st: { me: 4 }, aff: { sakura: 10 }, stam: -8 } },
    { t: "答えだけ教える", fx: { aff: { sakura: -2 }, st: { me: 1 } } } ] },
  { id: "e5", c: "luna", t: "「……屋上。夜景がきれい。……計算、しない？」", ch: [
    { t: "する", fx: { st: { vo: 3, me: 3 }, aff: { luna: 10 } } },
    { t: "今日は休む", fx: { stam: 20, aff: { luna: 2 } } } ] },
  { id: "e6", c: "misaki", t: "「差し入れのケーキ、食べる？ ……レッスン前だけど、まあ、たまにはね」", ch: [
    { t: "いただきます！", fx: { stam: 25, cond: 1, aff: { misaki: 5 } } },
    { t: "がまんします", fx: { st: { me: 4 }, aff: { misaki: 3 } } } ] },
  { id: "e7", c: "hinano", t: "「ねー、SNSにレッスン動画あげてみない？ ぜったいバズるって！」", ch: [
    { t: "あげてみる", fx: { fans: 450, aff: { hinano: 7 } } },
    { t: "完成してからにする", fx: { st: { vi: 3 }, aff: { hinano: 3 } } } ] },
  { id: "e8", c: "rena", t: "「ふうん、まだその程度なのね。……わたし、来週のオーディションで本気出すから」", ch: [
    { t: "「望むところ」", fx: { st: { me: 5 }, cond: 1, aff: { rena: 6 } } },
    { t: "だまって練習に行く", fx: { st: { da: 3, vo: 3 } } } ] },
  { id: "e9", c: "sakura", t: "「…あの、{name}さん。前から言いたかったんですけど、あなたの計算、すごく速いです」", ch: [
    { t: "「毎日やってるからね」", fx: { aff: { sakura: 8 }, st: { me: 3 } } },
    { t: "「咲良のほうがすごいよ」", fx: { aff: { sakura: 11 } } } ] },
  { id: "e10", c: "misaki", t: "「ちょっと熱っぽくない？ 今日は…休みなさい。マネージャー命令」", ch: [
    { t: "休む", fx: { stam: 45, cond: 1, aff: { misaki: 6 } } },
    { t: "こっそり練習する", fx: { stam: -15, cond: -1, st: { vo: 3, da: 3 } } } ] },
  { id: "e11", c: "luna", t: "「……あなた、なんで歌うの？」", ch: [
    { t: "「見つけてほしいから」", fx: { st: { vo: 4, me: 3 }, aff: { luna: 9 } } },
    { t: "「楽しいから」", fx: { st: { vi: 4 }, cond: 1, aff: { luna: 6 } } } ] },
  { id: "e12", c: "hinano", t: "「ぜんいんで自主練しよっ！ 徹夜で！」", ch: [
    { t: "やる", fx: { stam: -30, st: { vo: 4, da: 4, tk: 4 }, aff: { hinano: 6, sakura: 4, luna: 4 } } },
    { t: "「明日にしよう」", fx: { stam: 10, aff: { hinano: 2 }, st: { me: 3 } } } ] },
];

/* ================= セーブ ================= */
const KEY = "kotobaStage_v1";
const DEF_META = { dp: 0, plays: 0, hall: [], skills: [], best: {}, outfits: [], up: { st: 0, stam: 0, eff: 0, fan: 0, aff: 0 }, mute: false, evseen: [] };
let DB = { meta: { ...DEF_META }, run: null };
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
  DB.meta = Object.assign({}, DEF_META, raw.meta || {});
  DB.meta.up = Object.assign({}, DEF_META.up, DB.meta.up || {});
  DB.run = raw.run || null;
} catch (e) { }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
let G = null;

/* ================= 音 ================= */
let AC = null;
function beep(f, dur, type = "sine", vol = .13, when = 0) {
  if (DB.meta.mute) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, AC.currentTime + when);
    g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + when + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(AC.currentTime + when); o.stop(AC.currentTime + when + dur + .05);
  } catch (e) { }
}
const sfx = {
  tap: () => beep(700, .05, "square", .04),
  good: () => { beep(784, .09); beep(1046, .12, "sine", .13, .07); },
  great: () => { beep(784, .07); beep(1046, .07, "sine", .13, .06); beep(1318, .16, "sine", .15, .12); },
  bad: () => beep(150, .28, "sawtooth", .1),
  clear: () => [523, 659, 784, 1046].forEach((f, i) => beep(f, .22, "sine", .14, i * .12)),
  skill: () => [659, 880, 1046, 1318, 1760].forEach((f, i) => beep(f, .18, "triangle", .14, i * .09)),
  shop: () => { beep(880, .08, "triangle"); beep(1174, .12, "triangle", .13, .07); },
};

/* ================= 小道具 ================= */
function toast(msg) {
  const t = document.createElement("div"); t.className = "tst"; t.innerHTML = msg;
  $("toast").appendChild(t);
  setTimeout(() => { t.style.transition = "opacity .4s"; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 2000);
}
function confetti(n = 34) {
  const ems = ["🎉", "✨", "⭐️", "🌸", "💗", "💛", "🎀"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div"); c.className = "conf";
    c.textContent = pick(ems);
    c.style.left = Math.random() * 100 + "vw";
    c.style.animationDuration = (1.7 + Math.random() * 1.8) + "s";
    c.style.animationDelay = (Math.random() * .5) + "s";
    document.body.appendChild(c); setTimeout(() => c.remove(), 4300);
  }
}
function show(id) {
  document.querySelectorAll(".scr").forEach(s => s.classList.remove("on"));
  $(id).classList.add("on");
}
function openSheet(html) { $("sheetPanel").innerHTML = html; $("ovSheet").classList.add("on"); }
function closeSheet() { $("ovSheet").classList.remove("on"); }
const esc = s => String(s).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
const nm = () => G ? G.name : "きみ";
const rep = t => t.replace(/\{name\}/g, esc(nm()));
const charImg = (id, size) => `<img src="${CHARS[id].img}" alt="${CHARS[id].n}" style="width:${size}px;height:${size}px;border-radius:${Math.round(size * .3)}px;object-fit:cover;display:block">`;

/* 背景キラキラ */
(function bgInit() {
  const b = $("bg"), ems = ["✨", "⭐️", "🌸", "💗", "🎵"];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("i");
    s.textContent = pick(ems);
    s.style.left = Math.random() * 100 + "vw";
    s.style.fontSize = (11 + Math.random() * 15) + "px";
    s.style.animationDuration = (9 + Math.random() * 12) + "s";
    s.style.animationDelay = (-Math.random() * 15) + "s";
    b.appendChild(s);
  }
})();

/* ================= タイトル ================= */
function renderTitle() {
  $("tDp").textContent = DB.meta.dp;
  $("tPlays").textContent = DB.meta.plays;
  $("btnCont").disabled = !DB.run;
  $("muteBtn").textContent = DB.meta.mute ? "🔇" : "🔊";
  show("scrTitle");
}
$("muteBtn").onclick = () => { DB.meta.mute = !DB.meta.mute; save(); $("muteBtn").textContent = DB.meta.mute ? "🔇" : "🔊"; };
$("btnNew").onclick = () => { sfx.tap(); if (DB.run && !confirm("いまのアイドルのデータは消えます。よろしいですか？")) return; renderCreate(); };
$("btnCont").onclick = () => { sfx.tap(); G = DB.run; renderMain(); };
$("btnDrill").onclick = () => { sfx.tap(); openDrill(); };
$("btnDream").onclick = () => { sfx.tap(); openDream(); };
$("btnZukanT").onclick = () => { sfx.tap(); openZukan(); };
$("btnHelp").onclick = () => { sfx.tap(); openHelp(); };

function openHelp() {
  openSheet(`<div class="ptitle">❓ あそびかた<small>32週で、デビューをつかめ</small></div>
  <div class="list">
    <div class="item"><span class="ie">📅</span><div class="it"><b>1週に1回、コマンドを選ぶ</b>
      <small>レッスン・休養・交流から1つ。32週たつとデビュー審査。</small></div></div>
    <div class="item"><span class="ie">🧮</span><div class="it"><b>レッスン＝ことばクイズ</b>
      <small>8問の4択に答える。<u>速く正確に</u>答えるほどステータスが大きく上がる。</small></div></div>
    <div class="item"><span class="ie">🔥</span><div class="it"><b>コンボをつなぐ</b>
      <small>連続正解でコンボ。3コンボ以上で点数にボーナス。まちがえると0にもどる。</small></div></div>
    <div class="item"><span class="ie">💪</span><div class="it"><b>体力と調子の管理</b>
      <small>体力が足りないとレッスンが失敗しやすい。休養でかいふく。調子がいい週にレッスンすると伸びる。</small></div></div>
    <div class="item"><span class="ie">💗</span><div class="it"><b>仲間との好感度</b>
      <small>交流で好感度アップ。30・60・90で特別なイベントとボーナス。エンディングも変わる。</small></div></div>
    <div class="item"><span class="ie">🎬</span><div class="it"><b>8・16・24・32週はオーディション</b>
      <small>ステータス評価60％＋ことばパフォーマンス40％で採点。合格には3段階：✨期待枠 → 合格 → 🏆トップ合格。まずは期待枠をねらおう。</small></div></div>
    <div class="item"><span class="ie">✨</span><div class="it"><b>とくしゅのうりょく</b>
      <small>PERFECTを重ねるとスキルを習得。レッスンの伸びや審査の点数が上がる。全14種。</small></div></div>
    <div class="item"><span class="ie">💎</span><div class="it"><b>引きつぎ（2周目以降）</b>
      <small>デビューするとドリームポイントがもらえる。ショップで次の子の初期値を強化できる。</small></div></div>
    <div class="item"><span class="ie">🔥</span><div class="it"><b>とっくんモード</b>
      <small>ストーリーとは別に、20問タイムアタック。ジャンル×レベル別のベストタイムに挑戦。</small></div></div>
  </div>
  <div class="smallnote">答え方：4つの選択肢から正しいものをタップ。<br>パソコンなら 1〜4 のキーでも答えられる。</div>
  <div style="height:12px"></div><button class="btn ghost" onclick="closeSheet()">とじる</button>`);
}

/* ================= キャラメイク ================= */
let CR = { av: 0, col: 0, type: 3 };
function renderCreate() {
  $("avPick").innerHTML = AVATARS.map((a, i) =>
    `<button class="pk ${i === CR.av ? "on" : ""}" data-i="${i}" style="padding:0;overflow:hidden">
      <img src="${a.img}" style="width:100%;height:100%;object-fit:cover" alt="${a.n}"></button>`).join("");
  $("colPick").innerHTML = COLORS.map((c, i) =>
    `<button class="pkc ${i === CR.col ? "on" : ""}" data-i="${i}" style="background:${c}"></button>`).join("");
  $("typePick").innerHTML = TYPES.map((t, i) =>
    `<button class="tp ${i === CR.type ? "on" : ""}" data-i="${i}">
      <span class="tpe">${t.e}</span><span><b>${t.n}</b><small>${t.d}</small></span></button>`).join("");
  $("avPick").querySelectorAll(".pk").forEach(b => b.onclick = () => { CR.av = +b.dataset.i; sfx.tap(); renderCreate(); });
  $("colPick").querySelectorAll(".pkc").forEach(b => b.onclick = () => { CR.col = +b.dataset.i; sfx.tap(); renderCreate(); });
  $("typePick").querySelectorAll(".tp").forEach(b => b.onclick = () => { CR.type = +b.dataset.i; sfx.tap(); renderCreate(); });
  show("scrCreate");
}
$("btnBackTitle").onclick = () => { sfx.tap(); renderTitle(); };
$("btnStart").onclick = () => {
  const name = ($("nameIn").value || "ゆめ").trim().slice(0, 6);
  const up = DB.meta.up, t = TYPES[CR.type];
  const base = 5 + up.st * 5;
  G = {
    name, av: CR.av, col: CR.col, type: CR.type,
    week: 1, stam: 100 + (t.stam || 0) + up.stam * 10, maxStam: 100 + (t.stam || 0) + up.stam * 10,
    cond: 2, fans: up.fan * 500,
    st: { vo: base, da: base, vi: base, tk: base, me: base },
    aff: { hinano: up.aff * 10, sakura: up.aff * 10, luna: up.aff * 10, rena: up.aff * 10, misaki: up.aff * 10 },
    pf: { yomi: 0, kanyoku: 0, kotowaza: 0, yoji: 0, goi: 0, keigo: 0 },
    skills: [], bonds: [], bestCombo: 0, perfectLesson: 0,
    outfit: null, ownOutfits: [], items: { omamori: 0, note: 0 },
    auds: [], totalQ: 0, totalOK: 0, done: false,
  };
  DB.run = G; save(); sfx.clear();
  renderMain();
  setTimeout(() => showEvent({
    c: "misaki",
    t: `「はじめまして、${esc(name)}ちゃん。マネージャーの美咲です。\n……ここは、計算ができない子はステージに立てない、ちょっと変わった事務所。\n32週後のデビュー審査まで、いっしょに走るよ。よろしくね」`,
    ch: [{ t: "「よろしくお願いします！」", fx: { aff: { misaki: 5 } } }]
  }), 400);
};

/* ================= メイン画面 ================= */
function nextAud() { return AUDS.find(a => a.w >= G.week); }
function statMult(key) {
  const t = TYPES[G.type];
  return (t.boost && t.boost[key]) || 1;
}
function skillFx() {
  const f = { g: {}, all: 0, aud: 0, fan: 0, st: 0, shield: 0, iron: 0 };
  if (!G || !G.skills) return f;
  G.skills.forEach(id => {
    const s = SKILLS.find(x => x.id === id); if (!s) return;
    if (s.fx.g) for (const k in s.fx.g) f.g[k] = (f.g[k] || 0) + s.fx.g[k];
    ["all", "aud", "fan", "st", "shield", "iron"].forEach(k => { if (s.fx[k]) f[k] += s.fx[k]; });
  });
  return f;
}
function renderMain() {
  if (!G) return renderTitle();
  const a = nextAud();
  $("mWeek").textContent = G.week;
  $("mPhase").textContent = PHASE(G.week);
  $("mNext").innerHTML = a ? (a.w === G.week ? `🎬 本日 ${a.n}！` : `次のオーディションまで あと ${a.w - G.week} 週`) : "デビュー審査";
  $("mName").textContent = G.name;
  const avg = STATS.reduce((s, x) => s + G.st[x.k], 0) / 5;
  $("mTitleTag").textContent = avg >= 85 ? "スーパースター" : avg >= 70 ? "センター候補" : avg >= 55 ? "注目の新人" : avg >= 35 ? "レッスン生" : "研究生";
  const av = AVATARS[G.av];
  $("mAvBox").style.background = COLORS[G.col] + "22";
  $("mAv").outerHTML = `<img id="mAv" src="${av.img}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:18px">`;
  $("mOutfit").textContent = G.outfit ? OUTFITS.find(o => o.id === G.outfit).e : "";
  $("mStam").style.width = clamp(G.stam / G.maxStam * 100, 0, 100) + "%";
  $("mStam").style.background = G.stam < 25 ? "linear-gradient(90deg,#ffb0b0,#ff6a6a)" : G.stam < 55 ? "linear-gradient(90deg,#ffd98a,#ff9f43)" : "linear-gradient(90deg,#7ee8c6,#2fb79c)";
  $("mStamN").textContent = Math.round(G.stam);
  const cd = CONDS[G.cond];
  $("mCond").textContent = "調子 " + cd.n; $("mCond").style.background = cd.c;
  $("mFans").textContent = G.fans.toLocaleString();

  $("mStats").innerHTML = STATS.map(s => {
    const v = Math.round(G.st[s.k]), rk = rank(v);
    return `<div class="strow"><span class="sn">${s.n}</span>
      <span class="rk" style="background:${rk[2]}">${rk[1]}</span>
      <div class="gauge"><u style="width:${v}%;background:linear-gradient(90deg,${s.c}88,${s.c})"></u></div>
      <span class="sv" id="sv_${s.k}">${v}</span></div>`;
  }).join("");

  const isAud = a && a.w === G.week;
  if (isAud) {
    $("mCmds").innerHTML = `<button class="cmd aud wide" data-c="aud">
      <span class="ce">🎬</span><span><b>${a.n}</b><small>${a.sub}　／　ライバル: 玲奈</small></span></button>`;
  } else {
    const fx = skillFx();
    $("mCmds").innerHTML = CMDS.map(c => {
      const cost = Math.max(6, c.st + fx.st);
      const low = G.stam < cost;
      return `<button class="cmd" data-c="${c.id}">
        <span class="ce">${c.e}</span><span><b>${c.n}レッスン</b><small>${c.s}</small>
        <span class="cost" style="${low ? "color:#ff3d3d" : ""}">体力 −${cost}</span></span></button>`;
    }).join("") +
      `<button class="cmd rest" data-c="rest"><span class="ce">😴</span><span><b>休養</b><small>体力を大きく回復</small></span></button>
       <button class="cmd talk" data-c="talk"><span class="ce">🍰</span><span><b>交流</b><small>仲間と話す・好感度アップ</small></span></button>`;
  }
  $("mCmds").querySelectorAll(".cmd").forEach(b => b.onclick = () => doCmd(b.dataset.c));

  $("mChars").innerHTML = CHAR_IDS.map(id => {
    const c = CHARS[id], v = clamp(G.aff[id], 0, 100);
    return `<div class="chip" data-c="${id}">${charImg(id, 44)}
      <div class="cn">${c.n}</div><div class="hb"><u style="width:${v}%"></u></div></div>`;
  }).join("");
  $("mChars").querySelectorAll(".chip").forEach(b => b.onclick = () => charInfo(b.dataset.c));

  show("scrMain");
  save();
}
$("mFoot").querySelectorAll(".fb").forEach(b => b.onclick = () => {
  sfx.tap();
  const a = b.dataset.a;
  if (a === "shop") openShop();
  else if (a === "zukan") openZukan();
  else if (a === "skill") openSkills();
  else { save(); renderTitle(); }
});

function charInfo(id) {
  const c = CHARS[id], v = Math.round(G.aff[id]);
  const nb = (BONDS[id] || []).find(b => v < b.at);
  openSheet(`<div class="ptitle">${c.n}<small>${c.role}</small></div>
    <div style="display:flex;gap:12px;align-items:center">${charImg(id, 96)}
    <div style="flex:1">
      <div style="font-size:12px;margin-bottom:4px">好感度 <b style="font-size:20px;color:${c.c}">${v}</b></div>
      <div class="gauge"><u style="width:${clamp(v, 0, 100)}%;background:${c.c}"></u></div>
      <div style="font-size:11px;color:var(--ink2);margin-top:6px">${nb ? `つぎの特別イベントまで あと ${nb.at - v}` : "すべての特別イベントを見た！"}</div>
    </div></div>
    <div style="height:12px"></div><button class="btn ghost" onclick="closeSheet()">とじる</button>`);
}

/* ================= コマンド ================= */
function doCmd(c) {
  sfx.tap();
  if (c === "aud") return startAudition();
  if (c === "rest") return doRest();
  if (c === "talk") return openTalkSelect();
  const cmd = CMDS.find(x => x.id === c);
  const fx = skillFx();
  const cost = Math.max(6, cmd.st + fx.st);
  if (G.stam < cost) {
    if (!confirm("体力がたりない！ むりをすると失敗しやすくなるよ。それでもレッスンする？")) return;
    G.over = true;
  } else G.over = false;
  G.stam = Math.max(0, G.stam - cost);
  const lv = lessonLv();
  startQuiz({
    mode: "lesson", genre: cmd.g, lv, total: 8,
    title: `${cmd.e} ${cmd.n}レッスン`,
    onEnd: r => finishLesson(cmd, r),
  });
}
function lessonLv() {
  const base = G.week <= 5 ? 1 : G.week <= 11 ? 2 : G.week <= 19 ? 3 : G.week <= 27 ? 4 : 5;
  return clamp(base, 1, 5);
}
function doRest() {
  const heal = ri(40, 60) + (G.cond >= 3 ? 10 : 0);
  G.stam = Math.min(G.maxStam, G.stam + heal);
  if (Math.random() < .45) G.cond = clamp(G.cond + 1, 0, 4);
  toast(`😴 ゆっくり休んだ　体力 +${heal}`);
  endWeek();
}

function openTalkSelect() {
  openSheet(`<div class="ptitle">だれと話す？<small>好感度が上がると特別なイベントが起きる</small></div>
   <div class="list">${CHAR_IDS.map(id => {
    const c = CHARS[id];
    return `<button class="item" data-c="${id}" style="text-align:left;width:100%">
      ${charImg(id, 42)}<div class="it"><b>${c.n}</b><small>${c.role}　好感度 ${Math.round(G.aff[id])}</small></div><span style="font-size:18px">▶</span></button>`;
  }).join("")}</div>
   <div style="height:10px"></div><button class="btn ghost" onclick="closeSheet()">やめる</button>`);
  $("sheetPanel").querySelectorAll(".item").forEach(b => b.onclick = () => { closeSheet(); doTalk(b.dataset.c); });
}
function doTalk(id) {
  const t = pick(TALKS[id]);
  G.stam = Math.min(G.maxStam, G.stam + 10);
  showEvent({
    c: id, t: t.t,
    ch: t.c.map(o => ({ t: o.t, fx: { aff: { [id]: o.a }, silent: true }, after: () => { toast(`💗 ${CHARS[id].n}の好感度 +${o.a}`); endWeek(); } }))
  }, true);
}

/* ================= レッスン結果 ================= */
function gainFor(key, base) {
  let g = base * statMult(key);
  const cur = G.st[key];
  if (cur >= 90) g *= .35; else if (cur >= 80) g *= .55; else if (cur >= 65) g *= .8;
  return g;
}
function addStat(key, v) {
  const before = Math.round(G.st[key]);
  G.st[key] = clamp(G.st[key] + v, 0, 100);
  return Math.round(G.st[key]) - before;
}
function finishLesson(cmd, r) {
  const fx = skillFx();
  let mult = CONDS[G.cond].m * (1 + (fx.g[cmd.g] || 0) + fx.all) * (1 + DB.meta.up.eff * .1);
  if (G.items.omamori > 0) { mult *= 1.6; G.items.omamori--; toast("🧿 お守りの力！ 上がり 1.6倍"); }
  if (G.over) mult *= .6;
  const base = 2.5 + r.score / 13;
  const gains = [];
  const mainG = gainFor(cmd.main, base * mult);
  const d1 = addStat(cmd.main, mainG);
  gains.push([STATS.find(s => s.k === cmd.main).n, d1]);
  if (cmd.sub === "*") {
    STATS.forEach(s => { if (s.k !== cmd.main) { const d = addStat(s.k, gainFor(s.k, base * mult * .32)); if (d) gains.push([s.n, d]); } });
  } else {
    const d2 = addStat(cmd.sub, gainFor(cmd.sub, base * mult * .45));
    if (d2) gains.push([STATS.find(s => s.k === cmd.sub).n, d2]);
  }
  let fans = 0;
  if (r.score >= 70) { fans = Math.round((r.score - 60) * ri(3, 7) * (1 + fx.fan)); G.fans += fans; }
  if (r.score >= 95 && r.correct === r.total) { G.pf[cmd.g] = (G.pf[cmd.g] || 0) + 1; G.perfectLesson++; }
  G.totalQ += r.total; G.totalOK += r.correct;
  G.bestCombo = Math.max(G.bestCombo, r.best);
  if (G.over && Math.random() < .35) { G.cond = clamp(G.cond - 1, 0, 4); }
  showResult({
    title: `${cmd.e} ${cmd.n}レッスン`, r, gains, fans,
    after: () => { checkSkills(() => endWeek()); }
  });
}

/* ================= 結果パネル ================= */
function scoreRank(s) { return s >= 95 ? ["PERFECT", "#ff3d8b"] : s >= 85 ? ["すばらしい", "#ff7b3d"] : s >= 70 ? ["よくできました", "#f2b705"] : s >= 50 ? ["まずまず", "#3fbf7f"] : ["もう一回！", "#7b8fd6"]; }
function showResult(o) {
  const [rn, rc] = scoreRank(o.r.score);
  const miss = o.r.misses.slice(0, 5).map(m =>
    `<div class="missRow"><span>${m.q}</span><em>${MATH.ansHtml(m.a)}</em></div>`).join("");
  $("resPanel").innerHTML = `
    <div class="resHead">
      <div style="font-size:12px;color:var(--ink2)">${o.title}</div>
      <div class="resScore">${o.r.score}<small> 点</small></div>
      <div class="resRank" style="background:${rc}">${rn}</div>
      <div style="font-size:11px;color:var(--ink2);margin-top:6px">正解 ${o.r.correct}/${o.r.total}　最大コンボ ${o.r.best}　平均 ${o.r.avgTime}秒</div>
    </div>
    <div class="gains">${o.gains.map(g => `<div class="gain"><span>${g[0]}</span><b>+${g[1]}</b></div>`).join("")}
      ${o.fans ? `<div class="gain"><span>💗 ファン</span><b>+${o.fans.toLocaleString()}</b></div>` : ""}</div>
    ${miss ? `<div class="missBox"><div class="mt">✏️ まちがえた問題（おぼえて帰ろう）</div>${miss}</div>` : `<div class="smallnote">ノーミス！ おみごと ✨</div>`}
    <button class="btn" id="resOk">つぎへ ▶</button>`;
  $("ovResult").classList.add("on");
  $("resOk").onclick = () => { sfx.tap(); $("ovResult").classList.remove("on"); o.after(); };
}

/* ================= スキル獲得チェック ================= */
function checkSkills(done) {
  const got = SKILLS.filter(s => !G.skills.includes(s.id) && s.chk(G));
  if (!got.length) return done();
  const s = got[0];
  G.skills.push(s.id);
  if (!DB.meta.skills.includes(s.id)) DB.meta.skills.push(s.id);
  sfx.skill();
  $("sfBox").innerHTML = `<div class="sfLabel">☆ とくしゅのうりょく 習得 ☆</div>
    <div class="sfStar">✨</div>
    <div class="sfName">${s.e} ${s.n}</div>
    <div class="sfDesc">${s.d}</div>`;
  $("skillFlash").classList.add("on");
  confetti(20);
  setTimeout(() => {
    $("skillFlash").classList.remove("on");
    checkSkills(done);
  }, 2300);
}

/* ================= 週の終わり ================= */
function endWeek() {
  /* 好感度イベント */
  for (const id of CHAR_IDS) {
    const done = G.bonds;
    const b = (BONDS[id] || []).find(x => G.aff[id] >= x.at && !done.includes(id + x.at));
    if (b) {
      done.push(id + b.at);
      return showEvent({ c: id, t: b.t, ch: [{ t: "▶", fx: b.fx, after: () => afterWeek() }] });
    }
  }
  /* ランダムイベント */
  if (Math.random() < .34 && G.week < TOTAL_W) {
    const pool = EVENTS.filter(e => !G.evseen || !(G.evseen || []).includes(e.id));
    const e = pool.length ? pick(pool) : pick(EVENTS);
    G.evseen = G.evseen || []; G.evseen.push(e.id);
    if (!DB.meta.evseen.includes(e.id)) DB.meta.evseen.push(e.id);
    return showEvent({ c: e.c, t: e.t, ch: e.ch.map(c => ({ t: c.t, fx: c.fx, after: () => afterWeek() })) });
  }
  afterWeek();
}
function afterWeek() {
  /* 調子のゆらぎ */
  if (Math.random() < .5) {
    let d = Math.random() < .5 ? -1 : 1;
    if (G.stam < 30) d = -1;
    if (G.stam > 80 && Math.random() < .6) d = 1;
    G.cond = clamp(G.cond + d, 0, 4);
  }
  /* 好感度の自然減 */
  CHAR_IDS.forEach(id => { G.aff[id] = Math.max(0, G.aff[id] - .6); });
  G.week++;
  if (G.week > TOTAL_W) return ending();
  save();
  const a = nextAud();
  if (a && a.w === G.week) {
    showEvent({ c: "misaki", t: `「いよいよ明日は『${a.n}』。\n……${esc(G.name)}ちゃん、いまのあなたなら大丈夫。行ってらっしゃい」`, ch: [{ t: "ステージへ", fx: { cond: 1 }, after: () => renderMain() }] });
  } else renderMain();
}

/* ================= イベント表示 ================= */
function showEvent(e, keepClose) {
  const c = CHARS[e.c];
  if (G && !G.done) renderMain();   /* イベントの背景は必ずメイン画面 */
  $("evPanel").innerHTML = `
    <div class="evTop">${charImg(e.c, 92)}<div class="evName">${c.n}</div></div>
    <div class="evBody">${rep(e.t).replace(/\n/g, "<br>")}</div>
    <div class="evChoices">${e.ch.map((ch, i) => `<button class="evc" data-i="${i}">${rep(ch.t)}</button>`).join("")}</div>`;
  $("ovEvent").classList.add("on");
  $("evPanel").querySelectorAll(".evc").forEach(b => b.onclick = () => {
    sfx.tap();
    const ch = e.ch[+b.dataset.i];
    $("ovEvent").classList.remove("on");
    applyFx(ch.fx || {});
    if (ch.after) ch.after(); else renderMain();
  });
}
function applyFx(f) {
  const msgs = [];
  if (f.stam) { G.stam = clamp(G.stam + f.stam, 0, G.maxStam); msgs.push(`体力 ${f.stam > 0 ? "+" : ""}${f.stam}`); }
  if (f.fans) { G.fans += f.fans; msgs.push(`💗 ファン +${f.fans.toLocaleString()}`); }
  if (f.cond) { G.cond = clamp(G.cond + f.cond, 0, 4); msgs.push(`調子 ${f.cond > 0 ? "アップ" : "ダウン"}`); }
  if (f.st) for (const k in f.st) { const d = addStat(k, f.st[k]); if (d) msgs.push(`${STATS.find(s => s.k === k).n} +${d}`); }
  if (f.aff) for (const k in f.aff) { G.aff[k] = clamp(G.aff[k] + f.aff[k], 0, 100); if (!f.silent) msgs.push(`${CHARS[k].n} 好感度 ${f.aff[k] > 0 ? "+" : ""}${f.aff[k]}`); }
  if (f.msg) toast(f.msg);
  if (msgs.length && !f.silent) toast(msgs.join("　"));
  save();
}

/* ================= クイズ・エンジン ================= */
let Q = null;
function startQuiz(cfg) {
  const fx = skillFx();
  Q = {
    ...cfg, idx: 0, correct: 0, combo: 0, best: 0, sum: 0, misses: [], times: [],
    input: "", shield: fx.shield, lock: false, t0: 0, limit: 10, raf: 0, startAll: performance.now(),
    timeMul: 1 + (G && G.items.note ? .3 : 0) + (cfg.mode === "drill" ? .5 : 0),
    lastQ: "",
  };
  $("scrQuiz").classList.toggle("stage", cfg.mode === "aud");
  $("qGenre").textContent = cfg.title;
  $("qTotal").textContent = cfg.total;
  $("qJudges").classList.toggle("hide", cfg.mode !== "aud");
  if (cfg.mode === "aud") renderJudges(0);
  buildPad();
  show("scrQuiz");
  nextQ();
}
function buildPad() { $("pad").innerHTML = ""; }
function renderChoices() {
  $("pad").classList.add("choices");
  $("pad").innerHTML = Q.cur.choices.map((c, i) =>
    `<button class="key choice" data-i="${i}"><span class="cnum">${i + 1}</span><span class="ctxt">${c}</span></button>`).join("");
  $("pad").querySelectorAll(".choice").forEach(b => b.onclick = () => pickChoice(+b.dataset.i));
}
function pickChoice(i) {
  if (!Q || Q.lock) return;
  sfx.tap();
  const c = Q.cur.choices[i];
  Q.input = c;
  $("qVal").textContent = c;
  $("pad").querySelectorAll(".choice").forEach((b, j) => b.classList.toggle("sel", j === i));
  judge(c === Q.cur.a.text, false);
}
function keyIn(k) {
  if (!Q || Q.lock) return;
  sfx.tap();
  if (k === "back") Q.input = Q.input.slice(0, -1);
  else if (k === "clear") Q.input = "";
  else if (k === "ok") return submit();
  else if (Q.input.length < 10) {
    if (k === "." && (Q.input.includes(".") || !Q.input)) return;
    if (k === "/" && (Q.input.includes("/") || !Q.input)) return;
    Q.input += k;
  }
  drawInput();
}
function drawInput() {
  $("qVal").textContent = Q.input;
  $("qInput").className = "";
}
function nextQ() {
  if (Q.idx >= Q.total) return endQuiz();
  let q, tries = 0;
  do { q = MATH.gen(Q.mode === "aud" ? pick(["yomi", "kanyoku", "kotowaza", "yoji", "goi", "keigo"]) : Q.genre, Q.lv); tries++; }
  while (q.q === Q.lastQ && tries < 8);
  Q.lastQ = q.q;
  Q.cur = q; Q.input = "";
  $("qNo").textContent = Q.idx + 1;
  $("qTag").textContent = q.tag;
  $("qText").innerHTML = q.q;
  $("qText").className = q.small ? "small" : "";
  $("qNote").textContent = q.note || "";
  $("qUnit").textContent = q.a.unit || "";
  $("qCombo").textContent = Q.combo >= 2 ? `${Q.combo} COMBO` : "";
  drawInput();
  renderChoices();
  Q.limit = q.time * Q.timeMul;
  Q.t0 = performance.now();
  Q.lock = false;
  cancelAnimationFrame(Q.raf);
  tickQ();
}
function tickQ() {
  if (!Q || Q.lock) return;
  const el = (performance.now() - Q.t0) / 1000;
  const left = Math.max(0, 1 - el / Q.limit);
  const bar = $("qTimer");
  bar.style.width = (left * 100) + "%";
  bar.classList.toggle("warn", left < .3);
  if (left <= 0) return judge(false, true);
  Q.raf = requestAnimationFrame(tickQ);
}
function submit() {
  if (!Q.input) return;
  judge(MATH.check(Q.input, Q.cur.a), false);
}
function judge(ok, timeout) {
  if (Q.lock) return;
  Q.lock = true;
  cancelAnimationFrame(Q.raf);
  const el = (performance.now() - Q.t0) / 1000;
  Q.times.push(Math.min(el, Q.limit));
  let sc = 0, label = "", color = "#ff3d8b";
  if (ok) {
    Q.correct++;
    const r = el / Q.limit;
    if (r <= .3) { sc = 100; label = "PERFECT!"; color = "#ff3d8b"; sfx.great(); }
    else if (r <= .55) { sc = 88; label = "GREAT!"; color = "#ff7b3d"; sfx.good(); }
    else if (r <= .8) { sc = 74; label = "GOOD!"; color = "#f2b705"; sfx.good(); }
    else { sc = 58; label = "OK"; color = "#3fbf7f"; sfx.good(); }
    Q.combo++; Q.best = Math.max(Q.best, Q.combo);
    if (Q.combo >= 3) sc = Math.min(100, sc + Math.min(10, Q.combo));
    $("qInput").className = "ok";
  } else {
    if (Q.shield > 0) { Q.shield--; label = "SAVE!"; color = "#7b8fd6"; }
    else { Q.combo = 0; label = timeout ? "TIME UP…" : "ざんねん…"; color = "#7b8fd6"; }
    sfx.bad();
    Q.misses.push({ q: Q.cur.q.replace(/<br>/g, " "), a: Q.cur.a });
    $("qInput").className = "ng";
  }
  Q.sum += sc;
  const sub = ok ? "" : `<small>こたえ　${MATH.ansHtml(Q.cur.a)}${Q.cur.a.unit || ""}</small>`;
  $("qCombo").textContent = Q.combo >= 2 ? `${Q.combo} COMBO` : "";
  $("qCombo").className = Q.combo >= 3 ? "hot" : "";
  flash(label, color, sub);
  if (Q.mode === "aud") renderJudges(Q.sum / Math.max(1, Q.idx + 1));
  Q.idx++;
  setTimeout(() => { $("qFb").classList.remove("on"); nextQ(); }, ok ? 620 : 1500);
}
function flash(txt, color, sub) {
  $("qFb").innerHTML = `<div class="fbi" style="color:${color}">${txt}${sub || ""}</div>`;
  $("qFb").classList.add("on");
}
function endQuiz() {
  cancelAnimationFrame(Q.raf);
  const score = Math.round(Q.sum / Q.total);
  const avgTime = Math.round(Q.times.reduce((a, b) => a + b, 0) / Q.total * 10) / 10;
  const totalTime = Math.round((performance.now() - Q.startAll) / 100) / 10;
  const r = { score, correct: Q.correct, total: Q.total, best: Q.best, misses: Q.misses, avgTime, totalTime };
  const cb = Q.onEnd; Q = null;
  cb(r);
}
/* キーボード入力（PC） */
document.addEventListener("keydown", ev => {
  if (!Q || !$("scrQuiz").classList.contains("on")) return;
  const k = ev.key;
  if (/^[1-4]$/.test(k)) pickChoice(+k - 1);
});

/* ================= オーディション ================= */
function renderJudges(avg) {
  const ems = ["🧑‍💼", "👩‍🎤", "🕴"];
  $("qJudges").innerHTML = ems.map((e, i) => {
    const v = clamp(avg - i * 4 + 8, 0, 100);
    return `<div class="jd ${v > 60 ? "good" : ""}"><span class="je">${v > 70 ? "😍" : v > 45 ? e : "🤨"}</span>
      <div class="jb"><u style="width:${v}%"></u></div></div>`;
  }).join("");
}
function startAudition() {
  const a = nextAud();
  const idx = AUDS.indexOf(a);
  showEvent({
    c: "rena",
    t: idx === 3
      ? "「ついに、ここまで来たわね。\n……最後くらい、本気のあなたを見せなさい。\nわたしも、そうするから」"
      : "「あら、あなたも出るの。\n……せいぜい、足を引っぱらないでね」",
    ch: [{
      t: "ステージに立つ", fx: {}, after: () => {
        startQuiz({
          mode: "aud", lv: a.lv, total: a.q,
          title: `🎬 ${a.n}`,
          onEnd: r => finishAudition(a, idx, r)
        });
      }
    }]
  });
}
function finishAudition(a, idx, r) {
  const fx = skillFx();
  const statAvg = a.theme.reduce((s, k) => s + G.st[k], 0) / a.theme.length;
  let statScore = statAvg * .6;
  /* 本番のプレッシャー：メンタルが低いと実力を出しきれない */
  if (!fx.iron) {
    const p = clamp((60 - G.st.me) / 100, 0, .25);
    statScore *= (1 - p);
  }
  const quizScore = r.score * .4;
  const outfitB = G.outfit ? OUTFITS.find(o => o.id === G.outfit).vi * .15 : 0;
  const total = Math.round(statScore + quizScore + fx.aud + outfitB);
  const rivalBase = a.rival + ri(-4, 5);
  const win = total >= rivalBase;
  /* 段階合格：期待枠 → 合格 → トップ合格 */
  const hope = a.need - 20, mid = a.need - 6, top = a.need + 10;
  const tier = total >= top ? 2 : total >= mid ? 1 : total >= hope ? 0 : -1;
  const pass = tier >= 0;
  const fanMul = tier === 2 ? 1.4 : tier === 1 ? 1 : tier === 0 ? .7 : .35;
  const fans = Math.round(a.fans * fanMul * (1 + Math.max(0, total - hope) / 100) * (1 + fx.fan));
  G.fans += Math.max(0, fans);
  G.auds.push({ n: a.n, score: total, rival: rivalBase, pass, win, tier });
  G.totalQ += r.total; G.totalOK += r.correct;
  G.bestCombo = Math.max(G.bestCombo, r.best);
  if (win) { G.aff.rena = clamp(G.aff.rena + 6, 0, 100); }
  else G.aff.rena = clamp(G.aff.rena + 3, 0, 100);
  if (tier === 2) { confetti(60); sfx.clear(); }
  else if (tier >= 0) { confetti(30); sfx.clear(); }

  const [rn, rc] = tier === 2 ? [win ? "🏆 トップ合格 ＆ 玲奈に勝利！" : "🏆 トップ合格！", "#ff3d8b"]
    : tier === 1 ? ["合格！", "#ff7b3d"]
    : tier === 0 ? ["✨ 期待枠で合格！", "#2fb79c"]
    : ["不合格…", "#7b8fd6"];
  $("resPanel").innerHTML = `
    <div class="resHead">
      <div style="font-size:12px;color:var(--ink2)">${a.n}</div>
      <div class="resScore">${total}<small> 点</small></div>
      <div class="resRank" style="background:${rc}">${rn}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;background:#fff;border-radius:14px;padding:10px;margin:8px 0">
      ${charImg("rena", 44)}
      <div style="flex:1"><b style="font-size:13px">玲奈</b>
      <div style="font-size:11px;color:var(--ink2)">${rivalBase} 点　${win ? "きみの勝ち！" : "まだ届かない…"}</div></div>
      <div style="font-size:22px">${win ? "🏆" : "😤"}</div>
    </div>
    <div class="gains">
      <div class="gain"><span>ステータス評価（${a.theme.map(k => STATS.find(s => s.k === k).n).join("・")}）</span><b>${Math.round(statScore)}</b></div>
      <div class="gain"><span>ことばパフォーマンス</span><b>${Math.round(quizScore)}</b></div>
      ${fx.aud ? `<div class="gain"><span>とくしゅのうりょく</span><b>+${fx.aud}</b></div>` : ""}
      ${outfitB ? `<div class="gain"><span>衣装ボーナス</span><b>+${Math.round(outfitB)}</b></div>` : ""}
      <div class="gain"><span>💗 ファン</span><b>+${Math.max(0, fans).toLocaleString()}</b></div>
    </div>
    <div class="smallnote">🏆 トップ合格 ${top}点〜　／　合格 ${mid}点〜　／　✨ 期待枠 ${hope}点〜<br>正解 ${r.correct}/${r.total}　最大コンボ ${r.best}</div>
    <button class="btn" id="resOk">つぎへ ▶</button>`;
  $("ovResult").classList.add("on");
  $("resOk").onclick = () => {
    sfx.tap(); $("ovResult").classList.remove("on");
    checkSkills(() => {
      if (idx === 3) return ending();
      const evt = tier === 2
        ? { c: "misaki", t: `「トップ合格だよ、${esc(G.name)}ちゃん！\n審査員が全員、きみの名前をメモしてた。\n……すごいことなんだよ、これ」`, fx: { cond: 1, st: { me: 3 } } }
        : tier === 1
        ? { c: "misaki", t: `「合格！ やったね、${esc(G.name)}ちゃん。\n……でも、ここからが本番だよ」`, fx: { cond: 1 } }
        : tier === 0
        ? { c: "misaki", t: `「……期待枠での合格。\n点数はまだ足りない。でも審査員は\n『この子は伸びる』って言ってた。\nその期待、次で証明しよう」`, fx: { st: { me: 4 } } }
        : { c: "hinano", t: `「くやしいけど…まだ終わってないよ！\n次、いっしょにがんばろ！」`, fx: { st: { me: 3 } } };
      showEvent({ c: evt.c, t: evt.t, ch: [{ t: "▶", fx: evt.fx, after: () => afterWeek() }] });
    });
  };
}

/* ================= エンディング ================= */
function ending() {
  const last = G.auds[G.auds.length - 1] || { score: 0, win: false };
  const stTotal = STATS.reduce((s, x) => s + G.st[x.k], 0);
  const passCount = G.auds.filter(a => a.pass).length;
  const point = last.score + stTotal / 5 + passCount * 6 + (last.win ? 12 : 0);
  if (point >= 175) return endCard("S", "センターデビュー！",
    `${G.name}の名前が、いちばん大きく光った。\nセンターに立つのは、きみだ。\n\n「ことばだけは、だれにも負けない」。\nその小さな自信が、最後にステージを支配した。`, point, 1);
  if (point >= 150) return endCard("A", "グループデビュー！",
    `${G.name}は、正式にデビューメンバーに選ばれた。\nまだセンターじゃない。でも、ステージの上にいる。\n\nここからが、ほんとうのスタート。`, point, 1);
  /* ============ デビューに届かない → 敗者復活チェーン ============ */
  G.endPoint = point; save();
  redemption1();
}

/* ---------- 救済①：敗者復活ライブ ---------- */
function redemption1() {
  showEvent({
    c: "misaki",
    t: "「……ちょっと待って。いま、電話が。\n\n『敗者復活ステージに、1枠だけ空きが出た』\n\n──まだ、終わってない。\nいちばん得意なステージで、もう一回だけ勝負しよう」",
    ch: [{ t: "「やります」", fx: { cond: 1 }, after: () => startQuiz({
      mode: "aud", lv: 4, total: 10, title: "🔥 敗者復活ライブ",
      onEnd: r => {
        G.totalQ += r.total; G.totalOK += r.correct; G.bestCombo = Math.max(G.bestCombo, r.best);
        if (r.score >= 65) return endCard("A", "敗者復活デビュー！",
          `会場の隅で、名前が呼ばれた。\n「敗者復活──${G.name}」\n\n一度は落ちた。でも、あきらめなかった。\nその姿を、審査員はずっと見ていた。\n\n泣いたのは、発表のあとだった。`, G.endPoint + 30, 1);
        redemption2();
      }
    }) }]
  });
}
/* ---------- 救済②：SNS生配信チャレンジ ---------- */
function redemption2() {
  showEvent({
    c: "hinano",
    t: "「ねえ、まだへこんでる場合じゃないよ！\nSNSの生配信、今からやろう！\n\nファンのみんなが『もう一回見たい』って言ってる。\n配信がバズったら、事務所だって無視できない！」",
    ch: [{ t: "「……うん、やる！」", fx: {}, after: () => startQuiz({
      mode: "aud", lv: 3, total: 8, title: "📱 SNS生配信チャレンジ",
      onEnd: r => {
        G.totalQ += r.total; G.totalOK += r.correct; G.bestCombo = Math.max(G.bestCombo, r.best);
        G.fans += r.score * 20;
        if (r.score >= 55) return endCard("B+", "ファン投票デビュー！",
          `配信の同時視聴者数が、事務所の予想をこえた。\n「この子をデビューさせないなんて、もったいない」\n\nファンの声が、扉をこじあけた。\nきみを推してくれた人の数だけ、\nこのデビューには意味がある。`, G.endPoint + 20, 1);
        redemption3();
      }
    }) }]
  });
}
/* ---------- 救済③：特別研究生試験 ---------- */
function redemption3() {
  showEvent({
    c: "rena",
    t: "「……わたしから、事務所に話をつけた。\n特別研究生試験。これに受かれば、デビューへの道は残る。\n\n──あなたを、こんなところで終わらせたくないの。\n行きなさい」",
    ch: [{ t: "「玲奈……ありがとう」", fx: { aff: { rena: 10 }, silent: true }, after: () => startQuiz({
      mode: "aud", lv: 2, total: 8, title: "🌙 特別研究生試験",
      onEnd: r => {
        G.totalQ += r.total; G.totalOK += r.correct; G.bestCombo = Math.max(G.bestCombo, r.best);
        if (r.score >= 40) return endCard("B", "研究生デビュー！",
          `特別研究生として、デビューへの切符をつかんだ。\n遅咲きでいい。\n\n花の咲く順番は、みんなちがう。\nでも、咲くと決めた花は、かならず咲く。`, G.endPoint + 10, 1);
        endCard("C", "また、来年。",
          `今回はデビューできなかった。\nくやしくて、涙が出た。\n\nでも、32週前の自分より、ことばの力はずっと強くなった。\nそれは、だれにも取られない。\n\n※さいごまで挑んだきみに、がんばりボーナス！`, G.endPoint, 1.5);
      }
    }) }]
  });
}

/* ---------- エンディングカード表示 ---------- */
function endCard(rk, title, text, point, dpMul) {

  const topChar = CHAR_IDS.reduce((a, b) => G.aff[a] >= G.aff[b] ? a : b);
  const bond = G.aff[topChar] >= 60 ? `<div style="margin-top:12px;display:flex;gap:10px;align-items:center;background:#fff6fb;border-radius:16px;padding:10px">
    ${charImg(topChar, 56)}<div style="font-size:12px;text-align:left;line-height:1.8">
    <b>${CHARS[topChar].n} とのエンディング</b><br>${bondEndText(topChar, rk)}</div></div>` : "";

  const dp = Math.round((point / 3 + G.fans / 800 + Object.values(G.pf).reduce((a, b) => a + b, 0)) * (dpMul || 1));
  DB.meta.dp += dp; DB.meta.plays++;
  DB.meta.hall.unshift({
    name: G.name, av: G.av, rank: rk, title, score: Math.round(point),
    st: { ...G.st }, fans: G.fans, skills: G.skills.length, acc: G.totalQ ? Math.round(G.totalOK / G.totalQ * 100) : 0
  });
  DB.meta.hall = DB.meta.hall.slice(0, 12);
  DB.run = null; G.done = true;
  save();
  confetti(70); sfx.clear();

  $("endCard").innerHTML = `
    <div style="font-size:12px;color:var(--ink2)">デビュー審査ライブ　結果</div>
    <div class="endRank" style="${rk.length > 1 ? "font-size:min(17vw,72px)" : ""}">${rk}</div>
    <div class="endTitle">${title}</div>
    <div style="display:flex;justify-content:center;margin:6px 0 10px">
      <img src="${AVATARS[G.av].img}" style="width:96px;height:96px;border-radius:24px;object-fit:cover;box-shadow:0 6px 16px #0003">
    </div>
    <div class="endText">${text.replace(/\n/g, "<br>")}</div>
    ${bond}
    <div class="endStats">
      ${STATS.map(s => `<div>${s.n} <b>${Math.round(G.st[s.k])}</b> <span style="color:${rank(Math.round(G.st[s.k]))[2]}">${rank(Math.round(G.st[s.k]))[1]}</span></div>`).join("")}
      <div>💗 ファン <b>${G.fans.toLocaleString()}</b></div>
      <div>✨ スキル <b>${G.skills.length}</b>個</div>
      <div>✏️ 正答率 <b>${G.totalQ ? Math.round(G.totalOK / G.totalQ * 100) : 0}%</b></div>
      <div>🔥 最大コンボ <b>${G.bestCombo}</b></div>
    </div>
    <div class="dpGet">💎 ドリームポイント <b>+${dp}</b><br><span style="font-size:11px;color:var(--ink2)">次のアイドルの育成に使える（引きつぎ）</span></div>
    <button class="btn" id="endOk">タイトルへ</button>`;
  show("scrEnd");
  $("endOk").onclick = () => { sfx.tap(); G = null; renderTitle(); };
}
function bondEndText(id, rk) {
  const t = {
    hinano: "「やったーっ！ ……ねえ、あたしたち、ほんとに同じステージに立てたね」",
    sakura: "「わたしのノート、もう必要ないですね。……ううん、これからも書きます。あなたの記録を」",
    luna:   "「……となり、あけといたから。ずっと」",
    rena:   "「今回は、あなたの勝ち。……次は、ぜったい負けないから」",
    misaki: "「ここまで連れてくるのが、わたしの仕事だった。……ここからは、あなたの番」",
  };
  return t[id] + (rk === "S" ? "<br><span style='color:#e0a020'>☆ 最高のエンディング ☆</span>" : "");
}

/* ================= ショップ（ゲーム内） ================= */
function openShop() {
  const own = G.ownOutfits;
  openSheet(`<div class="ptitle">👗 ショップ<small>💗 ファン ${G.fans.toLocaleString()} が おかね がわり</small></div>
  <div style="font-size:12px;color:var(--ink2);margin:6px 0 6px">衣装（ビジュアルが上がる・ずっと有効）</div>
  <div class="list">${OUTFITS.map(o => {
    const has = own.includes(o.id);
    return `<div class="item ${!has && G.fans < o.cost ? "lock" : ""}">
      <span class="ie">${o.e}</span><div class="it"><b>${o.n}</b><small>ビジュアル +${o.vi}　／　${o.cost.toLocaleString()}</small></div>
      ${has ? (G.outfit === o.id ? `<span class="own">着用中</span>` : `<button class="buy" data-w="${o.id}">着る</button>`)
            : `<button class="buy" data-b="${o.id}" ${G.fans < o.cost ? "disabled" : ""}>買う</button>`}</div>`;
  }).join("")}</div>
  <div style="font-size:12px;color:var(--ink2);margin:12px 0 6px">アイテム</div>
  <div class="list">${ITEMS.map(o => `<div class="item ${G.fans < o.cost ? "lock" : ""}">
      <span class="ie">${o.e}</span><div class="it"><b>${o.n}</b><small>${o.d}　／　${o.cost.toLocaleString()}</small></div>
      <button class="buy" data-i="${o.id}" ${G.fans < o.cost || (o.id === "note" && G.items.note) ? "disabled" : ""}>買う</button></div>`).join("")}</div>
  <div style="height:12px"></div><button class="btn ghost" onclick="closeSheet()">とじる</button>`);
  $("sheetPanel").querySelectorAll(".buy").forEach(b => b.onclick = () => {
    const { b: bid, w: wid, i: iid } = b.dataset;
    if (wid) { G.outfit = wid; sfx.shop(); }
    else if (bid) {
      const o = OUTFITS.find(x => x.id === bid);
      if (G.fans < o.cost) return;
      G.fans -= o.cost; G.ownOutfits.push(o.id); G.outfit = o.id;
      if (!DB.meta.outfits.includes(o.id)) DB.meta.outfits.push(o.id);
      addStat("vi", o.vi); sfx.shop(); toast(`${o.e} ${o.n} を手に入れた！ ビジュアル +${o.vi}`);
    } else if (iid) {
      const o = ITEMS.find(x => x.id === iid);
      if (G.fans < o.cost) return;
      G.fans -= o.cost; sfx.shop();
      if (iid === "drink") { G.stam = Math.min(G.maxStam, G.stam + 45); toast("🥤 体力 +45"); }
      if (iid === "omamori") { G.items.omamori++; toast("🧿 お守りを手に入れた"); }
      if (iid === "note") { G.items.note = 1; toast("📓 制限時間が のびた！"); }
    }
    save(); openShop(); renderMain(); $("ovSheet").classList.add("on");
  });
}

/* ================= スキル一覧 ================= */
function openSkills() {
  openSheet(`<div class="ptitle">✨ とくしゅのうりょく<small>レッスンで PERFECT を取ると おぼえる</small></div>
  <div class="list">${SKILLS.map(s => {
    const has = G.skills.includes(s.id);
    return `<div class="item ${has ? "" : "lock"}"><span class="ie">${s.e}</span>
      <div class="it"><b>${has ? s.n : "？？？"}</b><small>${has ? s.d : condText(s)}</small></div>
      ${has ? `<span class="own">習得</span>` : ""}</div>`;
  }).join("")}</div>
  <div style="height:12px"></div><button class="btn ghost" onclick="closeSheet()">とじる</button>`);
}
function condText(s) {
  const m = {
    pi3: "ボーカルレッスンで PERFECT 3回", pi8: "ボーカルレッスンで PERFECT 8回",
    fr3: "ダンスレッスンで PERFECT 3回", fr8: "ダンスレッスンで PERFECT 8回",
    ra3: "ビジュアルレッスンで PERFECT 3回", ra8: "ビジュアルレッスンで PERFECT 8回",
    gy3: "トークレッスンで PERFECT 3回", gy8: "トークレッスンで PERFECT 8回",
    ku3: "自主トレで PERFECT 3回", queen: "5ジャンルすべてで PERFECT 5回",
    combo: "最大コンボ 15", nomiss: "レッスンで 100点", iron: "メンタル 70以上",
    smile: "好感度の合計 200以上",
  };
  return "条件：" + (m[s.id] || "？");
}

/* ================= ずかん ================= */
let zTab = 0;
function openZukan() {
  const tabs = ["殿堂入り", "スキル", "衣装", "きろく"];
  let body = "";
  if (zTab === 0) {
    body = DB.meta.hall.length ? `<div class="list">${DB.meta.hall.map(h => `
      <div class="item"><img src="${AVATARS[h.av].img}" style="width:40px;height:40px;border-radius:12px;object-fit:cover">
      <div class="it"><b>${esc(h.name)}　<span class="badge" style="background:${rank(h.rank === "S" ? 95 : h.rank === "A" ? 88 : h.rank === "B" ? 78 : 60)[2]}">${h.rank}</span></b>
      <small>${h.title}　／　ファン ${h.fans.toLocaleString()}　正答率 ${h.acc}%</small></div></div>`).join("")}</div>`
      : `<div class="smallnote">まだ だれもデビューしていない。<br>32週を走りきると ここに残るよ。</div>`;
  } else if (zTab === 1) {
    body = `<div class="list">${SKILLS.map(s => {
      const has = DB.meta.skills.includes(s.id);
      return `<div class="item ${has ? "" : "lock"}"><span class="ie">${has ? s.e : "？"}</span>
        <div class="it"><b>${has ? s.n : "？？？"}</b><small>${has ? s.d : condText(s)}</small></div></div>`;
    }).join("")}</div><div class="smallnote">${DB.meta.skills.length} / ${SKILLS.length} 個 コンプリート</div>`;
  } else if (zTab === 2) {
    body = `<div class="list">${OUTFITS.map(o => {
      const has = DB.meta.outfits.includes(o.id);
      return `<div class="item ${has ? "" : "lock"}"><span class="ie">${has ? o.e : "？"}</span>
        <div class="it"><b>${has ? o.n : "？？？"}</b><small>ビジュアル +${o.vi}</small></div></div>`;
    }).join("")}</div>`;
  } else {
    const keys = Object.keys(DB.meta.best);
    body = keys.length ? `<div class="list">${keys.sort().map(k => {
      const [g, lv] = k.split("_"), b = DB.meta.best[k];
      return `<div class="item"><span class="ie">🔥</span><div class="it"><b>${MATH.GENRE_NAME[g]}　レベル${lv}</b>
        <small>ベストタイム ${b.time}秒　／　正解 ${b.ok}/20</small></div></div>`;
    }).join("")}</div>` : `<div class="smallnote">とっくんモードの記録がここに残る。</div>`;
    body += `<div class="divider"></div>
      <div class="kv"><span>デビューした回数</span><b>${DB.meta.plays}</b></div>
      <div class="kv"><span>見たイベント</span><b>${DB.meta.evseen.length} / ${EVENTS.length}</b></div>
      <div class="kv"><span>ドリームポイント</span><b>${DB.meta.dp}</b></div>`;
  }
  openSheet(`<div class="ptitle">📔 ずかん</div>
    <div class="tabs">${tabs.map((t, i) => `<button class="tab ${i === zTab ? "on" : ""}" data-t="${i}">${t}</button>`).join("")}</div>
    ${body}<div style="height:12px"></div><button class="btn ghost" onclick="closeSheet()">とじる</button>`);
  $("sheetPanel").querySelectorAll(".tab").forEach(b => b.onclick = () => { zTab = +b.dataset.t; sfx.tap(); openZukan(); });
}

/* ================= ドリームショップ（引きつぎ） ================= */
const UPS = [
  { k: "st",   n: "初期ステータス", e: "📈", d: "はじめのステータス +5", cost: 20, max: 5 },
  { k: "stam", n: "体力の最大値",   e: "💪", d: "体力の最大 +10",       cost: 15, max: 5 },
  { k: "eff",  n: "レッスン効率",   e: "⚡️", d: "レッスンの上がり +10%", cost: 30, max: 5 },
  { k: "fan",  n: "初期ファン",     e: "💗", d: "はじめのファン +500",   cost: 10, max: 5 },
  { k: "aff",  n: "初期好感度",     e: "🤝", d: "みんなの好感度 +10",    cost: 12, max: 5 },
];
function openDream() {
  openSheet(`<div class="ptitle">💎 ドリームショップ<small>デビューするともらえるポイントで、次の子を強くする</small></div>
  <div style="text-align:center;font-size:14px;margin-bottom:10px">所持 💎 <b style="font-size:22px;color:var(--pinkD)">${DB.meta.dp}</b></div>
  <div class="list">${UPS.map(u => {
    const lv = DB.meta.up[u.k], full = lv >= u.max, cost = u.cost * (lv + 1);
    return `<div class="item ${DB.meta.dp < cost && !full ? "lock" : ""}"><span class="ie">${u.e}</span>
      <div class="it"><b>${u.n} <span class="badge">Lv.${lv}/${u.max}</span></b><small>${u.d}　${full ? "" : `／ 💎${cost}`}</small></div>
      ${full ? `<span class="own">MAX</span>` : `<button class="buy" data-u="${u.k}" ${DB.meta.dp < cost ? "disabled" : ""}>強化</button>`}</div>`;
  }).join("")}</div>
  <div style="height:12px"></div><button class="btn ghost" onclick="closeSheet()">とじる</button>`);
  $("sheetPanel").querySelectorAll(".buy").forEach(b => b.onclick = () => {
    const u = UPS.find(x => x.k === b.dataset.u);
    const cost = u.cost * (DB.meta.up[u.k] + 1);
    if (DB.meta.dp < cost) return;
    DB.meta.dp -= cost; DB.meta.up[u.k]++;
    sfx.shop(); save(); openDream(); renderTitle(); $("ovSheet").classList.add("on");
  });
}

/* ================= とっくん（ドリル） ================= */
let drill = { g: "pi", lv: 1 };
function openDrill() {
  const gs = Object.keys(MATH.GENRE_NAME);
  openSheet(`<div class="ptitle">🔥 とっくんモード<small>20問タイムアタック。ベストタイムに挑戦</small></div>
    <div style="font-size:12px;margin:4px 0 6px">ジャンル</div>
    <div class="list">${gs.map(g => `<button class="item" data-g="${g}" style="width:100%;text-align:left;${g === drill.g ? "outline:3px solid var(--pink)" : ""}">
      <span class="ie">${{ yomi: "📖", kanyoku: "🗣", kotowaza: "🏮", yoji: "🀄", goi: "🔁", keigo: "🎩" }[g]}</span>
      <div class="it"><b>${MATH.GENRE_NAME[g]}</b><small>${bestText(g, drill.lv)}</small></div></button>`).join("")}</div>
    <div style="font-size:12px;margin:12px 0 6px">レベル</div>
    <div class="tabs">${[1, 2, 3, 4, 5].map(l => `<button class="tab ${l === drill.lv ? "on" : ""}" data-l="${l}">Lv.${l}</button>`).join("")}</div>
    <button class="btn" id="drillGo">スタート！</button>
    <div style="height:8px"></div><button class="btn ghost" onclick="closeSheet()">とじる</button>`);
  $("sheetPanel").querySelectorAll("[data-g]").forEach(b => b.onclick = () => { drill.g = b.dataset.g; sfx.tap(); openDrill(); });
  $("sheetPanel").querySelectorAll("[data-l]").forEach(b => b.onclick = () => { drill.lv = +b.dataset.l; sfx.tap(); openDrill(); });
  $("drillGo").onclick = () => {
    closeSheet(); sfx.tap();
    startQuiz({
      mode: "drill", genre: drill.g, lv: drill.lv, total: 20,
      title: `🔥 ${MATH.GENRE_NAME[drill.g]} Lv.${drill.lv}`,
      onEnd: r => finishDrill(r)
    });
  };
}
function bestText(g, lv) {
  const b = DB.meta.best[`${g}_${lv}`];
  return b ? `Lv.${lv} ベスト ${b.time}秒（正解 ${b.ok}/20）` : `Lv.${lv} 記録なし`;
}
function finishDrill(r) {
  const key = `${drill.g}_${drill.lv}`;
  const old = DB.meta.best[key];
  const isBest = r.correct >= 18 && (!old || r.totalTime < old.time);
  if (isBest) { DB.meta.best[key] = { time: r.totalTime, ok: r.correct }; save(); confetti(30); }
  const miss = r.misses.slice(0, 8).map(m => `<div class="missRow"><span>${m.q}</span><em>${MATH.ansHtml(m.a)}</em></div>`).join("");
  $("resPanel").innerHTML = `
    <div class="resHead">
      <div style="font-size:12px;color:var(--ink2)">🔥 とっくん ${MATH.GENRE_NAME[drill.g]} Lv.${drill.lv}</div>
      <div class="resScore">${r.totalTime}<small> 秒</small></div>
      <div class="resRank" style="background:${isBest ? "#ff3d8b" : "#7b8fd6"}">${isBest ? "ベスト記録こうしん！" : "記録"}</div>
      <div style="font-size:11px;color:var(--ink2);margin-top:6px">正解 ${r.correct}/20　1問平均 ${r.avgTime}秒　最大コンボ ${r.best}</div>
      ${old ? `<div style="font-size:11px;color:var(--ink2)">これまでのベスト ${old.time}秒</div>` : ""}
      ${r.correct < 18 ? `<div style="font-size:11px;color:var(--red);margin-top:4px">※ 18問以上の正解でベスト記録になるよ</div>` : ""}
    </div>
    ${miss ? `<div class="missBox"><div class="mt">✏️ まちがえた問題</div>${miss}</div>` : `<div class="smallnote">全問正解！ かんぺき ✨</div>`}
    <button class="btn" id="resOk">もどる</button>`;
  $("ovResult").classList.add("on");
  $("resOk").onclick = () => { sfx.tap(); $("ovResult").classList.remove("on"); renderTitle(); openDrill(); };
}

/* ================= 起動 ================= */
window.closeSheet = closeSheet;
renderTitle();
