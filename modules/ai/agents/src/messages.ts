import {ErrorsOr, flattenArrayOfErrorsOr, mapErrorsOr} from "@lenscape/errors";

export type BaseMessage = {
    role: 'system' | 'user' | 'assistant'
    content: string
}
export const mapMessages = (messages: BaseMessage[], fn: (context: string) => string): BaseMessage[] => messages.map((message) =>
    ({...message, content: fn(message.content)}));

export const mapMessagesErrorsOr = (messages: BaseMessage[], fn: (context: string) => ErrorsOr<string>): ErrorsOr<BaseMessage[]> =>
    flattenArrayOfErrorsOr(messages.map((message) =>mapErrorsOr(fn(message.content), (content) => ({...message, content}))));

