import {AgentCard, BaseMessage, defaultDereferenceMessages, DereferenceMessages, LogAnd, LookupMessages, SelectorFn} from "@lenscape/agents";
import {ErrorsOr, isErrors} from "@lenscape/errors";
import {AiClients} from "@lenscape/aiclient";
import {NameAnd} from "@lenscape/records";


export type LlmSelector = {
    type: 'llm'
    model: string
    prefix: BaseMessage[]
    description?: string
}

export const llmSelector = <Context, Pipeline>(aiClients: AiClients, cards: NameAnd<AgentCard<Context, Pipeline>>, lookup: LookupMessages,
                                               deref: DereferenceMessages<any> = defaultDereferenceMessages): SelectorFn<Context, LlmSelector> => ({
    //note no isDefinedAt which defaults to true
    execute: async (selector, context: Context, messages: BaseMessage[]): Promise<LogAnd<ErrorsOr<string>>> => {
        const mainAgentEntries = Object.entries(cards).filter(([name, card]) => card.main !== false);
        const agentCards = mainAgentEntries.map(([name, card]) => `${name}: ${card.purpose}`).join('\n');
        const agentNames = mainAgentEntries.map(([name, card]) => card).sort().join(', ');
        const promptMessages = deref({context, agentNames, agentCards}, lookup(selector.prefix));
        if (isErrors(promptMessages)) return {...promptMessages, log: {whatHappened: 'find.agent.dereference.prefix', severity: 'error'}};

        const aiClient = aiClients[selector.model];
        if (!aiClient) return {
            errors: [`No AI client found for model ${selector.model}. Legal models are: ${Object.keys(aiClients).sort().join(', ')}`],
            log: {whatHappened: 'find.agent.no.client', severity: 'error', params: selector.model}
        };
        const response = await aiClient([...promptMessages.value, ...messages]);
        const lastMessage = response[response.length - 1];
        const lastContent = lastMessage.content.trim();
        return {value: lastContent} //logs would be ignored. The checks about validity are done in the select method to avoid having to have every selector duplicate them
    }
})
