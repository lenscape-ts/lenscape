import {MessagesOrName, PipelineDetailsData} from "../agent.card";
import {LookupMessages} from "../lookup.messages";
import {defaultDereferenceMessages, DereferenceMessages} from "../dereference.messages";
import {ExecutePipelineDetails} from "../execute.pipeline";
import {LogAnd} from "../log.options";
import {ErrorsOr, isErrors} from "@lenscape/errors";


export type AddPrefixPipelineDetails = {
    type: 'add-prefix'
    prefix: MessagesOrName
}

export const executeAddPrefixPipelineDetails = <Context>(lookup: LookupMessages, deref: DereferenceMessages<any> = defaultDereferenceMessages): ExecutePipelineDetails<Context, AddPrefixPipelineDetails> =>
    async (p: AddPrefixPipelineDetails, {context, messages}: PipelineDetailsData<Context>): Promise<LogAnd<ErrorsOr<PipelineDetailsData<Context>>>> => {
        const prefixMessages = deref({context}, lookup(p.prefix))
        if (isErrors(prefixMessages)) return {...prefixMessages, log: {whatHappened: 'Error dereferencing prefix messages', params: JSON.stringify(p.prefix)}}
        return {
            value: {context, messages: [...prefixMessages.value, ...messages]},
            log: {whatHappened: 'Added prefix messages', params: JSON.stringify(prefixMessages)}
        }

    }