import {GetterSetter} from "@lenscape/context";
import {useMemo} from "react";
import {NameAnd} from "@lenscape/records";

export type HasQuestionOps = {
    questionOps: GetterSetter<string>
}
export type HasQuestions = {
    questions: Questions
}
export type Questions = NameAnd<string[]>
export type QuestionsAndAnswers = NameAnd<QuestionAndAnswer[]>
export type QuestionAndAnswer = {
    q: string
    a: string
}

export function questionOptions(questions: Questions, key: string): string[] {
    if (key === 'all') return Object.values(questions).flat();
    return questions[key] || [];
}

export function QuestionBar({questions, questionOps}: HasQuestions & HasQuestionOps) {
    const keys = useMemo(() => ['all', ...Object.keys(questions)], [questions]);
    const [question, setQuestion] = questionOps
    return <div className="flex flex-row gap-2">
        {keys.map((key) => (
            <button
                key={key}
                className={`px-4 py-2 rounded ${question === key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                onClick={() => setQuestion(key)}
            >
                {key}
            </button>
        ))}</div>
}