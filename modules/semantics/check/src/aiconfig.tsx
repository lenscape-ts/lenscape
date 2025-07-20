import {makeContextFor} from "@lenscape/context";
import {AiClient, AiClients} from "@lenscape/aiclient";

export const {use: useAiClient, Provider: AiClientProvider} = makeContextFor<AiClient, 'aiClient'>('aiClient')