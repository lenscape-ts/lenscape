import axios from 'axios';
import {BaseMessage} from '@lenscape/agents';
import MockAdapter from "axios-mock-adapter";
import {defaultOpenAiConfig, openAiClient, OpenAiConfig} from "./openai";

describe('openAiClient', () => {
    const mockAxios = new MockAdapter(axios);

    const env = {OPENAI_TOKEN: 'test-token'};
    const config: OpenAiConfig = defaultOpenAiConfig(axios, env);
    const client = openAiClient(config);

    const messages: BaseMessage[] = [{role: 'user', content: 'Hello, OpenAI!'}];

    afterEach(() => mockAxios.reset());

    test('successfully retrieves messages from OpenAI', async () => {
        const mockResponse = {
            choices: [{message: {role: 'assistant', content: 'Hi there!'}}],
        };

        mockAxios.onPost('/v1/chat/completions').reply(200, mockResponse);

        const result = await client(messages);

        expect(result).toEqual([{role: 'assistant', content: 'Hi there!'}]);
    });

    test('handles API errors explicitly', async () => {
        mockAxios.onPost('/v1/chat/completions').reply(500, {error: 'Internal Server Error'});

        await expect(client(messages)).rejects.toThrow();
    });

    test('correctly handles logit_bias generation', async () => {
        mockAxios.onPost('/v1/chat/completions').reply(config => {
            const requestData = JSON.parse(config.data);

            expect(requestData.logit_bias).toEqual({
                "1985": 50,
                "2569": 50
            });


            return [200, {choices: [{message: {role: 'assistant', content: 'Biased Response'}}]}];
        });

        await client(messages, {logit: ['test', 'openai']});
    });

    test('defaults temperature correctly (0.7)', async () => {
        mockAxios.onPost('/v1/chat/completions').reply(config => {
            const requestData = JSON.parse(config.data);

            expect(requestData.temperature).toBe(0.7);

            return [200, {choices: [{message: {role: 'assistant', content: 'Default temp response'}}]}];
        });

        await client(messages);
    });

    test('explicitly respects provided temperature (0)', async () => {
        mockAxios.onPost('/v1/chat/completions').reply(config => {
            const requestData = JSON.parse(config.data);

            expect(requestData.temperature).toBe(0);

            return [200, {choices: [{message: {role: 'assistant', content: 'Temp 0 response'}}]}];
        });

        await client(messages, {temperature: 0});
    });

    test('includes customisation parameters explicitly', async () => {
        const customisation = {max_tokens: 100, presence_penalty: 0.5};

        mockAxios.onPost('/v1/chat/completions').reply(config => {
            const requestData = JSON.parse(config.data);

            expect(requestData.max_tokens).toBe(100);
            expect(requestData.presence_penalty).toBe(0.5);

            return [200, {choices: [{message: {role: 'assistant', content: 'Customised response'}}]}];
        });

        await client(messages, {customisation});
    });

    test('uses provided model explicitly from options', async () => {
        mockAxios.onPost('/v1/chat/completions').reply(config => {
            const requestData = JSON.parse(config.data);

            expect(requestData.model).toBe('gpt-3.5-turbo');

            return [200, {choices: [{message: {role: 'assistant', content: 'Model response'}}]}];
        });

        await client(messages, {model: 'gpt-3.5-turbo'});
    });

    test('logs debug information explicitly when debug is true', async () => {
        const debugConfig: OpenAiConfig = {...config, debug: true};
        const debugClient = openAiClient(debugConfig);

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        });
        mockAxios.onPost('/v1/chat/completions').reply(200, {
            choices: [{message: {role: 'assistant', content: 'Debug Response'}}]
        });

        await debugClient(messages);

        expect(consoleSpy).toHaveBeenCalledWith('openAiMessagesClient', messages, debugConfig);

        consoleSpy.mockRestore();
    });
});
