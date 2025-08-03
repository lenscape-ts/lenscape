import {defaultDereferenceMessages, DereferenceMessages, ExecutePipelineDetails, LookupMessages, MessagesOrName, PipelineDetailsData} from "@lenscape/agents";
import {AiClients} from "@lenscape/aiclient";
import {LogAnd} from "@lenscape/agents";
import {ErrorsOr, isErrors} from "@lenscape/errors";

export type LlmPipelineDetails = {
    type: 'llm'
    /** The name of the agent client to use */
    agent: string
    /** Note that the content of the prefix is a template, using ${}
     * We could have the extra step addPrefix, but pretty much every LLM needs this so it's done here*/
    prefix?: MessagesOrName
}

export const executeLlmPipelineDetails = <Context>(aiClients: AiClients, lookup: LookupMessages, deref: DereferenceMessages<any> = defaultDereferenceMessages): ExecutePipelineDetails<Context, LlmPipelineDetails> =>
    async (p: LlmPipelineDetails, {context, messages}: PipelineDetailsData<Context>): Promise<LogAnd<ErrorsOr<PipelineDetailsData<Context>>>> => {
        const prefixMessages = deref({context}, lookup(p.prefix))
        const aiClient = aiClients[p.agent];
        if (isErrors(prefixMessages)) return {...prefixMessages, log: {whatHappened: 'Error dereferencing prefix messages', params: JSON.stringify(p.prefix)}}

        const llmMessages = [...prefixMessages.value, ...messages];
        const response = await aiClient(llmMessages)
        const result = {value: {context, messages: [...messages, ...response.map(({content, role}) => ({role, content}))]},
            log: {whatHappened: 'executedLlmPipelineDetails', params: [...llmMessages, response].map(m => JSON.stringify(m))}}
        return result
    }
