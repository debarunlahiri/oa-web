export type Category =
  | "Integrity"
  | "Accountability"
  | "Collaboration"
  | "Communication"
  | "Problem Solving"
  | "Prioritization"
  | "Adaptability"
  | "User Focus"
  | "Security"
  | "Leadership";

export type Difficulty = "Medium" | "Difficult" | "Very Difficult";
export type OptionId = "A" | "B" | "C" | "D";

export type AssessmentQuestion = {
  id: number;
  category: Category;
  difficulty: Difficulty;
  question: string;
  options: { id: OptionId; text: string }[];
  correctAnswer: OptionId;
  explanation: string;
  competency: string;
};

export type Attempt = {
  id: string;
  status: "active" | "submitted";
  startedAt: number;
  submittedAt?: number;
  questions: AssessmentQuestion[];
  answers: Record<number, OptionId>;
  marked: number[];
  current: number;
};
