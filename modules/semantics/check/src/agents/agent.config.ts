import {defaultLookupMessages, PipelineExecutors} from "@lenscape/agents";
import {agentCards, Context, Pipelines} from "./cards";
import axios, {AxiosStatic} from "axios";
import {executeRagIndexLlm, executeRagPipelineDetails, RagFns} from "@lenscape/rag_agents";
import {defaultElasticSearchRagConfig, elasticSearchRag} from "@lenscape/elastic_search_rag";
import {executeLlmPipelineDetails} from "@lenscape/llm_agents";
import {azureAiToken} from "../secrets";
import {Env} from "@lenscape/records";
import {AiClients} from "@lenscape/aiclient";
import {defaultOpenAiConfig, openAiClient} from "@lenscape/openai";
import {azureOpenAiClient, defaultAzureAiConfig} from "@lenscape/azureai";
import {llmSelector} from "@lenscape/llmselector";
import {executeTranslatePipelineDetails} from "@lenscape/llm_agents/src/translate.pipeline";


export const aiClients = (axios: AxiosStatic, env: Env, apiKey: string): AiClients => ({
    'openai': openAiClient({...defaultOpenAiConfig(axios, env), tiktokenEncoder: undefined}),
    'azureai': azureOpenAiClient({...defaultAzureAiConfig(axios, 'https://dev-me.eon.com/proxy', apiKey), tiktokenEncoder: undefined}),
})
export const ai = aiClients(axios, {}, azureAiToken); // Replace '' with your actual API key
export const lookups = defaultLookupMessages({});
// const find = findAgent(ai, agentCards, lookups)
export const rags: RagFns = {
    es: elasticSearchRag(defaultElasticSearchRagConfig())
}

export const allExecutors: PipelineExecutors<Context> = {
    rag: executeRagPipelineDetails(rags),
    llm: executeLlmPipelineDetails(ai, lookups),
    'rag.index.llm': executeRagIndexLlm(ai, lookups),
    'translate': executeTranslatePipelineDetails(ai, lookups)
}
export const llmSel = llmSelector<Context, Pipelines>(aiClients(axios, {}, azureAiToken),
    agentCards.cards,
    defaultLookupMessages({}))
