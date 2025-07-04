import {SelectorFn} from "./selectorFn";


export type FixedSelector = {
    type: 'fixed';
    select: string
    description?: string;
}

export const fixedSelector: SelectorFn<any, FixedSelector> = {
    execute: async (selector) => ({
        value: selector.select,
        log: {whatHappened: 'fixed.select', params: selector.select}
    })
}