"use client";

import { useEffect, useMemo, useState } from "react";
import {
  workStyleStatements,
  WorkStyleStatement,
} from "../data/workStyleStatements";
import ThemeToggle from "./ThemeToggle";

type Rating = 1 | 2 | 3 | 4 | 5;
type SavedState = {
  status: "active" | "submitted";
  startedAt: number;
  submittedAt?: number;
  order: WorkStyleStatement[];
  answers: Record<number, Rating>;
  current: number;
};

const STORE = "workplace-style-inventory-google-inspired-v3";
const TOTAL = workStyleStatements.length;
const labels: Array<{ value: Rating; label: string }> = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const scoreFor = (statement: WorkStyleStatement, rating: Rating) =>
  statement.direction === "positive" ? rating : 6 - rating;

export default function WorkStyleInventory({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState<"intro" | "active" | "results">("intro");
  const [accepted, setAccepted] = useState(false);
  const [state, setState] = useState<SavedState | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORE);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as SavedState;
      setState(saved);
      setScreen(saved.status === "active" ? "active" : "intro");
    } catch {
      localStorage.removeItem(STORE);
    }
  }, []);
  useEffect(() => {
    if (state) localStorage.setItem(STORE, JSON.stringify(state));
  }, [state]);

  const begin = () => {
    setState({
      status: "active",
      startedAt: Date.now(),
      order: shuffle(workStyleStatements),
      answers: {},
      current: 0,
    });
    setScreen("active");
  };
  const submit = () => {
    setState((s) =>
      s ? { ...s, status: "submitted", submittedAt: Date.now() } : s,
    );
    setConfirming(false);
    setScreen("results");
    window.scrollTo(0, 0);
  };
  const restart = () => {
    localStorage.removeItem(STORE);
    setState(null);
    setAccepted(false);
    setScreen("intro");
    window.scrollTo(0, 0);
  };

  const result = useMemo(() => {
    if (!state) return null;
    const competencies = [...new Set(state.order.map((s) => s.competency))];
    const breakdown = competencies.map((competency) => {
      const items = state.order.filter(
        (s) => s.competency === competency && state.answers[s.id],
      );
      const points = items.reduce(
        (sum, item) => sum + scoreFor(item, state.answers[item.id] as Rating),
        0,
      );
      return {
        competency,
        answered: items.length,
        percentage: items.length
          ? Math.round(((points - items.length) / (items.length * 4)) * 100)
          : 0,
      };
    });
    const paired = [...new Set(state.order.map((s) => s.pairId))]
      .map((pairId) => {
        const items = state.order.filter(
          (s) => s.pairId === pairId && state.answers[s.id],
        );
        if (items.length < 2) return null;
        const values = items.map((item) =>
          scoreFor(item, state.answers[item.id] as Rating),
        );
        return Math.max(...values) - Math.min(...values);
      })
      .filter((x): x is number => x !== null);
    const consistency = paired.length
      ? Math.max(
          0,
          Math.round(
            100 -
              (paired.reduce((a, b) => a + b, 0) / (paired.length * 4)) * 100,
          ),
        )
      : 0;
    return {
      breakdown,
      consistency,
      answered: Object.keys(state.answers).length,
    };
  }, [state]);

  if (screen === "intro")
    return (
      <main className="workStyle shell">
        <header className="topbar">
          <button className="backLink" onClick={onBack}>
            ← Practice home
          </button>
          <div className="headerTools">
            <ThemeToggle />
            <span className="statusPill">
              <i /> Google-inspired practice
            </span>
          </div>
        </header>
        <section className="workIntro">
          <div className="stepLabel">
            Google-inspired · Independent practice · Self-report
          </div>
          <h1>Technology work style inventory</h1>
          <p className="intro">
            Rate {TOTAL} original statements designed around work-style signals
            relevant to Google-type technology roles: user focus, evidence,
            collaboration, adaptability, learning, responsible innovation, and
            leadership without authority.
          </p>
          <div className="likertExample" aria-label="Agreement scale preview">
            {labels.map((item) => (
              <div key={item.value}>
                <span>{item.value}</span>
                <b>{item.label}</b>
              </div>
            ))}
          </div>
          <section className="instructionCard">
            <h2>Before you begin</h2>
            <div className="instructionList">
              <div>
                <span>1</span>
                <p>
                  <b>There are no individually “correct” answers</b>This
                  inventory describes work-style tendencies across ten
                  competencies.
                </p>
              </div>
              <div>
                <span>2</span>
                <p>
                  <b>Use your typical behavior</b>Think about what you usually
                  do across situations, not a single exceptional event.
                </p>
              </div>
              <div>
                <span>3</span>
                <p>
                  <b>Respond independently</b>Similar themes may appear in
                  differently worded statements to support a consistency
                  indicator.
                </p>
              </div>
              <div>
                <span>4</span>
                <p>
                  <b>Take the time you need</b>The inventory is untimed. Your
                  answers and progress are saved on this device.
                </p>
              </div>
            </div>
          </section>
          <label className="accept">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>✓</span>
            <p>
              <b>I understand and will answer based on my typical behavior.</b>
              <small>Results are for practice and reflection only.</small>
            </p>
          </label>
          <button
            className="button primary full"
            disabled={!accepted}
            onClick={begin}
          >
            Begin work style inventory →
          </button>
        </section>
      </main>
    );

  if (screen === "active" && state) {
    const statement = state.order[state.current];
    const answered = Object.keys(state.answers).length;
    return (
      <main className="workStyle assessment">
        <header className="assessmentHeader">
          <button className="backLink" onClick={onBack}>
            HJ Practice
          </button>
          <div className="assessmentHeaderTools">
            <ThemeToggle />
            <div className="workProgressText">
              <span>Work style inventory</span>
              <b>
                {answered} / {TOTAL} answered
              </b>
            </div>
          </div>
        </header>
        <div className="progressLine">
          <i style={{ width: `${(answered / TOTAL) * 100}%` }} />
        </div>
        <section className="likertQuestion">
          <div className="questionMeta">
            <span>
              Statement {String(state.current + 1).padStart(3, "0")}{" "}
              <i>/ {TOTAL}</i>
            </span>
            <b>{statement.competency}</b>
          </div>
          <h1>{statement.statement}</h1>
          <fieldset className="likertScale">
            <legend>Choose the response that best reflects you</legend>
            {labels.map((item) => (
              <label
                key={item.value}
                className={
                  state.answers[statement.id] === item.value ? "selected" : ""
                }
              >
                <input
                  type="radio"
                  name={`statement-${statement.id}`}
                  checked={state.answers[statement.id] === item.value}
                  onChange={() =>
                    setState({
                      ...state,
                      answers: { ...state.answers, [statement.id]: item.value },
                    })
                  }
                />
                <span>{item.value}</span>
                <b>{item.label}</b>
              </label>
            ))}
          </fieldset>
          <div className="questionActions workStyleActions">
            <button
              className="button secondary"
              disabled={state.current === 0}
              onClick={() => setState({ ...state, current: state.current - 1 })}
            >
              ← Previous
            </button>
            <div>
              {state.current < TOTAL - 1 && (
                <button
                  className="button primary"
                  onClick={() =>
                    setState({ ...state, current: state.current + 1 })
                  }
                >
                  Save & next →
                </button>
              )}
              <button
                className="button submitButton"
                onClick={() => setConfirming(true)}
              >
                Submit responses
              </button>
            </div>
          </div>
          <div className="miniNavigator" aria-label="Statement navigator">
            {state.order.map((s, i) => (
              <button
                key={s.id}
                className={`${i === state.current ? "current" : ""} ${state.answers[s.id] ? "answered" : ""}`}
                onClick={() => setState({ ...state, current: i })}
                aria-label={`Statement ${i + 1}${state.answers[s.id] ? ", answered" : ", unanswered"}`}
              >
                {i + 1}
                {state.answers[s.id] && <i>✓</i>}
              </button>
            ))}
          </div>
        </section>
        {confirming && (
          <div className="modalBackdrop">
            <section className="modal" role="dialog" aria-modal="true">
              <div className="modalIcon">?</div>
              <h2>Submit work style inventory?</h2>
              <div className="submitStats">
                <div>
                  <b>{answered}</b>
                  <span>Answered</span>
                </div>
                <div>
                  <b>{TOTAL - answered}</b>
                  <span>Unanswered</span>
                </div>
                <div>
                  <b>{TOTAL}</b>
                  <span>Total</span>
                </div>
              </div>
              <p className="modalNote">
                Unanswered statements will not contribute to your competency
                profile.
              </p>
              <div className="modalActions">
                <button
                  className="button secondary"
                  onClick={() => setConfirming(false)}
                >
                  Continue inventory
                </button>
                <button className="button primary" onClick={submit}>
                  Submit responses
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    );
  }

  if (screen === "results" && state && result) {
    const ranked = [...result.breakdown].sort(
      (a, b) => b.percentage - a.percentage,
    );
    return (
      <main className="workStyle results">
        <header className="topbar">
          <button className="backLink" onClick={onBack}>
            ← Practice home
          </button>
          <div className="headerTools">
            <ThemeToggle />
            <button className="button secondary compact" onClick={restart}>
              ↻ Try again
            </button>
          </div>
        </header>
        <section className="workResultHero">
          <div className="resultEyebrow">Work style inventory complete</div>
          <h1>Your work style profile</h1>
          <p>
            {result.answered} of {TOTAL} statements answered · Reflective
            practice only
          </p>
        </section>
        <section className="resultSection">
          <div className="sectionHeading">
            <span>01</span>
            <div>
              <h2>Competency tendencies</h2>
              <p>
                Higher percentages indicate stronger alignment with the
                professional tendency measured by these original statements.
              </p>
            </div>
          </div>
          <div className="breakdown">
            {ranked.map((row) => {
              const competencyTotal = state.order.filter(
                (item) => item.competency === row.competency,
              ).length;
              return (
                <div key={row.competency}>
                  <p>
                    <b>{row.competency}</b>
                    <span>
                      {row.answered} of {competencyTotal} answered
                    </span>
                  </p>
                  <div>
                    <i style={{ width: `${row.percentage}%` }} />
                  </div>
                  <strong>{row.percentage}%</strong>
                </div>
              );
            })}
          </div>
          <div className="consistencyCard">
            <div>
              <span>Response consistency</span>
              <strong>{result.consistency}%</strong>
            </div>
            <p>
              This indicator compares responses to differently worded statements
              covering related themes. It is not a truthfulness score or selection
              prediction.
            </p>
          </div>
        </section>
        <section className="resultSection">
          <div className="sectionHeading">
            <span>02</span>
            <div>
              <h2>How to use this profile</h2>
              <p>
                Use the strongest areas as evidence to reflect on. Treat lower
                areas as prompts for examples, feedback, and deliberate
                practice—not as fixed traits.
              </p>
            </div>
          </div>
          <button className="button primary" onClick={restart}>
            Take another attempt →
          </button>
        </section>
        <footer>
          <p className="disclaimer">
            ⓘ Google-inspired independent practice inventory. Not affiliated
            with or endorsed by Google. It contains no official or confidential
            Google recruitment material and does not predict a Google recruitment
            decision.
          </p>
        </footer>
      </main>
    );
  }
  return null;
}
