export interface AnswerOption {
  title: string;
  correct?: boolean;
}

export interface QuizQuestion {
  id: string;
  title: string;
  options: AnswerOption[];
  answerNote?: string;
  imageURI?: string;
  index: number;
}

export interface QuizQuestions {
  id: string;
  quizId: string;
  questions: QuizQuestion[];
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
}

export interface BaseAssessmentSettings {
  totalQuestions: number;
  rangeFrom: number;
  rangeTo: number;
  order?: number[];
  randomize?: boolean;
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
    questionIndex: number;
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
