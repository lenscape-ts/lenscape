import {HasType} from "../agent.card";
import {BaseMessage} from "../messages";
import {LogAnd} from "../log.options";
import {ErrorsOr} from "@lenscape/errors";
import {SelectorFn, SelectorFns} from "./selectorFn";


export type ChainSelector<Context, Selector> = {
    type: 'chain'
    chain: Selector[]
    description?: string
}


export function chainSelector<Context, Selector extends HasType>(selFns: SelectorFns<Context>): SelectorFn<Context, ChainSelector<Context, Selector>> {
    return {
        isDefinedAt: (selector, context, messages) =>
            selector.chain.some(sel => {
                const selFn = selFns[sel.type];
                return selFn && (!selFn.isDefinedAt || selFn.isDefinedAt(sel, context, messages));
            }),
        execute: async (selector: ChainSelector<Context, Selector>, context: Context, messages: BaseMessage[]): Promise<LogAnd<ErrorsOr<string>>> => {
            for (const sel of selector.chain) {
                const type = sel.type;
                const selFn = selFns[type];
                if (!selFn) return {
                    errors: [`Selector ${type} not found in chain. Legal values are ${Object.keys(selector.chain).join(', ')}`],
                    log: {whatHappened: 'chain.selector.notFound', severity: 'error'}
                }
                if (!selFn.isDefinedAt || selFn.isDefinedAt(selector, context, messages))
                    return selFn.execute(sel, context, messages);
            }
            return {
                errors: [`No selector matched in chain: ${selector.chain.map(s => s.type).join(', ')}`],
                log: {whatHappened: 'chain.selector.noMatch', severity: 'error'}
            }
        }
    }
}
