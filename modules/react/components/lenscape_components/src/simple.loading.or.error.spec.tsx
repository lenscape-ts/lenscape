import { render, screen } from '@testing-library/react';
import {AsyncState} from "@lenscape/async";
import {SimpleLoadingOrError} from "./simple.loading.or.error";
import '@testing-library/jest-dom';

describe('SimpleLoadingOrError', () => {
    const baseProps = {
        whatWeAreLoading: 'data',
        rootId: 'test',
    };

    it('renders loading state correctly', () => {
        const loadingState: AsyncState<null> = { loading: true };

        render(
            <SimpleLoadingOrError
                {...baseProps}
                state={loadingState}
            />
        );

        expect(screen.getByTestId('test-loading-container')).toBeInTheDocument();
        expect(screen.getByTestId('test-loading-text')).toHaveTextContent('Loading data...');
    });

    it('renders error state correctly', () => {
        const errorState: AsyncState<any> = { errors: ['Network Error'] };

        render(
            <SimpleLoadingOrError
                {...baseProps}
                state={errorState}
            />
        );

        expect(screen.getByTestId('test-error-container')).toBeInTheDocument();
        expect(screen.getByTestId('test-error-text')).toHaveTextContent(
            'Error loading data Network Error'
        );
    });

    it('renders nothing when there is no loading or error', () => {
        const dataState: AsyncState<null> = { data: null };

        render(<SimpleLoadingOrError {...baseProps} state={dataState} />);

        expect(screen.queryByTestId('test-loading-container')).not.toBeInTheDocument();
        expect(screen.queryByTestId('test-error-container')).not.toBeInTheDocument();
    });
});
