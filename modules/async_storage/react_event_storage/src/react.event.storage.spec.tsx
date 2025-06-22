import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {InMemoryGetStoreAsyncStore} from '@lenscape/async_storage';
import {makeContextForEventStore} from "./react.event.storage";
import {EventAsyncStore} from "@lenscape/event_storage";
import {isErrorAs, isLoadingAs} from "@lenscape/async";
import {LensEvent} from "@lenscape/events";
import {JsonInterpreterPlugIn} from "@lenscape/json_interpreter/src/json.interpreter";

const idStore = new InMemoryGetStoreAsyncStore<string, any>()

export function renderComponent<Id, T>(id: Id,
                                       eventStore: EventAsyncStore<Id>,
                                       _idStore: InMemoryGetStoreAsyncStore<string, any> = idStore
) {
    const interpreter = JsonInterpreterPlugIn(idStore)
    const {use: useEventStore, Provider: EventStoreProvider} = makeContextForEventStore('eventStore', interpreter);

    function TestComponent() {
        const {state, change, reset} = useEventStore()

        function EventButton<E extends LensEvent>({event}: { event: E }) {
            return <button data-testid={`button-${event.event}`} onClick={() => change(event)}>{event.event}</button>
        }

        return <div>
            <div data-testid="current-value">
                {isLoadingAs(state) ? 'Loading...' : isErrorAs(state) ? state.errors.join(', ') : JSON.stringify(state.data)}
            </div>
            <button data-testid="button-reset" onClick={reset}>Reset</button>
            <EventButton event={{event: 'zero'}}/>
            <EventButton event={{event: 'info', info: 'info'}}/>
            <EventButton event={{event: 'error', error: 'error'}}/>
            <EventButton event={{event: 'setId', path: 'a.b.c', id: 'id1'}}/>
            <EventButton event={{event: 'setValue', path: 'a.b.c', value: ['valueForTest']}}/>
            <EventButton event={{event: 'appendValue', path: 'a.b.c', value: 'appendedValue'}}/>
            <EventButton event={{event: 'appendId', path: 'a.b.c', id: 'id1'}}/>
        </div>
    }

    return render(<EventStoreProvider id={id} eventStore={eventStore}><TestComponent/></EventStoreProvider>);
}

type ID = string
const id1: ID = 'id1'

describe('AsyncStateEventStore hook and Provider', () => {

    beforeAll(async () => {
        await idStore.store('id1', 'data1')
        await idStore.store('id2', 'data2')
        jest.clearAllMocks()
    })

    test('initial state while loading ', async () => {
        const eventStore: EventAsyncStore<ID> = {
            append: async () => { throw new Error('not implemented') },
            get: () => new Promise(() => {}) //never resolves
        }
        renderComponent(id1, eventStore)
        expect(screen.getByTestId('current-value').textContent).toBe('Loading...');
    });

    test('displays error state if eventStore.get fails', async () => {
        const eventStore: EventAsyncStore<ID> = {
            append: async () => ({value: undefined}),
            get: async () => ({errors: ['Failed to load events']})
        }
        renderComponent(id1, eventStore)

        await waitFor(() => {
            expect(screen.getByTestId('current-value').textContent).toContain('Failed to load events');
        });
    });

    test('displays data state when successfully loaded', async () => {
        const eventStore: EventAsyncStore<ID> = {
            append: async () => ({value: undefined}),
            get: async () => ({value: [{event: 'setValue', path: 'a.b.c', value: 'cValue'}]})
        }
        renderComponent(id1, eventStore)

        await waitFor(() => {
            expect(screen.getByTestId('current-value').textContent).toEqual(JSON.stringify({a: {b: {c: "cValue"}}}));
        });
    });

    test('change updates state and appends correctly', async () => {
        const appendMock = jest.fn(async () => ({value: undefined}));
        const eventStore: EventAsyncStore<ID> = {
            append: appendMock,
            get: async () => ({value: []})
        }
        renderComponent(id1, eventStore)

        await waitFor(() => {
            expect(screen.getByTestId('current-value').textContent).toBeDefined();
        });

        fireEvent.click(screen.getByTestId('button-setValue'));

        await waitFor(() => {
            expect(screen.getByTestId('current-value').textContent).toContain('valueForTest');
        });

        expect(appendMock).toHaveBeenCalledWith(id1, {event: 'setValue', path: 'a.b.c', value: ['valueForTest']});
    });

    test('reset reloads initial state correctly', async () => {
        const eventStore: EventAsyncStore<ID> = {
            append: async () => ({value: undefined}),
            get: async () => ({value: [{event: 'setValue', path: 'a.b.c', value: 'cValue'}]})
        }
        renderComponent(id1, eventStore)

        await waitFor(() => expect(screen.getByTestId('current-value').textContent).toEqual(JSON.stringify({a: {b: {c: "cValue"}}})));

        fireEvent.click(screen.getByTestId('button-reset'));

        await waitFor(() => expect(screen.getByTestId('current-value').textContent).toEqual(JSON.stringify({a: {b: {c: "cValue"}}})));
    });
});
