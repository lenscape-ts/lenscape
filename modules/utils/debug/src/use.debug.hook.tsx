import { useMemo } from "react";
import {DebugLog, DebugState, makeDebugLog} from "./debug";
import {makeContextForState} from "@lenscape/context";


export const {use: useDebugState, Provider: DebugStateProvider} = makeContextForState<DebugState, "debugState">("debugState");

export function useDebug(name: string): DebugLog {
    const [debugState] = useDebugState();
    return useMemo(() =>makeDebugLog(debugState, name), [debugState[name], name]);
}

