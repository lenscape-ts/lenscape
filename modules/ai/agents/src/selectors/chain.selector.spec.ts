import {SelectorFn, SelectorFns} from './selectorFn';
import {BaseMessage} from '../messages';
import {chainSelector, ChainSelector} from "./chain.selector";

type TestContext = { canUseLlm: boolean };
type TestSelector = { type: string; value?: string };

describe('chainSelector', () => {
    const messages: BaseMessage[] = [];

    const llmSelectorFn: SelectorFn<TestContext, TestSelector> = {
        isDefinedAt: (selector, context) => context.canUseLlm,
        execute: async () => ({ value: 'llmAgent', log: { whatHappened: 'llm.executed' } }),
    };

    const fixedSelectorFn: SelectorFn<TestContext, TestSelector> = {
        execute: async () => ({ value: 'fixedAgent', log: { whatHappened: 'fixed.executed' } }),
    };

    const selFns: SelectorFns<TestContext> = {
        llmSelector: llmSelectorFn,
        fixedSelector: fixedSelectorFn,
    };

    test('isDefinedAt returns true when at least one selector matches', () => {
        const selector: ChainSelector<TestContext, TestSelector> = {
            type: 'chain',
            chain: [{ type: 'llmSelector' }, { type: 'fixedSelector' }],
        };

        expect(chainSelector(selFns).isDefinedAt!(selector, { canUseLlm: true }, messages)).toEqual(true);
        expect(chainSelector(selFns).isDefinedAt!(selector, { canUseLlm: false }, messages)).toEqual(true);
    });

    test('isDefinedAt returns false when no selectors match', () => {
        const noMatchSelectorFn: SelectorFn<TestContext, TestSelector> = {
            isDefinedAt: () => false,
            execute: async () => ({ value: 'neverMatched', log: { whatHappened: 'never.executed' } }),
        };

        const localSelFns = { noMatchSelector: noMatchSelectorFn };

        const selector: ChainSelector<TestContext, TestSelector> = {
            type: 'chain',
            chain: [{ type: 'noMatchSelector' }],
        };

        expect(chainSelector(localSelFns).isDefinedAt!(selector, { canUseLlm: false }, messages)).toEqual(false);
    });

    test('execute picks first matching selector', async () => {
        const selector: ChainSelector<TestContext, TestSelector> = {
            type: 'chain',
            chain: [{ type: 'llmSelector' }, { type: 'fixedSelector' }],
        };

        const result = await chainSelector(selFns).execute(selector, { canUseLlm: true }, messages);
        expect(result).toEqual({
            value: 'llmAgent',
            log: { whatHappened: 'llm.executed' },
        });
    });

    test('execute skips non-matching selectors', async () => {
        const selector: ChainSelector<TestContext, TestSelector> = {
            type: 'chain',
            chain: [{ type: 'llmSelector' }, { type: 'fixedSelector' }],
        };

        const result = await chainSelector(selFns).execute(selector, { canUseLlm: false }, messages);
        expect(result).toEqual({
            value: 'fixedAgent',
            log: { whatHappened: 'fixed.executed' },
        });
    });

    test('execute returns error if no selectors match', async () => {
        const noMatchSelectorFn: SelectorFn<TestContext, TestSelector> = {
            isDefinedAt: () => false,
            execute: async () => ({ value: 'neverMatched', log: { whatHappened: 'never.executed' } }),
        };

        const localSelFns = { noMatchSelector: noMatchSelectorFn };

        const selector: ChainSelector<TestContext, TestSelector> = {
            type: 'chain',
            chain: [{ type: 'noMatchSelector' }],
        };

        const result = await chainSelector(localSelFns).execute(selector, { canUseLlm: false }, messages);
        expect(result).toEqual({
            errors: ['No selector matched in chain: noMatchSelector'],
            log: { whatHappened: 'chain.selector.noMatch', severity: 'error' },
        });
    });

    test('execute returns error if selector type not found', async () => {
        const selector: ChainSelector<TestContext, TestSelector> = {
            type: 'chain',
            chain: [{ type: 'nonExistentSelector' }],
        };

        const result = await chainSelector(selFns).execute(selector, { canUseLlm: true }, messages);
        expect(result).toEqual({
            errors: ['Selector nonExistentSelector not found in chain. Legal values are 0'],
            log: { whatHappened: 'chain.selector.notFound', severity: 'error' },
        });
    });
});
