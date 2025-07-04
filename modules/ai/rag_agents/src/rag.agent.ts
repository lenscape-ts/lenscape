import {BaseMessage, ContextWithQuery, ExecutePipelineDetails, PipelineDetailsData} from "@lenscape/agents";
import {LogAnd} from "@lenscape/agents/src/log.options";
import {ErrorsOr, isErrors} from "@lenscape/errors";
import {NameAnd} from "@lenscape/records";

export type CommonRagPipelineDetails = {
    source: string
    /** obvious influenced by elastic search. The indicies are 'places in the source' to search */
    indices: string[]
    top: number
}
export type RagPipelineDetails = CommonRagPipelineDetails & {
    type: 'rag'
}

export type RagBaseMessage = BaseMessage & {
    firstIndex?: string
}
export type RagFn = (query: string, indices: string[], top: number) => Promise<ErrorsOr<RagBaseMessage[]>>
export type RagFns = NameAnd<RagFn>

export const executeRagPipelineDetails = <Context extends ContextWithQuery>(rags: RagFns): ExecutePipelineDetails<Context, CommonRagPipelineDetails> =>
    async ({source, indices, top}: CommonRagPipelineDetails, {context, messages}: PipelineDetailsData<Context>): Promise<LogAnd<ErrorsOr<PipelineDetailsData<Context>>>> => {
        const rag: RagFn = rags[source];
        if (!rag) return {errors: [`Unknown rag source ${source}. Legal values are ${Object.keys(rags).sort()}`], log: {whatHappened: 'Rag function unknown source ', params: source, severity: 'error'}}
        const ragMessages = await rag(context.query, indices, top);
        if (isErrors(ragMessages)) return {...ragMessages, log: {whatHappened: 'Rag function failed', severity: 'error'}};
        return {value: {context, messages: [...messages, ...ragMessages.value]}}
    }




