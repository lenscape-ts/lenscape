import {createContext, useContext} from "react";
import {ThrowError} from "@lenscape/errors";

export const defaultThrowError: ThrowError =
    (type, message, error) => {
        if (error) console.error(error)
        throw new Error(`${type}: ${message}`)
    }
export const ThrowErrorContext = createContext<ThrowError>(defaultThrowError)

export function useThrowError(): ThrowError  {
    const context = useContext(ThrowErrorContext)
    if (context === undefined) {
        throw new Error("useThrowError must be used within a ThrowErrorProvider")
    }
    return context
}