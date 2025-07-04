import {AxiosStatic} from "axios";
import {AiClient, AiOptions} from "@lenscape/aiclient";
import {BaseMessage} from "@lenscape/agents";
import {Env} from "@lenscape/records";
import {encoding_for_model} from "tiktoken";

export type OpenAiConfig = {
    axios: AxiosStatic,
    baseURL?: string
    Authorization: string,
    model?: string
    //Any customisation for the call. See https://platform.openai.com/docs/api-reference/chat/create
    customisation?: any
    debug?: boolean
}

export function defaultOpenAiConfig(axios: AxiosStatic, env: Env): OpenAiConfig {
    return {
        axios,
        baseURL: `https://api.openai.com`,
        Authorization: `Bearer ${env.OPENAI_TOKEN}`,
        model: 'gpt-4',
    }
}

function optionsToBody(options: AiOptions, config: OpenAiConfig, messages: BaseMessage[]): any {
    const customisation = options.customisation || config.customisation || {};
    const model = options.model || config.model || 'gpt-4';
    const encoder = encoding_for_model(model as any)
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;

    const logit_bias = options.logit && options.logit.length > 0
        ? Object.fromEntries(options.logit.flatMap(word => {
            const tokens = encoder.encode(word);
            return tokens.length === 0 ? [] : [[tokens[0]?.toString(), 50]];
        }))
        : undefined
    return {...customisation, model, logit_bias, temperature, messages};
}

export const openAiClient = (config: OpenAiConfig,): AiClient => {
    let {axios, baseURL, Authorization, model, customisation, debug} = config
    if (!baseURL) throw new Error('baseURL is required for open ai. Have you set up the .env file?');
    const axiosInstance = axios.create({
        baseURL,
        headers: {
            Authorization,
            'Content-Type': 'application/json',
        },
    });
    return async (messages: BaseMessage[], options: AiOptions = {}): Promise<BaseMessage[]> => {
        if (debug) console.log('openAiMessagesClient', messages, config)
        const body = optionsToBody(options, config, messages);
        try {
            const response = await axiosInstance.post(`/v1/chat/completions`, body);
            return response.data.choices.map((x: any) => x.message);
        } catch (error) {
            console.error('Error calling openai:', messages, error);
            throw error;
        }
    }
}
