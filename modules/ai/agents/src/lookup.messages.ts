import {MessagesOrName} from "./agent.card";
import {NameAnd} from "@lenscape/records";
import {BaseMessage} from "./messages";

export type LookupMessages = (m?: MessagesOrName) => BaseMessage[]

export function defaultLookupMessages(lookup: NameAnd<BaseMessage[]>): LookupMessages {
    return (m?: MessagesOrName) => {
        if (m === undefined) return [];
        if (typeof m === 'string') {
            const result = lookup[m];
            if (!result) throw new Error(`No messages found for name: ${m}. :Legal values are ${Object.keys(lookup).sort().join(', ')}`);
            return result;
        } else return m;
    };
}