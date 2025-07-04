import {RagBaseMessage} from "./rag.agent";
import {ContextWithQuery, defaultDereferenceMessages, DereferenceMessages, ExecutePipelineDetails, LookupMessages} from "@lenscape/agents";
import {executeLlmPipelineDetails, LlmPipelineDetails} from "@lenscape/llm_agents";
import {AiClients} from "@lenscape/aiclient";

export type RagIndexLlm<Indices extends string> = {
    type: 'rag.index.llm'
    /** Which llm to use */
    pipelines: Record<Indices, LlmPipelineDetails>
    defaultPipeline: LlmPipelineDetails
}


export function executeRagIndexLlm<Context extends ContextWithQuery, Indices extends string>(aiClients: AiClients, lookupMessages: LookupMessages, deref: DereferenceMessages<Context> = defaultDereferenceMessages): ExecutePipelineDetails<Context, RagIndexLlm<Indices>> {
    return async (p, data) => {
        const lastMessage: RagBaseMessage = data.messages[data.messages.length - 1];
        const lastIndex = lastMessage.firstIndex;
        const llmPipeline: LlmPipelineDetails = p.pipelines[lastIndex] || p.defaultPipeline;

        const pipelineResult = await executeLlmPipelineDetails<Context>(aiClients, lookupMessages, deref)(llmPipeline, data);
        return pipelineResult

    }
}