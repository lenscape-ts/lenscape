import {questions} from "../questions";

describe('Duplicate Questions Check', () => {
    it('should have no duplicate questions', () => {
        const questionSet = new Set<string>();
        const duplicates: string[] = [];

        Object.values(questions).forEach((group) => {
            group.forEach((question) => {
                const normalizedQuestion = question.trim().toLowerCase();
                if (questionSet.has(normalizedQuestion)) {
                    duplicates.push(question);
                } else {
                    questionSet.add(normalizedQuestion);
                }
            });
        });

        expect(duplicates).toEqual([]);
    });
});