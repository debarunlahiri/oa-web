"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WorkStyleInventory from "../components/WorkStyleInventory";
import ThemeToggle from "../components/ThemeToggle";
import { assessmentQuestions } from "../data/assessmentQuestions";
import {
  calculateResult,
  createAttempt,
  remainingMs,
} from "../lib/assessmentEngine";
import { Attempt, Category, Difficulty, OptionId } from "../lib/types";

const STORAGE = "hiring-judgement-attempt-v1";
type View = "home" | "instructions" | "assessment" | "results" | "workstyle";
type ReviewStatus = "All" | "Correct" | "Incorrect" | "Unanswered" | "Marked";

const formatTime = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

function Brand({ onHome }: { onHome: () => void }) {
  return (
    <a
      className="brand"
      href="/"
      onClick={(e) => {
        e.preventDefault();
        onHome();
        window.scrollTo(0, 0);
      }}
      aria-label="Go to practice overview"
    >
      <span className="brandMark">HJ</span>
      <span>
        Hiring Judgement
        <br />
        <b>Practice</b>
      </span>
    </a>
  );
}

function Disclaimer() {
  return (
    <p className="disclaimer">
      <span aria-hidden="true">ⓘ</span> Independent practice experience. Not
      affiliated with or endorsed by Google or any other company. Questions are
      original.
    </p>
  );
}

function Modal({
  title,
  children,
  confirm,
  cancel,
  confirmLabel,
}: {
  title: string;
  children: React.ReactNode;
  confirm: () => void;
  cancel: () => void;
  confirmLabel: string;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);
  return (
    <div
      className="modalBackdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && cancel()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="modalClose"
          onClick={cancel}
          aria-label="Close dialog"
        >
          ×
        </button>
        <div className="modalIcon" aria-hidden="true">
          ?
        </div>
        <h2 id="modal-title">{title}</h2>
        {children}
        <div className="modalActions">
          <button ref={cancelRef} className="button secondary" onClick={cancel}>
            Continue practice
          </button>
          <button className="button danger" onClick={confirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [retakeOpen, setRetakeOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("All");
  const [reviewCategory, setReviewCategory] = useState<"All" | Category>("All");
  const [reviewDifficulty, setReviewDifficulty] = useState<"All" | Difficulty>(
    "All",
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Attempt;
        setAttempt(parsed);
        setView(parsed.status === "active" ? "assessment" : "home");
      } catch {
        localStorage.removeItem(STORAGE);
      }
    }
  }, []);

  useEffect(() => {
    if (attempt) localStorage.setItem(STORAGE, JSON.stringify(attempt));
  }, [attempt]);

  const submit = () => {
    setAttempt((current) =>
      current && current.status === "active"
        ? { ...current, status: "submitted", submittedAt: Date.now() }
        : current,
    );
    setSubmitOpen(false);
    setView("results");
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (view !== "assessment" || !attempt || attempt.status !== "active")
      return;
    const interval = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (remainingMs(attempt, time) <= 0) submit();
    }, 1000);
    return () => window.clearInterval(interval);
  }, [view, attempt]);

  const start = () => {
    setAttempt(createAttempt(assessmentQuestions));
    setView("assessment");
    setNow(Date.now());
  };
  const retake = () => {
    localStorage.removeItem(STORAGE);
    setAttempt(null);
    setAccepted(false);
    setRetakeOpen(false);
    setView("instructions");
    window.scrollTo(0, 0);
  };

  if (view === "workstyle")
    return <WorkStyleInventory onBack={() => setView("home")} />;

  if (view === "home")
    return (
      <main className="landing">
        <header className="topbar">
          <Brand onHome={() => setView("home")} />
          <div className="headerTools">
            <ThemeToggle />
            <span className="statusPill">
              <i /> Judgement practice
            </span>
          </div>
        </header>
        <section className="hero">
          <div className="heroCopy">
            <div className="eyebrow">
              Workplace judgement · Professional practice
            </div>
            <h1>
              Better decisions begin with <em>better judgement.</em>
            </h1>
            <p className="heroLead">
              Practice the decisions and work-style choices that shape trusted,
              high-performing technology teams.
            </p>
            <div className="heroActions">
              <button
                className="button primary large"
                onClick={() => setView("instructions")}
              >
                Judgement practice <span>→</span>
              </button>
              <button
                className="button secondary large"
                onClick={() => setView("workstyle")}
              >
                Work style inventory
              </button>
            </div>
            <p className="restoreNote">
              Both modules save progress automatically on this device.
            </p>
          </div>
          <div className="previewCard" aria-label="Practice overview">
            <div className="previewTop">
              <span>Practice overview</span>
              <b>Ready</b>
            </div>
            <div className="previewBody">
              <p>
                Question 01 <span>of 50</span>
              </p>
              <h3>
                Your team discovers a material issue shortly before a planned
                release. What is your best first step?
              </h3>
              <div className="mockOption">
                <span>A</span> Gather facts, assess impact, and align on a safe
                response.
              </div>
              <div className="mockOption muted">
                <span>B</span> Continue as planned and investigate after
                release.
              </div>
              <div className="mockOption muted">
                <span>C</span> Escalate immediately without further context.
              </div>
            </div>
            <div className="previewFooter">
              <span>Progress</span>
              <div>
                <i />
              </div>
              <b>1 / 50</b>
            </div>
          </div>
        </section>
        <section
          className="moduleChoice"
          aria-label="Available practice modules"
        >
          <article>
            <span>01 · Timed</span>
            <h2>Judgement practice</h2>
            <p>
              50 realistic workplace scenarios for high-standard global
              technology roles. Choose the strongest professional action from
              four plausible responses.
            </p>
            <div>
              <b>50 scenarios</b>
              <b>30 minutes</b>
              <b>Scored / 100</b>
            </div>
            <button
              className="button primary"
              onClick={() => setView("instructions")}
            >
              Start judgement practice →
            </button>
          </article>
          <article>
            <span>02 · Google-inspired · Untimed</span>
            <h2>Technology work style inventory</h2>
            <p>
              120 original, nuanced statements reflecting work styles relevant
              to Google-type roles, rated from Strongly Disagree to Strongly
              Agree.
            </p>
            <div>
              <b>120 statements</b>
              <b>5-point scale</b>
              <b>Reflective profile</b>
            </div>
            <button
              className="button secondary"
              onClick={() => setView("workstyle")}
            >
              Open work style inventory →
            </button>
          </article>
        </section>
        <section className="facts" aria-label="Practice facts">
          <div>
            <b>170</b>
            <span>original prompts</span>
          </div>
          <div>
            <b>2</b>
            <span>practice modules</span>
          </div>
          <div>
            <b>10</b>
            <span>work style areas</span>
          </div>
          <div>
            <b>0</b>
            <span>official questions</span>
          </div>
        </section>
        <section className="competencies">
          <div>
            <span className="sectionNo">01</span>
            <h2>What this practice evaluates</h2>
            <p>
              Professional judgement across the moments that matter most in
              modern technology work.
            </p>
          </div>
          <div className="competencyGrid">
            {[
              "Integrity & ethics",
              "Ownership",
              "Collaboration",
              "Communication",
              "Problem-solving",
              "User focus",
              "Prioritization",
              "Adaptability",
              "Security",
              "Leadership",
            ].map((item, i) => (
              <span key={item}>
                <i>{String(i + 1).padStart(2, "0")}</i>
                {item}
              </span>
            ))}
          </div>
        </section>
        <footer>
          <Disclaimer />
        </footer>
      </main>
    );

  if (view === "instructions")
    return (
      <main className="shell">
        <header className="topbar">
          <Brand onHome={() => setView("home")} />
          <div className="headerTools">
            <ThemeToggle />
            <span className="statusPill">
              <i /> Before you begin
            </span>
          </div>
        </header>
        <section className="instructions">
          <div className="stepLabel">Step 1 of 2</div>
          <h1>
            Set yourself up
            <br />
            for a focused session.
          </h1>
          <p className="intro">
            Read the guidance below. The timer begins only after you confirm and
            start.
          </p>
          <div className="instructionStats">
            <div>
              <strong>50</strong>
              <span>Total questions</span>
            </div>
            <div>
              <strong>30:00</strong>
              <span>Time limit</span>
            </div>
            <div>
              <strong>100</strong>
              <span>Maximum score</span>
            </div>
          </div>
          <section className="instructionCard">
            <h2>How it works</h2>
            <div className="instructionList">
              {[
                [
                  "Choose one best answer",
                  "Each scenario has four plausible options. Select the strongest overall professional response.",
                ],
                [
                  "Move freely",
                  "Go forward or backward, change answers, clear a response, or mark questions for review.",
                ],
                [
                  "Manage your time",
                  "The timer remains visible. Warnings appear at five minutes and one minute remaining.",
                ],
                [
                  "Submit when ready",
                  "Unanswered questions score zero. Correct answers and explanations appear only after submission.",
                ],
                [
                  "Progress is protected",
                  "Answers, order, review marks, and the original start time survive an accidental refresh.",
                ],
              ].map(([title, text], i) => (
                <div key={title}>
                  <span>{i + 1}</span>
                  <p>
                    <b>{title}</b>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <label className="accept">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span aria-hidden="true">✓</span>
            <p>
              <b>I have read and understood the instructions.</b>
              <small>I am ready to begin the 30-minute practice.</small>
            </p>
          </label>
          <button
            className="button primary full"
            disabled={!accepted}
            onClick={start}
          >
            Begin practice <span>→</span>
          </button>
          <button className="textButton" onClick={() => setView("home")}>
            ← Back to overview
          </button>
        </section>
        <footer>
          <Disclaimer />
        </footer>
      </main>
    );

  if (view === "assessment" && attempt) {
    const q = attempt.questions[attempt.current];
    const answered = Object.keys(attempt.answers).length;
    const left = remainingMs(attempt, now);
    const warning =
      left <= 60000 ? "critical" : left <= 300000 ? "warning" : "";
    const update = (next: Partial<Attempt>) =>
      setAttempt({ ...attempt, ...next });
    const go = (index: number) => {
      update({ current: index });
      setNavigatorOpen(false);
      window.scrollTo(0, 0);
    };
    return (
      <main className="assessment">
        <header className="assessmentHeader">
          <Brand onHome={() => setView("home")} />
          <div className="assessmentHeaderTools">
            <ThemeToggle />
            <div
              className={`timer ${warning}`}
              role="timer"
              aria-live={warning ? "polite" : "off"}
            >
              <span>Time remaining</span>
              <b>{formatTime(left)}</b>
            </div>
            <button
              className="navToggle"
              onClick={() => setNavigatorOpen(!navigatorOpen)}
              aria-expanded={navigatorOpen}
            >
              Questions <b>{answered}/50</b>
            </button>
          </div>
        </header>
        <div className="progressLine">
          <i style={{ width: `${answered * 2}%` }} />
        </div>
        <div className="assessmentLayout">
          <section className="questionPane">
            <div className="questionMeta">
              <span>
                Question {String(attempt.current + 1).padStart(2, "0")}{" "}
                <i>/ 50</i>
              </span>
              <div>
                <b>{q.category}</b>
                <em>{q.difficulty}</em>
              </div>
            </div>
            <h1>{q.question}</h1>
            <fieldset className="options">
              <legend>Select one best answer</legend>
              {q.options.map((o) => (
                <label
                  className={attempt.answers[q.id] === o.id ? "selected" : ""}
                  key={o.id}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={attempt.answers[q.id] === o.id}
                    onChange={() =>
                      update({ answers: { ...attempt.answers, [q.id]: o.id } })
                    }
                  />
                  <span>{o.id}</span>
                  <p>{o.text}</p>
                  <i aria-hidden="true">✓</i>
                </label>
              ))}
            </fieldset>
            <div className="questionTools">
              <button
                onClick={() =>
                  update({
                    marked: attempt.marked.includes(q.id)
                      ? attempt.marked.filter((id) => id !== q.id)
                      : [...attempt.marked, q.id],
                  })
                }
                className={attempt.marked.includes(q.id) ? "active" : ""}
              >
                ⚑{" "}
                {attempt.marked.includes(q.id)
                  ? "Marked for review"
                  : "Mark for review"}
              </button>
              <button
                disabled={!attempt.answers[q.id]}
                onClick={() => {
                  const answers = { ...attempt.answers };
                  delete answers[q.id];
                  update({ answers });
                }}
              >
                × Clear response
              </button>
            </div>
            <div className="questionActions">
              <button
                className="button secondary"
                disabled={attempt.current === 0}
                onClick={() => go(attempt.current - 1)}
              >
                ← Previous
              </button>
              {attempt.current < 49 ? (
                <button
                  className="button primary"
                  onClick={() => go(attempt.current + 1)}
                >
                  Save & next →
                </button>
              ) : (
                <button
                  className="button primary"
                  onClick={() => setSubmitOpen(true)}
                >
                  Review & submit →
                </button>
              )}
            </div>
          </section>
          <aside className={`navigator ${navigatorOpen ? "open" : ""}`}>
            <div className="navHead">
              <p>
                <b>Question navigator</b>
                <span>
                  {answered} answered · {50 - answered} remaining
                </span>
              </p>
              <button
                onClick={() => setNavigatorOpen(false)}
                aria-label="Close question navigator"
              >
                ×
              </button>
            </div>
            <div className="navGrid">
              {attempt.questions.map((question, index) => {
                const isAnswered = !!attempt.answers[question.id],
                  isMarked = attempt.marked.includes(question.id);
                return (
                  <button
                    key={question.id}
                    onClick={() => go(index)}
                    className={`${index === attempt.current ? "current" : ""} ${isAnswered ? "answered" : ""} ${isMarked ? "marked" : ""}`}
                    aria-label={`Question ${index + 1}: ${isAnswered ? "answered" : "unanswered"}${isMarked ? ", marked for review" : ""}`}
                  >
                    <span>{index + 1}</span>
                    {isAnswered && <i>✓</i>}
                    {isMarked && <em>⚑</em>}
                  </button>
                );
              })}
            </div>
            <div className="legend">
              <span>
                <i className="answeredDot" />
                Answered
              </span>
              <span>
                <i />
                Unanswered
              </span>
              <span>
                <i className="reviewDot">⚑</i>Review
              </span>
            </div>
            <div className="navSummary">
              <div>
                <span>Answered</span>
                <b>{answered}</b>
              </div>
              <div>
                <span>Unanswered</span>
                <b>{50 - answered}</b>
              </div>
              <div>
                <span>For review</span>
                <b>{attempt.marked.length}</b>
              </div>
            </div>
            <button
              className="button submitButton"
              onClick={() => setSubmitOpen(true)}
            >
              Submit responses
            </button>
          </aside>
        </div>
        {submitOpen && (
          <Modal
            title="Submit your responses?"
            cancel={() => setSubmitOpen(false)}
            confirm={submit}
            confirmLabel="Submit final answers"
          >
            <div className="submitStats">
              <div>
                <b>{answered}</b>
                <span>Answered</span>
              </div>
              <div>
                <b>{50 - answered}</b>
                <span>Unanswered</span>
              </div>
              <div>
                <b>{attempt.marked.length}</b>
                <span>For review</span>
              </div>
            </div>
            <p className="modalNote">
              You have <b>{formatTime(left)}</b> remaining. After submission,
              answers are locked and your score is final.
            </p>
          </Modal>
        )}
      </main>
    );
  }

  if (view === "results" && attempt) {
    const result = calculateResult(attempt);
    const filtered = attempt.questions.filter((q) => {
      const answer = attempt.answers[q.id],
        correct = answer === q.correctAnswer;
      return (
        (reviewStatus === "All" ||
          (reviewStatus === "Correct" && correct) ||
          (reviewStatus === "Incorrect" && !!answer && !correct) ||
          (reviewStatus === "Unanswered" && !answer) ||
          (reviewStatus === "Marked" && attempt.marked.includes(q.id))) &&
        (reviewCategory === "All" || q.category === reviewCategory) &&
        (reviewDifficulty === "All" || q.difficulty === reviewDifficulty) &&
        q.question.toLowerCase().includes(query.toLowerCase())
      );
    });
    return (
      <main className="results">
        <header className="topbar">
          <Brand onHome={() => setView("home")} />
          <div className="headerTools">
            <ThemeToggle />
            <button
              className="button secondary compact"
              onClick={() => setRetakeOpen(true)}
            >
              ↻ Try again
            </button>
          </div>
        </header>
        <section className="resultHero">
          <div className="resultEyebrow">Practice complete</div>
          <div className="scoreRing">
            <strong>{result.score}</strong>
            <span>/ 100</span>
          </div>
          <h1>{result.band}</h1>
          <p>
            Your results reflect this independent practice attempt, not any
            company&apos;s hiring criteria.
          </p>
          <div className="resultMetrics">
            <div>
              <b>{result.correct}</b>
              <span>Correct</span>
            </div>
            <div>
              <b>{result.incorrect}</b>
              <span>Incorrect</span>
            </div>
            <div>
              <b>{result.unanswered}</b>
              <span>Unanswered</span>
            </div>
            <div>
              <b>{result.accuracy}%</b>
              <span>Accuracy</span>
            </div>
            <div>
              <b>{result.completion}%</b>
              <span>Completion</span>
            </div>
            <div>
              <b>{formatTime(result.usedMs)}</b>
              <span>Time used</span>
            </div>
            <div>
              <b>{result.averageSeconds}s</b>
              <span>Avg. / answered</span>
            </div>
          </div>
        </section>
        <section className="resultSection">
          <div className="sectionHeading">
            <span>01</span>
            <div>
              <h2>Competency breakdown</h2>
              <p>
                Performance across the professional judgement areas in this
                practice.
              </p>
            </div>
          </div>
          <div className="breakdown">
            {result.breakdown.map((row) => (
              <div key={row.category}>
                <p>
                  <b>{row.category}</b>
                  <span>
                    {row.correct} / {row.total} correct
                  </span>
                </p>
                <div>
                  <i style={{ width: `${row.percentage}%` }} />
                </div>
                <strong>{row.percentage}%</strong>
              </div>
            ))}
          </div>
          <div className="strengthCards">
            <div>
              <span>↑ Strongest areas</span>
              {result.strongest.map((x) => (
                <p key={x.category}>
                  <b>{x.category}</b>
                  <em>{x.percentage}%</em>
                </p>
              ))}
            </div>
            <div>
              <span>↗ Focus next</span>
              {result.improve.map((x) => (
                <p key={x.category}>
                  <b>{x.category}</b>
                  <em>{x.percentage}%</em>
                </p>
              ))}
            </div>
          </div>
        </section>
        <section className="resultSection review">
          <div className="sectionHeading">
            <span>02</span>
            <div>
              <h2>Review answers</h2>
              <p>
                Compare your choices with the strongest response and its
                reasoning.
              </p>
            </div>
          </div>
          <div className="filters">
            <input
              aria-label="Search review questions"
              placeholder="Search question text…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Filter by result"
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
            >
              {["All", "Correct", "Incorrect", "Unanswered", "Marked"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
            <select
              aria-label="Filter by category"
              value={reviewCategory}
              onChange={(e) =>
                setReviewCategory(e.target.value as typeof reviewCategory)
              }
            >
              <option>All</option>
              {[...new Set(attempt.questions.map((q) => q.category))].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
            <select
              aria-label="Filter by difficulty"
              value={reviewDifficulty}
              onChange={(e) =>
                setReviewDifficulty(e.target.value as typeof reviewDifficulty)
              }
            >
              <option>All</option>
              <option>Medium</option>
              <option>Difficult</option>
              <option>Very Difficult</option>
            </select>
          </div>
          <p className="filterCount">{filtered.length} questions shown</p>
          <div className="reviewList">
            {filtered.map((q) => {
              const selected = attempt.answers[q.id],
                correct = selected === q.correctAnswer;
              return (
                <details key={q.id}>
                  <summary>
                    <span
                      className={
                        correct
                          ? "correct"
                          : selected
                            ? "incorrect"
                            : "unanswered"
                      }
                    >
                      {correct ? "✓" : selected ? "×" : "—"}
                    </span>
                    <p>
                      <small>
                        Question {attempt.questions.indexOf(q) + 1} ·{" "}
                        {q.category} · {q.difficulty}
                      </small>
                      <b>
                        {selected ? `Your answer: ${selected}` : "Not Answered"}
                      </b>
                    </p>
                    <i>⌄</i>
                  </summary>
                  <div className="reviewBody">
                    <h3>{q.question}</h3>
                    {q.options.map((o) => (
                      <div
                        key={o.id}
                        className={`${o.id === q.correctAnswer ? "right" : ""} ${o.id === selected && o.id !== q.correctAnswer ? "wrong" : ""}`}
                      >
                        <span>{o.id}</span>
                        <p>{o.text}</p>
                        {o.id === q.correctAnswer && <b>Correct answer</b>}
                        {o.id === selected && <em>Your answer</em>}
                      </div>
                    ))}
                    <section>
                      <b>Why this is the strongest response</b>
                      <p>{q.explanation}</p>
                      <small>Competency: {q.competency}</small>
                    </section>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
        <footer>
          <Disclaimer />
        </footer>
        {retakeOpen && (
          <Modal
            title="Start a new attempt?"
            cancel={() => setRetakeOpen(false)}
            confirm={retake}
            confirmLabel="Clear & retake"
          >
            <p className="modalNote">
              This clears your answers, result, timer, and saved question order.
              Your next attempt will use a newly shuffled order.
            </p>
          </Modal>
        )}
      </main>
    );
  }
  return null;
}
