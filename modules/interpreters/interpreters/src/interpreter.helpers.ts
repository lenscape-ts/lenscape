import {BaseEvent, ErrorEvent, isErrorEvent, isIdEvent} from "@lenscape/events";
import {collect} from "@lenscape/arrays";
import {GetAsyncStore} from "@lenscape/async_storage";
import {NameAnd} from "@lenscape/records";
import {Errors, ErrorsOr, isErrors} from "@lenscape/errors";

export const allEventIds = (e: BaseEvent[]): string[] =>
    [...new Set(collect(e, isIdEvent).map(e => e.id))].sort();


export type IdToValuesAndErrors<T> = {
    idToValues: Map<string, T>,
    idToErrors: NameAnd<Errors>
}
export const getAllValuesAndErrorsFromIds = async <T>(asyncStore: GetAsyncStore<string, T>, events: BaseEvent[]): Promise<IdToValuesAndErrors<T>> => {
    const allIds = allEventIds(events)
    const idToValues = new Map<string, any>()
    const idToErrors: NameAnd<Errors> = {}
    await Promise.all(allIds.map(id =>
        asyncStore.get(id).then(errorOrResult => {
            if (isErrors(errorOrResult)) idToErrors[id] = errorOrResult
            else idToValues.set(id, errorOrResult.value)
        })
    ))
    return {idToValues, idToErrors}
}
export const getAllValuesFromIds = async <T>(asyncStore: GetAsyncStore<string, T>, events: BaseEvent[]): Promise<ErrorsOr<Map<string, T>>> => {
    const {idToValues, idToErrors} = await getAllValuesAndErrorsFromIds(asyncStore, events)
    const errors = Object.values(idToErrors);
    if (errors.length > 0) return {errors: errors.flatMap(e => e.errors)}
    return {value: idToValues}
}

export const getAllErrorsFromEvents = (events: BaseEvent[]): ErrorEvent[] =>
    collect(events, isErrorEvent)