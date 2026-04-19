export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalize(str) {
  return str.trim().replace(/\s+/g, "")
    .replace(/[\u30A1-\u30F6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase();
}

export function judgeAnswer(userAnswer, correctAnswers) {
  const u = normalize(userAnswer);
  for (const ans of correctAnswers) {
    const a = normalize(ans);
    if (u === a) return true;
    if (a.includes(u) && u.length >= 2) return true;
    if (u.includes(a) && a.length >= 2) return true;
  }
  return false;
}

export function getPartOfSpeech(answers) {
  const a = normalize(answers[0] || "");
  if (
    a.endsWith("する") || a.endsWith("させる") || a.endsWith("なる") ||
    a.endsWith("える") || a.endsWith("める") || a.endsWith("げる") ||
    a.endsWith("ける") || a.endsWith("せる") || a.endsWith("れる") ||
    a.endsWith("てる") || a.endsWith("つ") || a.endsWith("ぬ")
  ) return "動";
  if (
    a.endsWith("な") || a.endsWith("てきな") || a.endsWith("のある") ||
    (a.endsWith("い") && a.length > 2)
  ) return "形";
  if (a.endsWith("に") || a.endsWith("して")) return "副";
  return "名";
}

export function getCharHint(answers) {
  const jaAnswers = answers.filter(a => /[\u3041-\u9faf]/.test(a));
  const pool = jaAnswers.length > 0 ? jaAnswers : answers;
  return Math.min(...pool.map(a => a.length));
}

export function getEndingHint(answers) {
  const ja = answers.find(a => /[\u3041-\u3096]/.test(a));
  const target = ja || answers[0];
  if (target && target.length > 1) return target[target.length - 1];
  return null;
}

export function filterDisplayAnswers(answers) {
  return answers.filter(a => !(/^[\u3041-\u3096]+$/.test(a))).slice(0, 4);
}
