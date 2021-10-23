export interface QOption {
    title: string;
    correct?: boolean;
}

export interface QuizQ {
    id?: string;
    title: string;
    options: QOption[];
}

export interface BaseQuiz {
    id: string;
    title: string;
    description?: string;
    questions?: QuizQ[];
    tags?: string[];
}