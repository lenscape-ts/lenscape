import {LoadingOrErrorProps} from "./lenscape.components";
import {FC} from "react";


export const SimpleLoadingOrError: FC<LoadingOrErrorProps> = <Data, >({
                                                                          state,
                                                                          whatWeAreLoading,
                                                                          rootId,
                                                                      }) => {
    if (state.loading) {
        return (
            <div data-testid={`${rootId}-loading-container`}>
                <span data-testid={`${rootId}-loading-text`}>Loading {whatWeAreLoading}...</span>
            </div>
        );
    } else if (state.error) {
        return (
            <div data-testid={`${rootId}-error-container`}>
                <span data-testid={`${rootId}-error-text`}>Error loading {whatWeAreLoading} {state.error}</span>
            </div>
        );
    }
    return null;
};