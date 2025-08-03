import {BaseMessage} from '../messages';
import {AgentCard, HasLastSelected} from '../agent.card';
import {isErrors, valueOrThrow} from '@lenscape/errors';
import {selectAgent, SelectorFn, SelectorFns} from "./selectorFn";

type TestContext = { canUseLlm: boolean; lastSelected: string };
type TestSelector = { type: string; select?: string };

describe('selectAgent', () => {
    const messages: BaseMessage[] = [{role: 'user', content: 'Hello world'}];

    const llmSelectorFn: SelectorFn<TestContext, TestSelector> = {
        isDefinedAt: (selector, context) => context.canUseLlm,
        execute: async (_, context) => ({value: {selected: 'llmAgent', context}, log: {whatHappened: 'llm.executed'}}),
    };

    const fixedSelectorFn: SelectorFn<TestContext, TestSelector> = {
        execute: async (selector, context) => ({value: {selected: selector.select!, context}, log: {whatHappened: 'fixed.executed'}}),
    };

    const selFns: SelectorFns<TestContext> = {
        llm: llmSelectorFn,
        fixed: fixedSelectorFn,
    };

    const cards: Record<string, AgentCard<TestContext, any>> = {
        llmAgent: {purpose: 'LLM agent', samples: [], tags: [], pipeline: {}},
        fixedAgent: {purpose: 'Fixed agent', samples: [], tags: [], pipeline: {}},
    };

    test('successfully selects an agent (fixed selector)', async () => {
        const selector: TestSelector = {type: 'fixed', select: 'fixedAgent'};
        const context: TestContext = {canUseLlm: false, lastSelected: 'none'};

        const result = await selectAgent(selFns, cards)(selector, context, messages);

        expect(valueOrThrow(result)).toEqual({
            "agentCard": {
                "pipeline": {},
                "purpose": "Fixed agent",
                "samples": [],
                "tags": []
            },
            "context": {
                "canUseLlm": false,
                "lastSelected": "fixedAgent"
            },
            "selected": "fixedAgent"
        });
    });

    test('fails when selector type not found', async () => {
        const selector: TestSelector = {type: 'nonexistent'};
        const context: TestContext = {canUseLlm: true, lastSelected: 'none'};

        const result = await selectAgent(selFns, cards)(selector, context, messages);

        expect(result).toEqual({
            errors: ['selector nonexistent not found. Legal values are fixed,llm'],
            log: {
                whatHappened: 'selector.type.not.found',
                params: JSON.stringify(selector),
                severity: 'error',
            },
        });
    });

    test('fails when selector isDefinedAt returns false', async () => {
        const selector: TestSelector = {type: 'llm'};
        const context: TestContext = {canUseLlm: false, lastSelected: 'none'};

        const result = await selectAgent(selFns, cards)(selector, context, messages);

        expect(result).toEqual({
            errors: ['selector.not.defined'],
            log: {
                whatHappened: 'selector.not.defined',
                params: [JSON.stringify(context), JSON.stringify(messages)],
                severity: 'error',
            },
        });
    });

    test('fails if selector execution returns errors', async () => {
        const failingSelectorFn: SelectorFn<TestContext, TestSelector> = {
            execute: async () => ({
                errors: ['Something went wrong'],
                log: {whatHappened: 'selector.execution.failed', severity: 'error'},
            }),
        };

        const localSelFns = {failing: failingSelectorFn};
        const selector: TestSelector = {type: 'failing'};
        const context: TestContext = {canUseLlm: true, lastSelected: 'none'};

        const result = await selectAgent(localSelFns, cards)(selector, context, messages);

        expect(result).toEqual({
            errors: ['Something went wrong'],
            log: {whatHappened: 'selector.execution.failed', severity: 'error'},
        });
    });

    test('fails when selected agent card does not exist', async () => {
        const selector: TestSelector = {type: 'fixed', select: 'unknownAgent'};
        const context: TestContext = {canUseLlm: true, lastSelected: 'none'};

        const result = await selectAgent(selFns, cards)(selector, context, messages);

        expect(result).toEqual({
            errors: [
                'selector.card.not.found',
                'Card unknownAgent not found. Legal values are fixedAgent,llmAgent',
            ],
            log: {
                whatHappened: 'selector.card.not.found',
                params: 'unknownAgent',
                severity: 'error',
            },
        });
    });
});
