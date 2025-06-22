import {BaseEvent} from "@lenscape/events";
import {AsyncState, isDataAs} from "@lenscape/async";
import {EventAsyncStore} from "@lenscape/event_storage";
import {createContext, ReactElement, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {useThrowError} from "@lenscape/context";
import {capitalizeFirstLetter} from "@lenscape/string_utils";
import {isErrors} from "@lenscape/errors";
import {InterpreterPlugIn} from "@lenscape/interpreter";


export type AsyncStateEventStore<T> = {
    change: (e: BaseEvent) => void
    state: AsyncState<T>
    events: AsyncState<BaseEvent[]>
    reset: () => void
}


export function makeContextForEventStore<Field extends string, Id, T>(field: Field, interpreter: InterpreterPlugIn<T>) {
    // Create the context dynamically
    const context = createContext<AsyncStateEventStore<T> | undefined>(undefined);

    function useField(): AsyncStateEventStore<T> {
        const contextValue = useContext(context);
        const throwError = useThrowError();
        if (contextValue === undefined) {
            const upperedName = capitalizeFirstLetter(field);
            return throwError("s/w", `use${upperedName} must be used within a ${upperedName}Provider`);
        }
        return contextValue!;
    }

    type ProviderProps = { children: ReactNode, id: Id } & Record<Field, EventAsyncStore<Id>>;

    function Provider(props: ProviderProps): ReactElement {
        const {id, children} = props;
        const asyncStore: EventAsyncStore<Id> = props[field];
        const [state, setState] = useState<AsyncState<T>>({loading: true})
        const [events, setEvents] = useState<AsyncState<BaseEvent[]>>({loading: true})
        const reportError = useThrowError();

        function reset() {
            const {execute, initial} = interpreter
            console.log('resetting', id)
            setState({loading: true})
            setEvents({loading: true})
            console.log('calling async store')
            asyncStore.get(id).then(async (events) => {
                console.log('async store returned', events)
                if (isErrors(events)) {
                    console.log('setting errors', events)
                    setState    ({errors: events.errors})
                }
                else {
                    setEvents({data: events.value})
                    const value = await execute(events.value, initial);
                    if (isErrors(value)) setState({errors: value.errors})
                    else setState({data: value.value})
                }
            })
        }

        useEffect(reset, [asyncStore, id, interpreter]);

        const change = useMemo(() => async event => {
            const {execute, initial} = interpreter
            if (isDataAs(state) && isDataAs(events)) {
                const newValue = await execute([event], initial);
                if (isErrors(newValue)) setState({errors: newValue.errors})
                else {
                    const newEvents = await asyncStore.append(id, event);
                    if (isErrors(newEvents))
                        setEvents({errors: newEvents.errors})
                    else {
                        setState({data: newValue.value})
                        setEvents({data: [...events.data, event]})
                    }
                }
            } else {// this is bad. We have just lost data...
                return reportError('state', `state is not suitable for change ${JSON.stringify(state)}`);
            }
        }, [asyncStore, id, interpreter, events, state]);

        const value = {change, state, events, reset}
        return <context.Provider value={value}> {children} </context.Provider>;
    }

    return {use: useField, Provider, context};
}