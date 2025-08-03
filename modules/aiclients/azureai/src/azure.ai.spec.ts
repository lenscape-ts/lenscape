import axios from 'axios';
import {BaseMessage} from '@lenscape/agents';
import MockAdapter from 'axios-mock-adapter';
import {defaultAzureAiConfig, azureOpenAiClient, AzureAiConfig} from './azure.ai';

describe('azureOpenAiClient', () => {
    const mockAxios = new MockAdapter(axios);

    const baseURL = 'https://my-resource.openai.azure.com';
    const config: AzureAiConfig = defaultAzureAiConfig(axios, baseURL, 'test-token')
    const client = azureOpenAiClient(config);

    const messages: BaseMessage[] = [{role: 'user', content: 'Hello, Azure!'}];

    afterEach(() => mockAxios.reset());

    test('successfully retrieves messages from Azure OpenAI', async () => {
        const mockResponse = {
            choices: [{message: {role: 'assistant', content: 'Hi from Azure!'}}],
        };

        mockAxios.onPost(`/openai/deployments/gpt-test/chat/completions?api-version=2024-02-15-preview`)
            .reply(200, mockResponse);

        const result = await client(messages);

        expect(result).toEqual([{role: 'assistant', content: 'Hi from Azure!'}]);
    });

    test('handles API errors explicitly', async () => {
        mockAxios.onPost(/\/chat\/completions/).reply(500, {error: 'Internal Server Error'});

        await expect(client(messages)).rejects.toThrow();
    });

    test('correctly handles logit_bias generation', async () => {
        mockAxios.onPost(/\/chat\/completions/).reply(config => {
            const requestData = JSON.parse(config.data);
            expect(requestData.logit_bias).toEqual(expect.any(Object));
            return [200, {choices: [{message: {role: 'assistant', content: 'Biased Response'}}]}];
        });

        await client(messages, {logit: ['azure', 'openai']});
    });

    test('defaults temperature correctly (0.7)', async () => {
        mockAxios.onPost(/\/chat\/completions/).reply(config => {
            const requestData = JSON.parse(config.data);
            expect(requestData.temperature).toBe(0.7);
            return [200, {choices: [{message: {role: 'assistant', content: 'Default temp'}}]}];
        });

        await client(messages);
    });

    test('respects explicitly set temperature (0)', async () => {
        mockAxios.onPost(/\/chat\/completions/).reply(config => {
            const requestData = JSON.parse(config.data);
            expect(requestData.temperature).toBe(0);
            return [200, {choices: [{message: {role: 'assistant', content: 'Cold Response'}}]}];
        });

        await client(messages, {temperature: 0});
    });

    test('includes customisation parameters explicitly', async () => {
        const customisation = {max_tokens: 42, frequency_penalty: 0.1};

        mockAxios.onPost(/\/chat\/completions/).reply(config => {
            const requestData = JSON.parse(config.data);
            expect(requestData.max_tokens).toBe(42);
            expect(requestData.frequency_penalty).toBe(0.1);
            return [200, {choices: [{message: {role: 'assistant', content: 'Tuned response'}}]}];
        });

        await client(messages, {customisation});
    });

    test('uses model from options as deployment ID override', async () => {
        mockAxios.onPost(`/openai/deployments/gpt-override/chat/completions?api-version=2024-02-15-preview`)
            .reply(200, {choices: [{message: {role: 'assistant', content: 'Override model used'}}]});

        const result = await client(messages, {model: 'gpt-override'});
        expect(result[0].content).toBe('Override model used');
    });

    test('logs debug info when debug is enabled', async () => {
        const debugConfig: AzureAiConfig = {...config, debug: true};
        const debugClient = azureOpenAiClient(debugConfig);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        });
        mockAxios.onPost(/\/chat\/completions/).reply(200, {
            choices: [{message: {role: 'assistant', content: 'Debug mode'}}]
        });

        await debugClient(messages);

        expect(consoleSpy).toHaveBeenCalledWith('azureOpenAiClient', messages, debugConfig);

        consoleSpy.mockRestore();
    });
});
