import {HasType, PipelineDetailsData} from "./agent.card";
import {NameAnd} from "@lenscape/records";
import {LogAnd, NameAndLogAnd, NormalisedLogOptions, normaliseLogOptions} from "./log.options";
import {ErrorsOr, isErrors} from "@lenscape/errors";


export type PipelineDetailsResult<Context> = LogAnd<ErrorsOr<PipelineDetailsData<Context>>>


export type ExecutePipelineDetails<Context, Pipeline> = (p: Pipeline, d: PipelineDetailsData<Context>) => Promise<LogAnd<ErrorsOr<PipelineDetailsData<Context>>>>

export type PipelineExecutors<Context> = NameAnd<ExecutePipelineDetails<Context, any>>
export type ExecutePipelineResult<Context> = NameAndLogAnd<ErrorsOr<PipelineDetailsData<Context>>>

export async function executePipeline<Context, Pipeline extends HasType>(
    executors: PipelineExecutors<Context>,
    data: PipelineDetailsData<Context>,
    details: NameAnd<Pipeline>
): Promise<ExecutePipelineResult<Context>> {
    let pipelineData = data
    const logs: NameAnd<NormalisedLogOptions[]> = {};
    if (details === undefined || Object.keys(details).length === 0) return {errors: ['No pipeline details provided'], logs}

    for (const [name, detail] of Object.entries(details)) {
        const executor = executors[detail.type];
        if (!executor) return {errors: [`Executor not found for pipeline "${name}" of type "${detail.type}"`], logs}

        const {log, ...result} = await executor(detail, pipelineData);
        logs[name] = normaliseLogOptions(log)
        if (isErrors(result)) return {...result, logs}
        pipelineData = result.value
    }
    return {value: pipelineData, logs}
}