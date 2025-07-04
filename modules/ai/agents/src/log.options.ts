import {NameAnd} from "@lenscape/records";
import {toArray} from "@lenscape/arrays";

export type Severity = 'debug' | 'info' | 'warn' | 'error'

export type LogOptions = {
    whatHappened: string
    params?: string | string[]
    severity?: Severity
}
export type NormalisedLogOptions = Required<LogOptions>
export type LogOptionOrString = LogOptions | string
export type LogOptionInResult = LogOptionOrString | LogOptionOrString[]
export type LogAnd<T> = T & { log?: LogOptionInResult }
export type NameAndLogAnd<T> = T & { logs: NameAnd<NormalisedLogOptions[]> }

export function normaliseLogOptions(l?: LogOptionInResult): NormalisedLogOptions[] {
    if (!l) return [];
    const logsArray = Array.isArray(l) ? l : [l];

    return logsArray.map((entry: (LogOptions | string)) => {
        return typeof entry === 'string'
            ? {whatHappened: entry, severity: 'info', params: []}
            : {whatHappened: entry.whatHappened, severity: entry.severity || 'info', params: toArray(entry.params),};
    });
}