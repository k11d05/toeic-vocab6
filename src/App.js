import { useState, useEffect, useRef } from "react";
import { WORD_DB, SENTENCE_DB } from "./data";
import { shuffle, judgeAnswer, getPartOfSpeech, getCharHint, getEndingHint, filterDisplayAnswers } from "./utils";
import { getWrongAnswers, addWrongAnswer, getWrongCount } from "./storage";

// ─────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────
const C = {
  bg: "#0f172a",
  surface: "#1e293b",
  border: "#334155",
  muted: "#475569",
  sub: "#64748b",
  text: "#e2e8f0",
  accent: "#38bdf8",
  purple: "#818cf8",
  purpleLight: "#a5b4fc",
  green: "rgba(34,197,94,0.1)",
  greenBorder: "rgba(34,197,94,0.3)",
  greenText: "#4ade80",
  red: "rgba(239,68,68,0.1)",
  redBorder: "rgba(239,68,68,0.3)",
  redText: "#f87171",
};

// ─────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────
function PosTag({ pos }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 18, height: 18, border: `1.5px solid ${C.purple}`, borderRadius: 3,
      color: C.purple, fontSize: 10, fontWeight: 700, marginRight: 4, flexShrink: 0,
    }}>{pos}</span>
  );
}

function HintRow({ answers }) {
  const pos = getPartOfSpeech(answers);
  const charHint = getCharHint(answers);
  const endHint = getEndingHint(answers);
  const posLabel = { 動: "動詞", 形: "形容詞", 副: "副詞", 名: "名詞" }[pos] || "名詞";
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
      <div style={{ padding: "3px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center" }}>
        <PosTag pos={pos} />{posLabel}
      </div>
      <div style={{ padding: "3px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: "#94a3b8" }}>
        {charHint}文字〜
      </div>
      {endHint && (
        <div style={{ padding: "3px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: "#94a3b8" }}>
          〜<span style={{ color: C.purpleLight, fontWeight: 700 }}>{endHint}</span>
        </div>
      )}
    </div>
  );
}

function ExampleBox({ example }) {
  if (!example) return null;
  return (
    <div style={{ padding: 12, borderRadius: 12, background: "rgba(56,189,248,0.07)", border: `1px solid rgba(56,189,248,0.18)`, marginBottom: 10 }}>
      <div style={{ color: C.accent, fontSize: 10, marginBottom: 5, fontWeight: 600, letterSpacing: "0.06em" }}>例文</div>
      <div style={{ color: C.text, fontSize: 14, fontFamily: "'Lora', serif", lineHeight: 1.7 }}>{example.en}</div>
      <div style={{ color: C.sub, fontSize: 12, marginTop: 5 }}>{example.ja}</div>
    </div>
  );
}

function ResultCard({ correct }) {
  return (
    <div style={{ padding: 14, borderRadius: 12, background: correct ? C.green : C.red, border: `1px solid ${correct ? C.greenBorder : C.redBorder}`, marginBottom: 10 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: correct ? C.greenText : C.redText }}>
        {correct ? "✓ 正解" : "✗ 不正解"}
      </div>
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", style: s = {} }) {
  const base = { width: "100%", padding: "14px", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", marginBottom: 8, ...s };
  const styles = {
    primary: { background: disabled ? C.surface : `linear-gradient(135deg, ${C.accent}, ${C.purple})`, color: disabled ? C.muted : "#0f172a" },
    secondary: { background: C.surface, border: `1px solid ${C.border}`, color: C.text },
    ghost: { background: "transparent", border: `1px solid ${C.border}`, color: C.sub },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...styles[variant] }}>{children}</button>;
}

function AnswerInput({ value, onChange, onSubmit }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === "Enter" && onSubmit()}
      placeholder="日本語で答える..."
      style={{ width: "100%", padding: "14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 17, outline: "none", boxSizing: "border-box", marginBottom: 10, WebkitAppearance: "none" }}
    />
  );
}

// ─────────────────────────────────────────
// QUIZ ENGINE (shared by word/sentence/review)
// ─────────────────────────────────────────
function WordQuiz({ questions, mode, level, isReview, onComplete, onQuit }) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // null | { correct: bool }
  const [score, setScore] = useState(0);

  const q = questions[idx];

  function handleSubmit(skipped = false) {
    if (!skipped && !input.trim()) return;
    const correct = skipped ? false : judgeAnswer(input.trim(), q.answers);
    setResult({ correct });
    if (correct) {
      setScore(s => s + 1);
    } else {
      addWrongAnswer(mode, level, q);
    }
  }

  function handleNext() {
    if (idx + 1 >= questions.length) onComplete(score + (result?.correct ? 0 : 0), score);
    else { setIdx(i => i + 1); setInput(""); setResult(null); }
  }

  if (!q) return null;

  const displayAnswers = filterDisplayAnswers(q.answers);

  return (
    <div>
      <div style={{ color: C.sub, fontSize: 12, marginBottom: 10, textAlign: "center" }}>{idx + 1} / {questions.length}</div>

      {/* 単語 */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 42, fontWeight: 800, fontFamily: "'Playfair Display', serif", color: C.text, letterSpacing: "-1px" }}>{q.word}</div>
        {isReview && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>復習</div>}
      </div>

      <HintRow answers={q.answers} />

      {!result ? (
        <div style={{ marginTop: 14 }}>
          <AnswerInput value={input} onChange={setInput} onSubmit={() => handleSubmit(false)} />
          <Btn onClick={() => handleSubmit(false)} disabled={!input.trim()}>答える</Btn>
          <Btn onClick={() => handleSubmit(true)} variant="ghost">わからない</Btn>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <ResultCard correct={result.correct} />
          <ExampleBox example={q.example} />
          <div style={{ padding: 12, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 10 }}>
            <div style={{ color: C.sub, fontSize: 10, marginBottom: 6 }}>正解の意味</div>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{displayAnswers.join(" / ")}</div>
            {q.related?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ color: C.sub, fontSize: 10, marginBottom: 5 }}>派生語</div>
                {q.related.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                    <PosTag pos={r.pos} />
                    <span style={{ color: C.purpleLight, fontSize: 13 }}>{r.word}</span>
                    <span style={{ color: C.sub, fontSize: 12, marginLeft: 4 }}>（{r.meaning}）</span>
                  </div>
                ))}
              </div>
            )}
            {q.synonyms?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: C.sub, fontSize: 10, marginBottom: 4 }}>類義語</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>{q.synonyms.join(" / ")}</div>
              </div>
            )}
          </div>
          <Btn onClick={handleNext} variant="secondary">{idx + 1 >= questions.length ? "結果を見る →" : "次の問題 →"}</Btn>
        </div>
      )}
    </div>
  );
}

function SentenceQuiz({ questions, mode, level, isReview, onComplete, onQuit }) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);

  const q = questions[idx];

  function handleSubmit(skipped = false) {
    if (!skipped && !input.trim()) return;
    const correct = skipped ? false : judgeAnswer(input.trim(), q.answers);
    setResult({ correct });
    if (correct) setScore(s => s + 1);
    else addWrongAnswer(mode, level, q);
  }

  function handleNext() {
    if (idx + 1 >= questions.length) onComplete(score);
    else { setIdx(i => i + 1); setInput(""); setResult(null); }
  }

  if (!q) return null;

  const parts = q.sentence.split(q.targetWord);
  const displayAnswers = filterDisplayAnswers(q.answers);

  return (
    <div>
      <div style={{ color: C.sub, fontSize: 12, marginBottom: 10, textAlign: "center" }}>{idx + 1} / {questions.length}</div>

      {/* 例文（対象単語をハイライト・文中に自然に配置） */}
      <div style={{ fontSize: 15, lineHeight: 1.9, color: C.text, fontFamily: "'Lora', serif", padding: "14px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 10 }}>
        {parts[0]}
        <span style={{ background: "rgba(129,140,248,0.2)", borderBottom: `2px solid ${C.purple}`, padding: "1px 2px", borderRadius: 3, color: C.purpleLight, fontWeight: 700 }}>
          {q.targetWord}
        </span>
        {parts[1]}
      </div>

      {/* ヒントは問題画面のみ */}
      {!result && <HintRow answers={q.answers} />}

      {!result ? (
        <div style={{ marginTop: 12 }}>
          <AnswerInput value={input} onChange={setInput} onSubmit={() => handleSubmit(false)} />
          <Btn onClick={() => handleSubmit(false)} disabled={!input.trim()}>答える</Btn>
          <Btn onClick={() => handleSubmit(true)} variant="ghost">わからない</Btn>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <ResultCard correct={result.correct} />

          {/* 正解・不正解どちらでも例文の日本語訳を表示 */}
          <ExampleBox example={q.example} />

          <div style={{ padding: 12, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 10 }}>
            <div style={{ color: C.sub, fontSize: 10, marginBottom: 5 }}>この文脈での意味</div>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{displayAnswers.slice(0, 3).join(" / ")}</div>
          </div>

          {/* 難しい単語の注釈は正解発表後のみ */}
          {q.hardWords?.length > 0 && (
            <div style={{ padding: 12, borderRadius: 12, background: "#0f172a", border: `1px solid ${C.surface}`, marginBottom: 10 }}>
              <div style={{ color: C.sub, fontSize: 10, marginBottom: 6 }}>単語メモ</div>
              {q.hardWords.map((hw, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: C.accent }}>{hw.word}</span>
                  <span style={{ color: C.muted }}> = {hw.meaning}</span>
                </div>
              ))}
            </div>
          )}

          <Btn onClick={handleNext} variant="secondary">{idx + 1 >= questions.length ? "結果を見る →" : "次の問題 →"}</Btn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SCORE SCREEN
// ─────────────────────────────────────────
function ScoreScreen({ score, total, onHome }) {
  const pct = Math.round((score / total) * 100);
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 70, fontWeight: 800, fontFamily: "'Playfair Display', serif", background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{pct}%</div>
      <div style={{ color: "#94a3b8", marginTop: 8, fontSize: 15 }}>{total}問中 {score}問正解</div>
      <div style={{ marginTop: 20, color: C.text, fontSize: 18, fontWeight: 600 }}>
        {pct >= 80 ? "素晴らしい！" : pct >= 60 ? "もう少し！" : "復習しよう"}
      </div>
      <div style={{ marginTop: 36 }}>
        <Btn onClick={onHome}>ホームに戻る</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────
const SCORE_OPTIONS = [600, 730, 860];

export default function App() {
  // phase: home | select_type | select_level | select_mode | quiz | result
  const [phase, setPhase] = useState("home");
  const [quizType, setQuizType] = useState(null);   // "normal" | "review"
  const [scoreLevel, setScoreLevel] = useState(null);
  const [mode, setMode] = useState(null);            // "word" | "sentence"
  const [questions, setQuestions] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const [wrongCounts, setWrongCounts] = useState({ word: {}, sentence: {} });

  // 復習問題数をリアルタイム反映
  useEffect(() => {
    const data = getWrongAnswers();
    const counts = { word: {}, sentence: {} };
    for (const m of ["word", "sentence"]) {
      for (const lv of SCORE_OPTIONS) {
        counts[m][lv] = data[m][lv]?.length || 0;
      }
    }
    setWrongCounts(counts);
  }, [phase]);

  function goHome() { setPhase("home"); setQuizType(null); setScoreLevel(null); setMode(null); setQuestions([]); setFinalScore(0); }

  function startQuiz() {
    let pool;
    if (quizType === "review") {
      const data = getWrongAnswers();
      pool = data[mode][scoreLevel] || [];
    } else {
      const db = mode === "word" ? WORD_DB : SENTENCE_DB;
      pool = db[scoreLevel] || [];
    }
    if (pool.length === 0) { alert("問題がありません"); return; }
    setQuestions(shuffle(pool).slice(0, 10));
    setPhase("quiz");
  }

  function handleComplete(score) { setFinalScore(score); setPhase("result"); }

  // ── HEADER ──────────────────────────────
  const showQuit = phase === "quiz";

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 32 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=Lora&display=swap" rel="stylesheet" />

      {/* GLOBAL HEADER */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "env(safe-area-inset-top, 16px) 18px 12px", position: "relative", boxSizing: "border-box" }}>
        {showQuit && (
          <button onClick={goHome} style={{ position: "absolute", left: 18, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontSize: 12, padding: "5px 11px", cursor: "pointer" }}>
            ← やめる
          </button>
        )}
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: C.accent, fontWeight: 700 }}>TOEIC VOCAB</div>
      </div>

      {/* CONTENT */}
      <div style={{ width: "100%", maxWidth: 480, padding: "0 18px", boxSizing: "border-box", flex: 1 }}>

        {/* ── HOME ── */}
        {phase === "home" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Playfair Display', serif", background: `linear-gradient(135deg, ${C.text} 30%, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>単語トレーニング</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>モードを選択</div>
              <Btn onClick={() => { setQuizType("normal"); setPhase("select_level"); }} variant="secondary">通常モード</Btn>
              <Btn onClick={() => { setQuizType("review"); setPhase("select_level"); }} variant="secondary">
                復習モード
                <span style={{ fontSize: 11, color: C.sub, marginLeft: 8 }}>間違えた問題のみ</span>
              </Btn>
            </div>
          </div>
        )}

        {/* ── SELECT LEVEL ── */}
        {phase === "select_level" && (
          <div>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 10 }}>目標スコアを選択</div>
            {SCORE_OPTIONS.map(lv => (
              <Btn key={lv} onClick={() => { setScoreLevel(lv); setPhase("select_mode"); }} variant="secondary">
                〜{lv}点
              </Btn>
            ))}
            <Btn onClick={() => setPhase("home")} variant="ghost">← 戻る</Btn>
          </div>
        )}

        {/* ── SELECT MODE ── */}
        {phase === "select_mode" && (
          <div>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 10 }}>問題形式を選択</div>
            {[
              { value: "word", label: "単語モード", desc: "英単語→日本語" },
              { value: "sentence", label: "例文モード", desc: "文脈から意味を答える" },
            ].map(m => {
              const count = quizType === "review" ? (wrongCounts[m.value][scoreLevel] || 0) : null;
              const disabled = quizType === "review" && count === 0;
              return (
                <Btn key={m.value} onClick={() => { if (!disabled) { setMode(m.value); setPhase("quiz_ready"); } }} variant="secondary" disabled={disabled}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.label}</div>
                      <div style={{ color: C.sub, fontSize: 11 }}>{m.desc}</div>
                    </div>
                    {quizType === "review" && (
                      <div style={{ color: disabled ? C.muted : C.accent, fontSize: 12 }}>
                        {count}問
                      </div>
                    )}
                  </div>
                </Btn>
              );
            })}
            <Btn onClick={() => setPhase("select_level")} variant="ghost">← 戻る</Btn>
          </div>
        )}

        {/* ── QUIZ READY → immediately start ── */}
        {phase === "quiz_ready" && (() => {
          // auto-start
          let pool;
          if (quizType === "review") {
            const data = getWrongAnswers();
            pool = data[mode][scoreLevel] || [];
          } else {
            const db = mode === "word" ? WORD_DB : SENTENCE_DB;
            pool = db[scoreLevel] || [];
          }
          const qs = shuffle(pool).slice(0, 10);
          if (qs.length === 0) { goHome(); return null; }
          // set and jump to quiz
          setTimeout(() => { setQuestions(qs); setPhase("quiz"); }, 0);
          return <div style={{ color: C.sub, textAlign: "center", marginTop: 40 }}>準備中...</div>;
        })()}

        {/* ── QUIZ ── */}
        {phase === "quiz" && questions.length > 0 && (
          mode === "word"
            ? <WordQuiz questions={questions} mode="word" level={scoreLevel} isReview={quizType === "review"} onComplete={handleComplete} onQuit={goHome} />
            : <SentenceQuiz questions={questions} mode="sentence" level={scoreLevel} isReview={quizType === "review"} onComplete={handleComplete} onQuit={goHome} />
        )}

        {/* ── RESULT ── */}
        {phase === "result" && <ScoreScreen score={finalScore} total={questions.length} onHome={goHome} />}
      </div>
    </div>
  );
}
