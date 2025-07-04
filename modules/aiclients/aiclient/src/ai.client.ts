import {Authentication} from "@lenscape/auth";
import {BaseMessage} from "@lenscape/agents";
import {NameAnd} from "@lenscape/records";

export type AiClientConfig = {
    baseUrl: string
    auth: Authentication,
    model: string

}

export type AiOptions = {
    model?: string
    temperature?: number
    logit?: string[] // this encourages those words to be used. The client needs to tokenise the words and use the first tokens. Buff is probability is
    customisation?: any
}
export type AiClient = (prompt: BaseMessage[], options?: AiOptions) => Promise<BaseMessage[]>
export type AiClients = NameAnd<AiClient>

export function validateAiClientConfig(prefix: string, config: AiClientConfig): string[] {
    const errors: string[] = []
    if (!config.baseUrl) errors.push(`${prefix}.baseUrl is required`);
    if (typeof config.baseUrl !== 'string') errors.push(`${prefix}.baseUrl must be a string`);
    if (!config.auth) errors.push(`${prefix}.auth is required`);
    if (typeof config.auth !== 'object') errors.push(`${prefix}.auth must be an object`);
    if (config.model) {
        if (typeof config.model !== 'string') errors.push(`${prefix}.model must be a string`);
    } else {
        errors.push(`${prefix}.model is required`);
    }
    return errors
}