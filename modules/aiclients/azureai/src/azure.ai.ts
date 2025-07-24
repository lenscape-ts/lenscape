import {AxiosStatic} from "axios";
import {AiClient, AiOptions} from "@lenscape/aiclient";
import {BaseMessage} from "@lenscape/agents";
import {Env} from "@lenscape/records";
import {getTikTokenEncoder, TikTokenEncoderFn} from "./tiktoken.encoder.filthy.hack";

export type AzureAiConfig = {
    axios: AxiosStatic;
    baseURL: string;
    deploymentId: string; // default fallback deployment ID
    apiVersion: string;   // e.g. '2024-02-15-preview'
    apiKey: string;
    customisation?: any;
    debug?: boolean;
    tiktokenEncoder?: TikTokenEncoderFn;
};

export function defaultAzureAiConfig(axios: AxiosStatic, baseURL: string, env: Env): AzureAiConfig {
    if (!env.AZURE_OPENAI_TOKEN) throw new Error("AZURE_OPENAI_TOKEN is not set in the environment variables");

    return {
        baseURL,
        axios,
        deploymentId: env.AZURE_OPENAI_DEPLOYMENT_ID || "gpt-4o-mini", // Default deployment ID
        apiVersion: env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
        apiKey: env.AZURE_OPENAI_TOKEN,
        tiktokenEncoder: getTikTokenEncoder,
    };
}

async function optionsToBody(options: AiOptions, config: AzureAiConfig, messages: BaseMessage[]): Promise<any> {
    const customisation = options.customisation || config.customisation || {};
    const encoder = await config.tiktokenEncoder?.(options.model || config.deploymentId);
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;

    const logit_bias = config.tiktokenEncoder && options.logit && options.logit.length > 0
        ? Object.fromEntries(options.logit.flatMap(word => {
            const tokens = encoder.encode(word);
            return tokens.length === 0 ? [] : [[tokens[0]?.toString(), 50]];
        }))
        : undefined;

    return {...customisation, temperature, messages, logit_bias};
}

export const azureOpenAiClient = (config: AzureAiConfig): AiClient => {
    const {axios, baseURL, apiVersion, apiKey, debug} = config;


    const axiosInstance = axios.create({
        baseURL,
        headers: {
            'x-proxy': 'azureai',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    });

    return async (messages: BaseMessage[], options: AiOptions = {}): Promise<BaseMessage[]> => {
        if (debug) console.log('azureOpenAiClient', messages, config);

        const activeDeploymentId = options.model || config.deploymentId;
        const path = `/openai/deployments/${activeDeploymentId}/chat/completions?api-version=${apiVersion}`;
        const body = await optionsToBody(options, config, messages);

        try {
            const response = await axiosInstance.post(path, body);
            return response.data.choices.map((x: any) => x.message);
        } catch (error) {
            console.error('Error calling Azure OpenAI:', messages, error);
            throw error;
        }
    };
};
