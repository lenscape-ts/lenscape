import {makeContextFor} from "@lenscape/context";
import {AiClient} from "@lenscape/aiclient";
import {AgentCards, SelectorFn} from "@lenscape/agents";
import {Context, Pipelines, Selector} from "./agents/cards";
import {LlmSelector} from "@lenscape/llmselector";

export const {use: useAiClient, Provider: AiClientProvider} = makeContextFor<AiClient, 'aiClient'>('aiClient')

export const {use: useSelectorFn, Provider: SelectorFnProvider} = makeContextFor<SelectorFn<Context, LlmSelector>, 'selectorFn'>('selectorFn')

export const {use: useAgentCards, Provider: AgentCardsProvider} = makeContextFor<AgentCards<Context, Pipelines, Selector>, 'agentCards'>('agentCards')