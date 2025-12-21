export type QuizDetailsDto = {
    id: number;
    title: string;
    code?: string;
    status?: string;
    questionCount: number;
    avgSecondsPerQuestion: number;
    estimatedSeconds: number;
    estimatedMinutes: number;
};
