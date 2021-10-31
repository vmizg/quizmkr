export interface BaseOption {
  title: string;
  correct?: boolean;
}

export interface Option extends BaseOption {
  id: string;
}

export interface PartialQuestion {
  index?: number;
  title?: string;
  options?: BaseOption[];
  answerNote?: string;
  imageURI?: string;
}

export interface BaseQuestion extends PartialQuestion {
  index: number;
  title: string;
  options: BaseOption[];
}

export interface Question extends BaseQuestion {
  id: string;
  options: Option[];
}

export interface PartialQuiz {
  title?: string;
  description?: string;
  tags?: string[];
}

export interface BaseQuiz extends PartialQuiz {
  title: string;
}

export interface Quiz extends BaseQuiz {
  id: string;
}

export interface PartialAssessment {
  totalQuestions?: number;
  rangeFrom?: number;
  rangeTo?: number;
  timeLimit?: number;
  randomize?: boolean;
  order?: number[];
}

export interface BaseAssessment extends PartialAssessment {
  totalQuestions: number;
  rangeFrom: number;
  rangeTo: number;
}

export interface Assessment extends BaseAssessment {
  id: string;
  quiz: Quiz;
}

export interface AssessmentResultDetails {
  questionId: string;
  questionIndex: number;
  answeredCorrectly: boolean;
  selectedAnswer: number[];
  correctAnswer: number[];
}

export interface BaseAssesmentResult {
  score: number;
  details: AssessmentResultDetails[];
  timeTaken: number;
  dateCompleted: Date;
}

export interface AssessmentResult extends BaseAssesmentResult {
  id: string;
  assessment: Assessment;
}
