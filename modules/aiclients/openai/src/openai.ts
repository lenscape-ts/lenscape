import axios, {AxiosStatic} from "axios";
import {AiClient, AiOptions} from "@lenscape/aiclient";
import {BaseMessage} from "@lenscape/agents";
import {Env} from "@lenscape/records";
import {encoding_for_model, TiktokenModel} from "tiktoken";

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

function optionsToBody(options: AiOptions, config: OpenAiConfig): any {
    const customisation = options.customisation || config.customisation || {};
    const model = options.model || config.model || 'gpt-4';
    const encoder = encoding_for_model(model as any)
    const temperature = options.temperature;
    const logit_bias = options.logit.length === 0
        ? undefined
        : Object.fromEntries(options.logit.map(word => {
            const firstToken = encoder.encode(word)[0].toString();
            return [firstToken, 50];
        }))
    return {model, logit_bias, temperature, ...customisation};
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
        const body = optionsToBody(options, config);
        try {
            const response = await axiosInstance.post(`/v1/chat/completions`, body);
            return response.data.choices.map((x: any) => x.message);
        } catch (error) {
            console.error('Error calling openai:', messages, error);
            throw error;
        }
    }
}
