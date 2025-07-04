
import { AiClients } from '@lenscape/aiclient';
import { AgentCard } from '@lenscape/agents';
import { BaseMessage } from '@lenscape/agents';
import {llmSelector, LlmSelector} from "./llm.selector";

describe('llmSelector', () => {
    const mockAiClient = jest.fn();
    const aiClients: AiClients = {
        'gpt-4': mockAiClient
    };

    const cards: Record<string, AgentCard<any, any>> = {
        billingAgent: { purpose: 'Handles billing questions', samples: [], tags: [], pipeline: {} },
        supportAgent: { purpose: 'Technical support', samples: [], tags: [], pipeline: {} },
        childAgent: { purpose: 'Child agent', samples: [], tags: [], pipeline: {}, main: false }
    };

    const lookup = (msgs: BaseMessage[]) => msgs;
    const deref = (context: any, msgs: BaseMessage[]) => ({ value: msgs });

    test('executes and returns selected agent from aiClient', async () => {
        mockAiClient.mockResolvedValueOnce([{ role: 'assistant', content: 'billingAgent\n' }]);

        const selector: LlmSelector = {
            type: 'llm',
            model: 'gpt-4',
            prefix: [{ role: 'system', content: 'Select an agent' }]
        };

        const result = await llmSelector(aiClients, cards, lookup, deref).execute(selector, {}, []);

        expect(result).toEqual({
            "log": {
                "params": "billingAgent",
                "whatHappened": "llm.selector.agent.selected"
            },
            "value": "billingAgent"
        });

        expect(mockAiClient).toHaveBeenCalledWith(
            [
                { role: 'system', content: 'Select an agent' }
            ],
            { logit: ['billingAgent', 'supportAgent'], temperature: 0.1 }
        );
    });

    test('fails explicitly when aiClient is missing', async () => {
        const selector: LlmSelector = {
            type: 'llm',
            model: 'nonexistent-model',
            prefix: []
        };

        const result = await llmSelector(aiClients, cards, lookup, deref).execute(selector, {}, []);

        expect(result).toEqual({
            errors: ['No AI client found for model nonexistent-model. Legal models are: gpt-4'],
            log: {
                whatHappened: 'find.agent.no.client',
                severity: 'error',
                params: 'nonexistent-model'
            }
        });
    });

    test('handles dereference errors explicitly', async () => {
        const failingDeref = () => ({ errors: ['Deref failed'] });

        const selector: LlmSelector = {
            type: 'llm',
            model: 'gpt-4',
            prefix: []
        };

        const result = await llmSelector(aiClients, cards, lookup, failingDeref).execute(selector, {}, []);

        expect(result).toEqual({
            errors: ['Deref failed'],
            log: {
                whatHappened: 'find.agent.dereference.prefix',
                severity: 'error'
            }
        });
    });

    test('trims whitespace from aiClient response explicitly', async () => {
        mockAiClient.mockResolvedValueOnce([{ role: 'assistant', content: ' supportAgent \n\n' }]);

        const selector: LlmSelector = {
            type: 'llm',
            model: 'gpt-4',
            prefix: []
        };

        const result = await llmSelector(aiClients, cards, lookup, deref).execute(selector, {}, []);

        expect(result).toEqual({
            "log": {
                "params": "supportAgent",
                "whatHappened": "llm.selector.agent.selected"
            },
            "value": "supportAgent"
        });
    });
});
