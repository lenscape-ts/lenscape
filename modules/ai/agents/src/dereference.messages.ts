import {dereference, dollarsBracesVarDefn} from "@lenscape/template";
import {BaseMessage, mapMessages, mapMessagesErrorsOr} from "./messages";
import {ErrorsOr, flattenArrayOfErrorsOr, mapErrorsOr} from "@lenscape/errors";

export type DereferenceMessages<Dictionary> =
    (dictionary: Dictionary, messages: BaseMessage[]) => ErrorsOr<BaseMessage[]>

export const defaultDereferenceMessages: DereferenceMessages<any> =
    (dictionary: any, messages: BaseMessage[]): ErrorsOr<BaseMessage[]> =>
        mapMessagesErrorsOr(messages, content => ({
            value: dereference('messages', dictionary, content, {variableDefn: dollarsBracesVarDefn})
        }))
