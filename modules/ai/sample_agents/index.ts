import {aiClients} from "./src/aiclients";
import axios from "axios";
import {BaseMessage, defaultLookupMessages, executePipeline, PipelineExecutors} from "@lenscape/agents";
import {executeRagPipelineDetails, RagFns} from "@lenscape/rag_agents";
import {executeLlmPipelineDetails} from "@lenscape/llm_agents";
import {defaultElasticSearchRagConfig, elasticSearchRag} from "@lenscape/elastic_search_rag";
import {executeRagIndexLlm} from "@lenscape/rag_agents/src/rag.index.llm";
import {Context} from "./src/domain";
import {ragDrivenAgentCard} from "./src/agents2";


const ai = aiClients(axios, process.env)
const lookups = defaultLookupMessages({});
// const find = findAgent(ai, agentCards, lookups)
const rags: RagFns = {
    es: elasticSearchRag(defaultElasticSearchRagConfig())
}

const executors: PipelineExecutors<Context> = {
    rag: executeRagPipelineDetails(rags),
    llm: executeLlmPipelineDetails(ai, lookups),
    'rag.index.llm': executeRagIndexLlm(ai, lookups)
}


const query = 'how to fill in my timesheets'
const messages: BaseMessage[] = [{role: 'user', content: query}]

const context: Context = {query}

console.log(messages)
//for agents
// find(context, messages).then(async found => {
//     console.log('Found agent:', found);
//     if (isErrors(found)) return
//     const agent: AgentCard<Context, Pipelines> = agentCards.cards[found.value];
//     console.log('Agent details:', agent);
//     const data = {context, messages}
//     const result = await executePipeline(executors, data, agent.pipeline)
//     console.log('Pipeline result:', JSON.stringify(result, null,2));
// })

//for agents2
const agent = ragDrivenAgentCard
const data = {context, messages}
executePipeline(executors, data, agent.pipeline)
    .then(result =>
        console.log('Pipeline result:', JSON.stringify(result, null, 2)))

