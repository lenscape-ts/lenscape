import {AiClients} from '@lenscape/aiclient';
import {ErrorsOr} from '@lenscape/errors';
import {BaseMessage, defaultDereferenceMessages, defaultLookupMessages} from "@lenscape/agents";
import {executeLlmPipelineDetails, LlmPipelineDetails} from "./llm.agent";


const mockAiClient = jest.fn(async (prompt: BaseMessage[]) => ([
    {role: 'assistant' as const, content: 'AI response'}
]));

const aiClients: AiClients = {
    testAgent: mockAiClient
};

describe('executeLlmPipelineDetails', () => {
    type Context = { name: string };

    const lookup = defaultLookupMessages({
        greeting: [{role: 'system', content: 'Hello ${context.name}'}]
    });

    const deref = defaultDereferenceMessages;

    const context: Context = {name: 'Alice'};

    const messages: BaseMessage[] = [
        {role: 'user', content: 'Can you help me?'}
    ];

    const executor = executeLlmPipelineDetails(aiClients, lookup, deref);

    it('successfully executes LLM pipeline details', async () => {
        const pipelineDetails: LlmPipelineDetails = {
            type: 'llm',
            agent: 'testAgent',
            prefix: 'greeting',
        };

        const result = await executor(pipelineDetails, {context, messages});

        expect(result).toEqual({
            value: {
                context,
                messages: [
                    {role: 'user', content: 'Can you help me?'},
                    {role: 'assistant', content: 'AI response'}
                ]
            },
            log: 'executedLlmPipelineDetails'
        });
    });

    it('handles errors in prefix message dereferencing', async () => {
        const failingDeref: typeof defaultDereferenceMessages = () => ({errors: ['Dereference error']});

        const failingExecutor = executeLlmPipelineDetails(aiClients, lookup, failingDeref);

        const pipelineDetails: LlmPipelineDetails = {
            type: 'llm',
            agent: 'testAgent',
            prefix: 'greeting',
        };

        const result = await failingExecutor(pipelineDetails, {context, messages});

        expect(result).toEqual({
            errors: ['Dereference error'],
            log: {
                whatHappened: 'Error dereferencing prefix messages',
                params: JSON.stringify('greeting')
            }
        });
    });
});