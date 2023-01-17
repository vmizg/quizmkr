export interface BaseImage {
  image: string;
}

export interface Image extends BaseImage {
  id: string;
}

export interface BaseOption {
  index: number;
  title: string;
  correct?: boolean;
}

export interface Option extends BaseOption {
  id: string;
}

export interface PartialQuestion {
  title?: string;
  image?: BaseImage;
  options?: BaseOption[];
  answerNote?: string;
  imageId?: string;
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
  totalQuestions: number;
}

export interface PartialAssessment {
  totalQuestions?: number;
  rangeFrom?: number;
  rangeTo?: number;
  timeLimit?: number;
  randomize?: boolean;
}

export interface BaseAssessment extends PartialAssessment {
  totalQuestions: number;
  rangeFrom: number;
  rangeTo: number;
}

export interface Assessment extends BaseAssessment {
  id: string;
  quiz: Quiz;
  // order: number[];
  questions: Question[];
}

export interface BaseAssessmentResultDetails {
  questionId: string;
  selectedAnswer: string[];
  correctAnswer?: string[];
  answeredCorrectly?: boolean;
}

export interface AssessmentResultDetails extends BaseAssessmentResultDetails {
  question: Question;
}

export interface BaseAssesmentResult {
  score?: number;
  details: BaseAssessmentResultDetails[];
  timeTaken: number;
  dateCompleted: Date;
}

export interface AssessmentResult extends BaseAssesmentResult {
  id: string;
  assessment: Assessment;
  details: AssessmentResultDetails[];
}
