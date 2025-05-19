import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LenscapeComponentsProvider } from '@lenscape/lenscape_components';
import { isLoadingAs, isErrorAs, isDataAs } from '@lenscape/async';
import { makeContextForAsyncPersistentState } from './async.context.persistent';
import { AsyncStore } from '@lenscape/async_storage';

// Wrap UI with LenscapeComponentsProvider to supply LoadingOrError
function renderWithProvider(ui: React.ReactElement) {
    return render(
        <LenscapeComponentsProvider
            lenscapeComponents={{
                LoadingOrError: ({ whatWeAreLoading }: any) => (
                    <div data-testid="loading-error">{whatWeAreLoading}</div>
                ),
            }}
        >
            {ui}
        </LenscapeComponentsProvider>
    );
}

type StoreData = string;

describe('makeContextForAsyncPersistentState', () => {
    let useId: jest.Mock<string | null>;
    let store: AsyncStore<string, StoreData>;
    let Provider: React.ComponentType<any>;
    let useAsync: (id: string) => [any, any];

    beforeEach(() => {
        useId = jest.fn(() => 'id1');
        store = { get: jest.fn(), store: jest.fn() } as any;

        const ctx = makeContextForAsyncPersistentState(
            'testField',
            useId,
            store,
            {}
        );
        Provider = ctx.Provider;
        useAsync = ctx.useAsync;
    });

    const AsyncConsumer: React.FC = () => {
        const [state, setState] = useAsync('id1');
        let display: string;
        if (isLoadingAs(state)) display = 'loading';
        else if (isErrorAs(state)) display = state.error!;
        else display = state.data!;
        return (
            <>
                <div data-testid="result">{display}</div>
                <button onClick={() => setState({ data: 'new' })}>Set</button>
            </>
        );
    };

    it('shows loading state initially when store.get never resolves', () => {
        (store.get as jest.Mock).mockReturnValue(new Promise(() => {}));

        renderWithProvider(
            <Provider whatWeAreLoading="Loading test" dataIfNoId="fallback">
                <AsyncConsumer />
            </Provider>
        );

        // Consumer should display "loading"
        expect(screen.getByTestId('result')).toHaveTextContent('loading');
    });

    it('renders data after store.get resolves', async () => {
        (store.get as jest.Mock).mockResolvedValue({ value: 'hello' });

        await act(async () => {
            renderWithProvider(
                <Provider whatWeAreLoading="Loading test" dataIfNoId="fallback">
                    <AsyncConsumer />
                </Provider>
            );
            // flush the effect
            await Promise.resolve();
        });

        expect(screen.getByTestId('result')).toHaveTextContent('hello');
    });

    it('renders error UI when store.get rejects', async () => {
        (store.get as jest.Mock).mockRejectedValue(new Error('fail'));

        // custom render to show state.error in LoadingOrError
        const { rerender } = render(
            <LenscapeComponentsProvider
                lenscapeComponents={{
                    LoadingOrError: ({ state }: any) => (
                        <div data-testid="loading-error">{state.error}</div>
                    ),
                }}
            >
                <Provider whatWeAreLoading="LO" dataIfNoId="fallback">
                    <AsyncConsumer />
                </Provider>
            </LenscapeComponentsProvider>
        );

        // flush useEffect promise
        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.getByTestId('loading-error')).toHaveTextContent('fail');
    });

    it('uses fallback when useId returns null', () => {
        useId.mockReturnValue(null);

        renderWithProvider(
            <Provider whatWeAreLoading="LO" dataIfNoId="fallback">
                <AsyncConsumer />
            </Provider>
        );

        expect(screen.getByTestId('result')).toHaveTextContent('fallback');
    });

    it('persists new data via store.store when setter is called', async () => {
        (store.get as jest.Mock).mockResolvedValue({ value: 'initial' });
        (store.store as jest.Mock).mockResolvedValue({ value: undefined });

        await act(async () => {
            renderWithProvider(
                <Provider whatWeAreLoading="LO" dataIfNoId="fallback">
                    <AsyncConsumer />
                </Provider>
            );
            await Promise.resolve();
        });

        expect(screen.getByTestId('result')).toHaveTextContent('initial');

        await act(async () => {
            screen.getByText('Set').click();
            await Promise.resolve();
        });

        expect(store.store).toHaveBeenCalledWith('id1', 'new');
        expect(screen.getByTestId('result')).toHaveTextContent('new');
    });
});
