import { AssessmentQuestion, Attempt, Category, OptionId } from "./types";

export const DURATION_MS = 30 * 60 * 1000;

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function createAttempt(source: AssessmentQuestion[]): Attempt {
  const questions = shuffle(source).map((question) => {
    const originalCorrect = question.options.find(
      (o) => o.id === question.correctAnswer,
    )!;
    const optionTexts = shuffle(question.options.map((o) => o.text));
    const ids: OptionId[] = ["A", "B", "C", "D"];
    const options = optionTexts.map((text, index) => ({
      id: ids[index],
      text,
    }));
    return {
      ...question,
      options,
      correctAnswer: options.find((o) => o.text === originalCorrect.text)!.id,
    };
  });
  return {
    id: crypto.randomUUID(),
    status: "active",
    startedAt: Date.now(),
    questions,
    answers: {},
    marked: [],
    current: 0,
  };
}

export const remainingMs = (attempt: Attempt, now = Date.now()) =>
  Math.max(0, DURATION_MS - (now - attempt.startedAt));

export const bandFor = (score: number) =>
  score >= 90
    ? "Exceptional Judgement"
    : score >= 80
      ? "Strong Judgement"
      : score >= 70
        ? "Good Judgement"
        : score >= 60
          ? "Developing Judgement"
          : "Needs More Practice";

export function calculateResult(attempt: Attempt) {
  const correct = attempt.questions.filter(
    (q) => attempt.answers[q.id] === q.correctAnswer,
  ).length;
  const answered = Object.keys(attempt.answers).length;
  const score = correct * 2;
  const usedMs = Math.min(
    DURATION_MS,
    (attempt.submittedAt ?? Date.now()) - attempt.startedAt,
  );
  const categories = [
    ...new Set(attempt.questions.map((q) => q.category)),
  ] as Category[];
  const breakdown = categories.map((category) => {
    const questions = attempt.questions.filter((q) => q.category === category);
    const hits = questions.filter(
      (q) => attempt.answers[q.id] === q.correctAnswer,
    ).length;
    return {
      category,
      correct: hits,
      total: questions.length,
      percentage: Math.round((hits / questions.length) * 100),
    };
  });
  const ranked = [...breakdown].sort(
    (a, b) => b.percentage - a.percentage || b.correct - a.correct,
  );
  return {
    score,
    correct,
    incorrect: answered - correct,
    unanswered: 50 - answered,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    completion: Math.round((answered / 50) * 100),
    usedMs,
    averageSeconds: answered ? Math.round(usedMs / 1000 / answered) : 0,
    band: bandFor(score),
    breakdown,
    strongest: ranked.slice(0, 3),
    improve: ranked.slice(-3).reverse(),
  };
}
