import {AiClients} from "@lenscape/aiclient";
import {Env} from "@lenscape/records";
import {AxiosStatic} from "axios";
import {defaultOpenAiConfig, openAiClient} from "@lenscape/openai";
import {azureOpenAiClient, defaultAzureAiConfig} from "@lenscape/azureai";

export const aiClients = (axios: AxiosStatic, env: Env, apiKey: string): AiClients => ({
    'openai': openAiClient({...defaultOpenAiConfig(axios, env), tiktokenEncoder: undefined}),
    'azureai': azureOpenAiClient({...defaultAzureAiConfig(axios, 'https://api.openai.azure.com', apiKey), tiktokenEncoder: undefined}),
})