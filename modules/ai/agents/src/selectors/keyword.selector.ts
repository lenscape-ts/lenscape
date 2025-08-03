import {SelectorFn} from "./selectorFn";
import {BaseMessage} from "../messages";


/** Selects this if the keyword is present in the text */
export type KeywordSelector = {
    type: 'keywords';
    keywords: string[]
    select: string
    description?: string
}

function find(keywords: string[], messages: BaseMessage[]): boolean {
    if (!messages.length) return false;
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    const lastMessage = messages[messages.length - 1];
    const words = lastMessage.content.split(/\s+/).filter(Boolean).map(s => s.toLowerCase());
    return words.some(word => lowerKeywords.includes(word));
}

export const keywordSelector: SelectorFn<any, KeywordSelector> = {
    isDefinedAt: (selector, context, messages) => find(selector.keywords, messages),
    execute: async (selector, context, messages) =>
        find(selector.keywords, messages)
            ? {value: {selected:selector.select, context}}
            : {errors: [`No keyword found in the last message. Expected one of ${selector.keywords}`], log: {whatHappened: 'selector.keyword.execute', severity: 'error'}}
}