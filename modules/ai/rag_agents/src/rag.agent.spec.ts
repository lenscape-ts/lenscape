import {executeRagPipelineDetails, RagFns, RagPipelineDetails} from "./rag.agent";
import {ErrorsOr} from "@lenscape/errors";
import {BaseMessage, ContextWithQuery} from "@lenscape/agents";

const mockRagFn = jest.fn(async (query: string, indices: string[], top: number): Promise<ErrorsOr<BaseMessage[]>> =>
    ({
        value: [
            {role: 'system' as const, content: `Results for ${query}`}
        ]
    }));

const ragFns: RagFns = {
    testSource: mockRagFn
};

describe('executeRagPipelineDetails', () => {
    type Context = ContextWithQuery & { userId: string };

    const context: Context = {userId: '123', query: 'test query'};

    const messages: BaseMessage[] = [
        {role: 'user', content: 'Previous message'}
    ];

    const executor = executeRagPipelineDetails(ragFns);

    it('successfully executes RAG pipeline details', async () => {
        const pipelineDetails: RagPipelineDetails = {
            type: 'rag',
            source: 'testSource',
            indices: ['index1', 'index2'],
            top: 3
        };

        const result = await executor(pipelineDetails, {context, messages});

        expect(result).toEqual({
            value: {
                context,
                messages: [
                    {role: 'user', content: 'Previous message'},
                    {role: 'system', content: 'Results for test query'}
                ]
            }
        });

        expect(mockRagFn).toHaveBeenCalledWith('test query', ['index1', 'index2'], 3);
    });

    it('handles unknown RAG source gracefully', async () => {
        const pipelineDetails: RagPipelineDetails = {
            type: 'rag',
            source: 'unknownSource',
            indices: [],
            top: 5
        };

        const result = await executor(pipelineDetails, {context, messages});

        expect(result).toEqual({
            errors: ['Unknown rag source unknownSource. Legal values are testSource'],
            log: {
                whatHappened: 'Rag function unknown source ',
                params: 'unknownSource',
                severity: 'error'
            }
        });
    });

    it('handles RAG function errors gracefully', async () => {
        const failingRagFn = jest.fn(async (): Promise<ErrorsOr<BaseMessage[]>> => ({errors: ['RAG retrieval error']}));

        const failingRagFns: RagFns = {testSource: failingRagFn};

        const failingExecutor = executeRagPipelineDetails(failingRagFns);

        const pipelineDetails: RagPipelineDetails = {
            type: 'rag',
            source: 'testSource',
            indices: ['index1'],
            top: 1
        };

        const result = await failingExecutor(pipelineDetails, {context, messages});

        expect(result).toEqual({
            errors: ['RAG retrieval error'],
            log: {whatHappened: 'Rag function failed', severity: 'error'}
        });
    });
});
