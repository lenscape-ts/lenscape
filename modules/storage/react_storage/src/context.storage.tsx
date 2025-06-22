import {Context, createContext, ReactNode, useCallback, useContext, useState} from "react";
import {
    ContextForPersistentStateConfig,
    GetterSetter,
    getterSetterWithDebug,
    Setter,
    useThrowError
} from "@lenscape/context";
import {IStorage} from "@lenscape/storage";

import {isErrors, ThrowError} from "@lenscape/errors";
import {capitalizeFirstLetter} from "@lenscape/string_utils";
import {Codec} from "@lenscape/codec";


export type ContextResultsForSyncPersistentState<Data, FIELD extends string> = {
    Provider: (props: { children: ReactNode } & Record<FIELD, Data>) => ReactNode;
    use: () => GetterSetter<Data>;
    context: Context<GetterSetter<Data> | undefined>;
};

export type SyncPersistentStateConfig<Data> = {
    storage: IStorage;
    key: string;
    codec: Codec<Data>;
};

/**
 * Creates a React context and hooks for a synchronous, persistent piece of state.
 */
export function makeContextForSyncPersistentState<Data, FIELD extends string>(
    field: FIELD,
    {storage, key, codec}: SyncPersistentStateConfig<Data>,
    {debug: focusedDebug = false, showStackTrace = false}: ContextForPersistentStateConfig = {},
): ContextResultsForSyncPersistentState<Data, FIELD> {
    const Context = createContext<GetterSetter<Data> | undefined>(undefined);

    function checkProviderExistsOrThrow(
        contextValue: GetterSetter<Data> | undefined,
        reportError: ThrowError,
    ): contextValue is GetterSetter<Data> {
        if (contextValue === undefined) {
            const fieldWithCap = capitalizeFirstLetter(field);
            return reportError("s/w", `use${fieldWithCap} must be used within a ${fieldWithCap}Provider`);
        }
        return true;
    }

    function useField(): GetterSetter<Data> {
        const contextValue = useContext(Context);
        const reportError = useThrowError();
        checkProviderExistsOrThrow(contextValue, reportError);
        const [value, rawSetter] = contextValue!;

        function saveData(data: Data) {
            const serialized = codec.encode(data);
            if (focusedDebug) console.log("setting", field, data, serialized);
            if (isErrors(serialized)) {
                return reportError(
                    "validation",
                    `Error encoding ${field}. data: ${JSON.stringify(data)}\n${JSON.stringify(serialized)}`,
                );
            }
            storage.setItem(key, serialized.value);
        }

        const setter: Setter<Data> = useCallback(
            (newValue) => {
                let nextData: Data;
                if (typeof newValue === "function") {
                    rawSetter((old) => {
                        const d = (newValue as (s: Data) => Data)(old);
                        nextData = d;
                        return d;
                    });
                } else {
                    nextData = newValue;
                    rawSetter(newValue);
                }
                saveData(nextData!);
                return nextData!;
            },
            [rawSetter, storage, key, codec, reportError, field, focusedDebug],
        );

        return [value, setter];
    }

    type ProviderProps = { children: ReactNode } & Record<FIELD, Data>;

    function FieldProvider(props: ProviderProps) {
        const reportError = useThrowError();
        const initialValue = props[field];

        function getData(): Data {
            const str = storage.getItem(key);
            if (str === null) return initialValue;
            const decoded = codec.decode(str);
            if (isErrors(decoded)) {
                return reportError(
                    "validation",
                    `Error decoding ${field}. data: ${JSON.stringify(str)}\n${JSON.stringify(decoded)}`,
                );
            }
            return decoded.value;
        }

        const rawGetterSetter = useState<Data>(getData);
        const getterSetter = focusedDebug
            ? getterSetterWithDebug(rawGetterSetter, field, showStackTrace)
            : rawGetterSetter;

        return <Context.Provider value={getterSetter}>{props.children}</Context.Provider>;
    }

    return {use: useField, Provider: FieldProvider, context: Context};
}
