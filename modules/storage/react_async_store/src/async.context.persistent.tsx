import {Context, createContext, ReactNode, useCallback, useContext, useEffect, useState} from "react";
import {GetterSetter, getterSetterWithDebug, makeUseStateChild, Setter, useThrowError} from "@lenscape/context";
import {AsyncStore} from "@lenscape/async_storage";
import {isErrors, ThrowError} from "@lenscape/errors";
import {capitalizeFirstLetter} from "@lenscape/string_utils";
import {AsyncState, isDataAs} from "@lenscape/async";
import {useLenscapeComponents} from "@lenscape/lenscape_components";


export type ContextForPersistentStateConfig = {
    debug?: boolean
    showStackTrace?: boolean
}
type ProviderProps<Data> = { children: ReactNode, whatWeAreLoading: string, dataIfNoId: Data }

export type PersistentAsyncContextResults<Id, Data> = {
    Provider: (props: ProviderProps<Data>) => ReactNode
    use: (id: Id) => GetterSetter<Data>
    useAsync: (id: Id) => GetterSetter<AsyncState<Data>>
    context: Context<GetterSetter<AsyncState<Data>> | undefined>
}


/** Make a context and helper functions (use, Provider) etc for a 'useState' that is persistent across sessions.
 * @param field the name of the field. This is used to create the context and the provider. It helps with debugging and error messages
 *  @param store the store to use. This is the AsyncStore that will be used to persist the data
 *  @param useId returns an id or null. It might be a custom hook. The classical example of this is something that returns a key for the logged in user.
 * @param debug allows us to set the debugging state
 * The result type is
 *   Provider: (props: { children: ReactNode }) => ReactNode. The classic React provider. Note there is no default value. This is the responsibility of the store
 *     use: () => GetterSetter<Data> The classic useState hook. This is the value of the context
 *     useAsync: () => GetterSetter<AsyncState<Data>> This is like the use hook, but returns the AsyncState<Data> type. This lets you know if it is loading, or if there were errors
 *     context: Context<GetterSetter<AsyncState<Data>> | undefined>
 * */
export function makeContextForAsyncPersistentState<Id, Data, FIELD extends string>(field: FIELD, useId: () => Id, store: AsyncStore<Id, Data>, {
    debug: focusedDebug = false,
    showStackTrace = false
}: ContextForPersistentStateConfig = {}): PersistentAsyncContextResults<Id, Data> {
    const Context = createContext<GetterSetter<AsyncState<Data>> | undefined>(undefined);

    function checkProviderExistsOrThrow(contextValue: GetterSetter<AsyncState<Data>> | undefined, reportError: ThrowError): contextValue is GetterSetter<AsyncState<Data>> {
        if (contextValue === undefined) {
            const fieldWithCap = capitalizeFirstLetter(field);
            return reportError("s/w", `use${fieldWithCap} must be used within a ${fieldWithCap}Provider`);
        }
        return true;
    }

    function useAsyncField(): GetterSetter<AsyncState<Data>> {
        const id = useId();
        const reportError = useThrowError();
        const contextValue = useContext(Context);

        checkProviderExistsOrThrow(contextValue, reportError);
        const [value, rawSetter] = contextValue!;

        function handleSet(newData: AsyncState<Data>) {
            if (focusedDebug) console.log("setting", field, newData);
            rawSetter(newData);
            if (id && isDataAs(newData))
                store.store(id, newData.data)
                    .then(errorsOrVoid => {
                        if (isErrors(errorsOrVoid)) {
                            reportError("network", `Error storing ${field} with id ${JSON.stringify(id)}. data: ${JSON.stringify(newData.data)}\n${JSON.stringify(errorsOrVoid)}`);
                        }
                    }).catch(e => reportError("network", `Error storing ${field}. data: ${JSON.stringify(newData.data)}`, e));
            return newData;
        }

        const setter: Setter<AsyncState<Data>> = useCallback((newValue) =>
            typeof newValue === "function"
                ? rawSetter((oldValue: AsyncState<Data>) => handleSet((newValue as Function)(oldValue)))
                : handleSet(newValue), [rawSetter, id, reportError, store, id]);

        return [value, setter];
    }

    const useField = makeUseStateChild<AsyncState<Data>, Data>(useAsyncField, lb => lb.focusOnSingleKeyVariant("data")) as () => GetterSetter<Data>;


    function FieldProvider(props: ProviderProps<Data>) {
        const rawGetterSetter = useState<AsyncState<Data>>({loading: true, error: null, data: null});
        const [state, setState] = rawGetterSetter;
        const id = useId();
        const {children, whatWeAreLoading, dataIfNoId} = props;
        const {LoadingOrError} = useLenscapeComponents();
        useEffect(() => {
            let alive = true;
            if (id)
                store.get(id)
                    .then((data) =>
                        isErrors(data)
                            ? alive && setState({error: data.errors.join(',')})
                            : alive && setState({data: data.value}))
                    .catch(e =>
                        setState({error: e.message}));
            else
                setState({data: dataIfNoId});
            return () => {
                alive = false;
            };
        }, [store, id]);

        const getterSetter = focusedDebug ? getterSetterWithDebug(rawGetterSetter, field, showStackTrace) : rawGetterSetter;
        return isDataAs(state) ?
            <Context.Provider value={getterSetter}>{children}</Context.Provider>
            : <LoadingOrError state={state} whatWeAreLoading={whatWeAreLoading} rootId={`loading.${field}`}/>;
    }

    return {use: useField, useAsync: useAsyncField, Provider: FieldProvider, context: Context};
}
