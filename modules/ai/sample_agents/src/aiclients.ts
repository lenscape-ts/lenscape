import {AiClients} from "@lenscape/aiclient";
import {Env} from "@lenscape/records";
import {AxiosStatic} from "axios";
import {defaultOpenAiConfig, openAiClient} from "@lenscape/openai";

export const aiClients = (axios: AxiosStatic, env: Env): AiClients => ({
    'openai': openAiClient(defaultOpenAiConfig(axios, env))
})