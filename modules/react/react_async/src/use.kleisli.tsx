import React, {useEffect, useState} from "react";

// Kleisli is a function that takes an input and returns a promise of an output.
// Mathematically, it represents an operation in a "Kleisli category."
export type Kleisli<Input, Output> = (input: Input) => Promise<Output>;

// Encapsulates the async operation's lifecycle state.
export interface AsyncState<Output> {
    data: Output | null;
    loading: boolean;
    error: string | null;
}

// Utility functions for interpreting AsyncState.
export function isLoading<Output>(state: AsyncState<Output>): boolean {
    return state.loading;
}

export function hasError<Output>(state: AsyncState<Output>): boolean {
    return state.error !== null;
}

export function hasData<Output>(state: AsyncState<Output>): boolean {
    return state.data !== null;
}

const defaultErrorHandler = (error: string) => {
    console.error("Error", error);
};

/**
 * A general-purpose hook for handling asynchronous operations via a Kleisli triple (input: Input) => Promise<Output).
 *
 * This hook is focused purely on managing the async lifecycle (loading, data, error).
 * Domain-specific concerns, such as transforming or formatting the results, should be handled
 * outside of this hook to maintain separation of concerns.
 *
 * Key Features:
 * - Automatically re-runs when the `kleisli` function or `input` changes.
 * - Handles cancellation of asynchronous calls to avoid state updates on unmounted components.
 * - Enforces clear state management for asynchronous operations (`loading`, `data`, `error`).
 *
 * **Important Usage Notes:**
 * 1. The `kleisli` function must be stable (memoized using `useCallback` or defined outside the component).
 *    Passing unstable functions will cause unnecessary re-renders or infinite loops.
 * 2. This hook is not responsible for domain-specific logic. If the result of `kleisli` needs transformation,
 *    perform it outside this hook (e.g., in the parent component or the `kleisli` function itself).
 * 3. Avoid prematurely updating state by relying on the `isMounted` flag. This ensures safe async state updates
 *    only while the component is mounted.
 */

export function useKleisli<Input, Output>(
    kleisli: Kleisli<Input, Output>,
    input: Input,
    onError: (error: string) => void = defaultErrorHandler // Optional parameter with a default
): AsyncState<Output> {
    const [state, setState] = useState<AsyncState<Output>>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let isMounted = true;

        setState({data: null, loading: true, error: null});

        kleisli(input)
            .then((data) => {
                if (isMounted) {
                    setState({data, loading: false, error: null});
                }
            })
            .catch((err) => {
                const errorMessage = err instanceof Error ? err.message : String(err);
                if (isMounted) {
                    setState({data: null, loading: false, error: errorMessage});
                    onError(errorMessage); // Call the onError handler
                }
            });

        return () => {
            isMounted = false;
        };
    }, [kleisli, input, onError]);

    return state;
}