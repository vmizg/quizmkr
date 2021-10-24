export interface QOption {
  title: string;
  correct?: boolean;
}

export interface QuizQ {
  id: string;
  title: string;
  options: QOption[];
}

export interface QuizQuestions {
  id: string;
  quizId: string;
  questions: QuizQ[];
}

export interface BaseQuiz {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
}

export interface BaseAssessmentSettings {
  totalQuestions: number;
  rangeFrom: number;
  rangeTo: number;
  randomize: boolean;
  timeLimit?: number;
  finished?: boolean;
}

export interface AssessmentSettings extends BaseAssessmentSettings {
  id: string;
  quizId: string;
  quizTitle: string;
}

export interface BaseAssesmentResult {
  score: number;
  details: {
    questionId: string;
    answeredCorrectly: boolean;
    selectedAnswer: number[];
    correctAnswer: number[];
  }[];
  timeTaken: number;
  dateCompleted: Date;
}

export interface AssessmentResult extends BaseAssesmentResult {
  id: string;
  quizId: string;
  quizTitle: string;
  assessmentId: string;
}
