import {ContextWithQuery, FixedSelector, HasLastSelected} from "@lenscape/agents";
import {LlmPipelineDetails} from "@lenscape/llm_agents";
import {RagPipelineDetails} from "@lenscape/rag_agents";
import {RagIndexLlm} from "@lenscape/rag_agents/src/rag.index.llm";
import {ChainSelector} from "@lenscape/agents/src/selectors/chain.selector";
import {LlmSelector} from "@lenscape/llmselector";
import {KeywordSelector} from "@lenscape/agents/src/selectors/keyword.selector";

export type Context = ContextWithQuery & HasLastSelected
export type Pipelines = LlmPipelineDetails | RagPipelineDetails | RagIndexLlm<any>
export type Selector = FixedSelector | ChainSelector<Context, any> | LlmSelector | KeywordSelector