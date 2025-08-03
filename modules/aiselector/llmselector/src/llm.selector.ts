import {AgentCard, BaseMessage, ContextAndSelected, defaultDereferenceMessages, DereferenceMessages, LogAnd, LookupMessages, SelectorFn} from "@lenscape/agents";
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
    execute: async (selector, context: Context, messages: BaseMessage[]): Promise<LogAnd<ErrorsOr<ContextAndSelected<Context>>>> => {
        const mainAgentEntries = Object.entries(cards).filter(([name, card]) => card.main !== false);
        const agentPurposes = mainAgentEntries.map(([name, card]) => `${name}: ${card.purpose}`).join('\n');
        const agentNames = mainAgentEntries.map(([name, card]) => name).sort();
        const agentSummary = mainAgentEntries.map(([name, card]) =>
            `* ${name}: 
${card.purpose}. Sample questions: ${card.samples.map(q => `" - ${q}"`).join('\n')}`
        ).join('\n');
        const promptMessages = deref({context, agentNames: agentNames.join(', '), agentPurposes, agentSummary}, lookup(selector.prefix));
        if (isErrors(promptMessages)) return {...promptMessages, log: {whatHappened: 'find.agent.dereference.prefix', severity: 'error'}};

        const aiClient = aiClients[selector.model];
        if (!aiClient) return {
            errors: [`No AI client found for model ${selector.model}. Legal models are: ${Object.keys(aiClients).sort().join(', ')}`],
            log: {whatHappened: 'find.agent.no.client', severity: 'error', params: selector.model}
        };
        const response = await aiClient([...promptMessages.value, ...messages], {logit: agentNames, temperature: 0.1});
        const lastMessage = response[response.length - 1];
        const lastContent = lastMessage.content.trim();
        return {
            value: {selected: lastContent, context},
            log: {whatHappened: 'llm.selector.agent.selected', params: JSON.stringify(promptMessages, null, 2)}
        }
    }
})
