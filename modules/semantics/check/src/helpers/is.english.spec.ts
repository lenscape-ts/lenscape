import {isProbablyEnglish} from "./is.english";


describe('isProbablyEnglish', () => {
    test('correctly identifies English text', () => {
        const englishText = 'How can I book a meeting room?';
        expect(isProbablyEnglish(englishText)).toBe(true);
    });

    test('correctly identifies German text as non-English', () => {
        const germanText = 'Wie kann ich einen Besprechungsraum buchen?';
        expect(isProbablyEnglish(germanText)).toBe(false);
    });

    test('correctly identifies Chinese text as non-English', () => {
        const chineseText = '我想预订一个会议室';
        expect(isProbablyEnglish(chineseText)).toBe(false);
    });
});
