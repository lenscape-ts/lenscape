import {BaseMessage} from "./messages";
import {NameAnd} from "@lenscape/records";

/**
 * AgentCards is a type that represents a collection of agent cards and the information needed to say which agent is needed to perform a task
 *
 * @param Context - the type of a blob of json that holds data such as 'user' and 'language' and things we know about the user's preferences
 * @param Pipeline - typically something like type Pipelines = LlmPipelineDetails | RagPipelineDetails | RagIndexLlm<any>
 * @param Selector - typically something like type Selector = FixedSelector| ChainSelector<Context, any>|LlmSelector
 */
export type AgentCards<Context, Pipeline, Selector> = {
    cards: NameAnd<AgentCard<Context, Pipeline>>
    selector: Selector
}

export type AgentCard<Context, Pipeline> = {
    purpose: string
    samples: string[]
    tags: string[]
    /** defaults to true. If false, the agent is a child agent and will not be shown in the main agent selector */
    main?: boolean
    pipeline: NameAnd<Pipeline>
}



export type HasType = {
    type: string
}
export type HasLastSelected = {
    lastSelected?: string
}

export type MessagesOrName = BaseMessage[] | string


export type PipelineDetailsData<Context> = {
    context: Context
    messages: BaseMessage[]
}
