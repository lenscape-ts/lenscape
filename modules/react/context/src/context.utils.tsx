import React, {
    Context,
    createContext,
    Dispatch,
    ReactElement,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useState
} from "react";
import {capitalizeFirstLetter} from "@lenscape/string_utils";
import {useThrowError} from "./use.throw.error";

export type ContextForPersistentStateConfig = {
    debug?: boolean
    showStackTrace?: boolean
}

export type Setter<T> = Dispatch<SetStateAction<T>>
export type GetterSetter<T> = [T, Setter<T>]

export function getterSetterWithDebug<T>(getterSetter: GetterSetter<T>, debugName: string, showStackTrace: boolean): GetterSetter<T> {
    const [getter, setter] = getterSetter;
    const setterWithDebug = (newValue: T | ((prevState: T) => T)) => {
        console.log(`${debugName} setter called with value:`, newValue);
        if (showStackTrace) {
            const stack = new Error().stack;
            console.log(`${capitalizeFirstLetter(debugName)} stack trace:\n`, stack?.substring(7));
        }
        setter(newValue);
    };
    return [getter, setterWithDebug];
}

export type ContextResults<Data, FIELD extends string> = {
    use: () => Data
    Provider: (props: { children: ReactNode } & Record<FIELD, Data>) => ReactElement
    context: Context<Data | undefined>
}

export function makeContextFor<Data, FIELD extends string>(
    field: FIELD,
    defaultValue?: Data,
): ContextResults<Data, FIELD> {
    // Create the context dynamically
    const context = createContext<Data | undefined>(defaultValue);


    function useField(): Data {
        const contextValue = useContext(context);
        const throwError = useThrowError();
        if (contextValue === undefined) {
            const upperedName = capitalizeFirstLetter(field);
            return throwError("s/w", `use${upperedName} must be used within a ${upperedName}Provider`);
        }
        return contextValue!;
    }

    type ProviderProps = { children: ReactNode, allowUndefined?: boolean } & Record<FIELD, Data>;

    // Provider component dynamically named like `${field}Provider`
    function FIELDProvider(props: ProviderProps) {
        const value = props[field];
        if (value === undefined && !props.allowUndefined) throw new Error(`${field} cannot be undefined.`);
        return <context.Provider value={props[field]}>{props.children}</context.Provider>;
    }

    // Return context, hook, and provider with dynamic names
    return {use: useField, Provider: FIELDProvider, context};
}


export type ContextResultsForState<Data, FIELD extends string> = {
    use: () => GetterSetter<Data>
    Provider: (props: { children: ReactNode } & Record<FIELD, Data>) => ReactNode
    context: Context<GetterSetter<Data> | undefined>
}

export type ContextForStateConfig = ContextForPersistentStateConfig&  {
    allowedUndefined?: boolean
}

export function makeContextForState<Data, FIELD extends string>(field: FIELD, {
    allowedUndefined = false,
    debug = false,
    showStackTrace = false
}: ContextForStateConfig = {}): ContextResultsForState<Data, FIELD> {
    const Context = React.createContext<GetterSetter<Data> | undefined>(undefined);

    function useField() {
        const contextValue = useContext(Context);
        const reportError = useThrowError();
        if (contextValue === undefined && !allowedUndefined) {
            const fieldWithCap = capitalizeFirstLetter(field);
            reportError("s/w", `use${fieldWithCap} must be used within a ${fieldWithCap}Provider`);
        }
        return contextValue!;
    }

    type ProviderProps = { children: ReactNode } & Record<FIELD, Data>;

    function FieldProvider(props: ProviderProps) {
        const rawFetterSetter = useState<Data>(props[field]);
        const getterSetter = debug ? getterSetterWithDebug(rawFetterSetter, field, showStackTrace) : rawFetterSetter;
        useEffect(() => {
            if (debug) {
                console.log(`${capitalizeFirstLetter(field)}Provider:`, props[field]);
            }
        }, []);
        return <Context.Provider value={getterSetter}>{props.children}</Context.Provider>;
    }

    return {use: useField, Provider: FieldProvider, context: Context};
}


