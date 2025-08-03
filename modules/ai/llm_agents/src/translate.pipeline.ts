import {ContextWithQuery, defaultDereferenceMessages, DereferenceMessages, ExecutePipelineDetails, LookupMessages, MessagesOrName, PipelineDetailsData} from "@lenscape/agents";
import {AiClients} from "@lenscape/aiclient";
import {LogAnd} from "@lenscape/agents";
import {ErrorsOr, isErrors} from "@lenscape/errors";
import {dereference, dollarsBracesVarDefn} from "@lenscape/template";

/** Translates the last message in the pipeline using an LLM agent. */
export type TranslatePipelineDetails = {
    type: 'translate'
    /** The name of the agent client to use */
    agent: string
    prompt?: string
}
export type TranslateContext = {
    targetLanguage?: string //defaults to English
}
export const defaultPrompt = "Translate the following text to ${targetLanguage}: ${lastMessage}. If it is already in ${targetLanguage}, just return the text. Don't return any text other than the translation"

export const executeTranslatePipelineDetails = <Context extends TranslateContext & ContextWithQuery>(aiClients: AiClients, lookup: LookupMessages, deref: DereferenceMessages<any> = defaultDereferenceMessages): ExecutePipelineDetails<Context, TranslatePipelineDetails> =>
    async (p: TranslatePipelineDetails, {context, messages}: PipelineDetailsData<Context>): Promise<LogAnd<ErrorsOr<PipelineDetailsData<Context>>>> => {
        const lastMessage = messages[messages.length - 1]
        if (!lastMessage) return {errors: ['No messages to translate'], log: {whatHappened: 'No messages to translate', params: JSON.stringify(messages)}};
        const targetLanguage = context.targetLanguage || 'English';
        const content = dereference('prompt for translate', {lastMessage: lastMessage.content, targetLanguage}, p.prompt || defaultPrompt, {variableDefn: dollarsBracesVarDefn})
        const aiClient = aiClients[p.agent];
        const response = await aiClient([{role: 'user', content}]);
        const firstResponse = response[0];
        const newMessages = [...messages.splice(0, messages.length - 1), firstResponse]

        const newContext: Context = {...context, query: firstResponse.content}
        const result: LogAnd<ErrorsOr<PipelineDetailsData<Context>>> =
            {value: {context: newContext, messages: newMessages}, log: {whatHappened: 'executedLlmPipelineDetails', params: [content, firstResponse.content]}}
        return result
    }
