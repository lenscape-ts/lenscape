
import { BaseMessage } from '../messages';
import {KeywordSelector, keywordSelector} from "./keyword.selector";

describe('keywordSelector', () => {

    test('isDefinedAt returns true when keyword is present (case insensitive)', () => {
        const selector: KeywordSelector = {
            type: 'keywords',
            keywords: ['billing', 'payment'],
            select: 'billingAgent'
        };

        const messages: BaseMessage[] = [{ role: 'user', content: 'I have a BILLING issue' }];
        expect(keywordSelector.isDefinedAt!(selector, {}, messages)).toEqual(true);
    });

    test('isDefinedAt returns false when keyword is absent', () => {
        const selector: KeywordSelector = {
            type: 'keywords',
            keywords: ['billing', 'payment'],
            select: 'billingAgent'
        };

        const messages: BaseMessage[] = [{ role: 'user', content: 'I have an account issue' }];
        expect(keywordSelector.isDefinedAt!(selector, {}, messages)).toEqual(false);
    });

    test('execute selects correct agent when keyword is found', async () => {
        const selector: KeywordSelector = {
            type: 'keywords',
            keywords: ['support', 'help'],
            select: 'supportAgent'
        };

        const messages: BaseMessage[] = [{ role: 'user', content: 'Can I get some HELP here?' }];

        expect(keywordSelector.isDefinedAt!(selector, {}, messages)).toEqual(true);
        const result = await keywordSelector.execute(selector, {}, messages);
        expect(result).toEqual({
            "value": {
                "context": {},
                "selected": "supportAgent"
            }
        });
    });

    test('execute should not be called if isDefinedAt returns false (keyword missing)', () => {
        const selector: KeywordSelector = {
            type: 'keywords',
            keywords: ['billing', 'payment'],
            select: 'billingAgent'
        };

        const messages: BaseMessage[] = [{ role: 'user', content: 'General inquiry' }];
        expect(keywordSelector.isDefinedAt!(selector, {}, messages)).toEqual(false);
        // explicitly do NOT call execute here
    });

    test('execute should not be called if isDefinedAt returns false (empty messages)', () => {
        const selector: KeywordSelector = {
            type: 'keywords',
            keywords: ['billing'],
            select: 'billingAgent'
        };

        const messages: BaseMessage[] = [];
        expect(keywordSelector.isDefinedAt!(selector, {}, messages)).toEqual(false);
        // explicitly do NOT call execute here
    });
});
