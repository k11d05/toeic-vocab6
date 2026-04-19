const KEY = "toeic_wrong_answers";

export function getWrongAnswers() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { word: { 600: [], 730: [], 860: [] }, sentence: { 600: [], 730: [], 860: [] } };
  } catch {
    return { word: { 600: [], 730: [], 860: [] }, sentence: { 600: [], 730: [], 860: [] } };
  }
}

export function addWrongAnswer(mode, level, item) {
  const data = getWrongAnswers();
  const list = data[mode][level];
  // 重複を避ける（同じ単語はひとつだけ保持）
  const exists = list.some(q => q.word === item.word);
  if (!exists) {
    list.push(item);
    data[mode][level] = list;
    localStorage.setItem(KEY, JSON.stringify(data));
  }
}

export function removeWrongAnswer(mode, level, word) {
  const data = getWrongAnswers();
  data[mode][level] = data[mode][level].filter(q => q.word !== word);
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearWrongAnswers(mode, level) {
  const data = getWrongAnswers();
  data[mode][level] = [];
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getWrongCount(mode, level) {
  const data = getWrongAnswers();
  return data[mode]?.[level]?.length || 0;
}
