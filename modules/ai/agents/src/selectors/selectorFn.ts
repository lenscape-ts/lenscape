import {BaseMessage} from "../messages";
import {LogAnd} from "../log.options";
import {ErrorsOr, isErrors} from "@lenscape/errors";
import {NameAnd} from "@lenscape/records";
import {AgentCard, HasLastSelected, HasType} from "../agent.card";

export type SelectorExecuteFn<Context, Selector> = (selector: Selector, context: Context, messages: BaseMessage[]) => Promise<LogAnd<ErrorsOr<string>>>
export type SelectorFn<Context, Selector> = {
    isDefinedAt?: (selector: Selector, context: Context, messages: BaseMessage[]) => boolean
    execute: SelectorExecuteFn<Context, Selector>
}
export type SelectorFns<Context> = NameAnd<SelectorFn<Context, any>>

export type ContextAndSelected<Context> = {
    context: Context
    selected: string
    agentCard: AgentCard<Context, any>
}
export const selectAgent = <Context extends HasLastSelected, Selector extends HasType>(selFns: SelectorFns<Context>, cards: NameAnd<AgentCard<Context, any>>) =>
    async (selector: Selector, context: Context, messages: BaseMessage[]): Promise<LogAnd<ErrorsOr<ContextAndSelected<Context>>>> => {
        const selFn = selFns[selector.type];
        if (!selFn) return {
            errors: [`selector ${selector.type} not found. Legal values are ${Object.keys(selFns).sort()}`],
            log: {whatHappened: `selector.type.not.found`, params: JSON.stringify(selector), severity: 'error'}
        }
        if (selFn.isDefinedAt && !selFn.isDefinedAt(selector, context, messages)) return {
            errors: [`selector.not.defined`],
            log: {whatHappened: `selector.not.defined`, params: [JSON.stringify(context), JSON.stringify(messages)], severity: 'error'}
        }
        const result = await selFn.execute(selector, context, messages)
        if (isErrors(result)) return result
        const key = result.value.toLowerCase()
        const selected = Object.keys(cards).find(name => name.toLowerCase() === key)
        if (!selected) return {
            errors: [`selector.card.not.found`, `Card ${key} not found. Legal values are ${Object.keys(cards).sort()}`],
            log: {whatHappened: `selector.card.not.found`, params: key, severity: 'error'}
        }
        const value: ContextAndSelected<Context> = {
            context: {...context, lastSelected: selected},
            selected,
            agentCard: cards[selected]
        };
        return {
            value,
            log: {whatHappened: `selector.card.found`, params: JSON.stringify({ selectedKey: key, previousContext: context.lastSelected })
    }}
    }
