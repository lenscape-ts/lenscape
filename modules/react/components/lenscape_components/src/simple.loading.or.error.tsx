import {AsyncState, isErrorAs, isLoadingAs} from "@lenscape/async";

export type LoadingOrErrorProps<T> = {
    state: AsyncState<T>
    whatWeAreLoading: string,
    rootId: string,
}


export const SimpleLoadingOrError = <Data, >({
                                                 state,
                                                 whatWeAreLoading,
                                                 rootId,
                                             }: LoadingOrErrorProps<Data>) => {
    if (isLoadingAs(state)) {
        return (
            <div data-testid={`${rootId}-loading-container`}>
                <span data-testid={`${rootId}-loading-text`}>Loading {whatWeAreLoading}...</span>
            </div>
        );
    } else if (isErrorAs(state)) {
        return (
            <div data-testid={`${rootId}-error-container`}>
                <span data-testid={`${rootId}-error-text`}>Error loading {whatWeAreLoading} {state.errors}</span>
            </div>
        );
    }
    return null;
};