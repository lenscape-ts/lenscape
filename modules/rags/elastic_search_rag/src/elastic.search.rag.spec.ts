import axios, {AxiosError, AxiosResponse} from 'axios';
import {ErrorsOr} from '@lenscape/errors';
import {ElasticSearchConfig, elasticSearchRag} from "./elastic.search.rag";
import {BaseMessage} from "@lenscape/agents";

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockTokenFn = jest.fn(async () => 'fake-api-key');

const config: ElasticSearchConfig = {
    elasticSearchUrl: 'http://test-elasticsearch.com',
    axios: mockedAxios,
    tokenFn: mockTokenFn,
    blacklistedFields: ['bl1', 'bl2']
};

describe('elasticSearchRag', () => {
    const rag = elasticSearchRag(config);

    it('successfully retrieves data from ElasticSearch', async () => {
        const mockResponse: AxiosResponse = {
            data: {hits: {hits: [{id: 1, _index: 'foundIndex', _source: {content: 'test document'}}]}},
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await rag('test query', ['test-index'], 1);

        expect(result).toEqual({
            "log": "elasticsearchrag.success",
            "value": [
                {
                    "content": "Found 1 documents. Top 1 are:\nDocument 1:\n{\"content\":\"test document\"}\n",
                    "role": "system",
                    "firstIndex": "foundIndex",
                }
            ]
        });

        const expectedRequestBody = {
            _source: {
                excludes: ['bl1', 'bl2'],
            },
            knn: {
                field: "full_text_embeddings",
                query_vector_builder: {
                    text_embedding: {
                        model_id: ".multilingual-e5-small_linux-x86_64",
                        model_text: 'test query',
                    },
                },
                k: 1,
                num_candidates: 11,
            },
        };

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://test-elasticsearch.com/test-index/_search',
            expectedRequestBody,
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    Authorization: 'ApiKey fake-api-key'
                })
            })
        );

    });

    it('handles Axios errors gracefully', async () => {
        const errorResponse: AxiosResponse = {
            data: {error: {reason: 'Internal Server Error'}},
            status: 500,
            statusText: 'Internal Server Error',
            headers: {},
            config: {} as any,
        };

        const axiosError = new AxiosError(
            'Request failed with status code 500',
            'ERR_BAD_RESPONSE',
            errorResponse.config,
            undefined,
            errorResponse
        );

        // Explicitly set response again to ensure Jest correctly assigns it
        axiosError.response = errorResponse;

        mockedAxios.post.mockRejectedValue(axiosError);

        const result: ErrorsOr<BaseMessage[]> = await rag('error query', ['test-index'], 1);

        expect(result).toEqual({
            "errors": [
                "Internal Server Error"
            ],
            "extras": {
                "response": {
                    "config": {},
                    "data": {
                        "error": {
                            "reason": "Internal Server Error"
                        }
                    },
                    "headers": {},
                    "status": 500,
                    "statusText": "Internal Server Error"
                }
            },
            "log": {
                "params": "Status: 500\nResponse: {\"error\":{\"reason\":\"Internal Server Error\"}}",
                "severity": "error",
                "whatHappened": "elasticsearchrag.axioserror"
            }
        });
    });


    it('handles generic unexpected errors gracefully', async () => {
        mockedAxios.post.mockRejectedValue(new Error('Unexpected failure'));

        const result: ErrorsOr<BaseMessage[]> = await rag('unexpected error query', ['test-index'], 1);

        expect(JSON.stringify(result, null, 2)).toEqual(JSON.stringify({
            "errors": [
                "Unexpected failure"
            ],
            "extras": {},
            "log": "elasticsearchrag.error"
        }, null, 2));
    });
});