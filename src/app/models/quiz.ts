export interface QOption {
    title: string;
    correct?: boolean;
}

export interface QuizQ {
    title: string;
    options: Set<QOption>;
}

export interface BaseQuiz {
    id: string;
    title: string;
    description?: string;
    questions?: QuizQ[];
    tags?: string[];
}