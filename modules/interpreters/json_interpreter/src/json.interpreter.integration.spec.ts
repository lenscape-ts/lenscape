// __tests__/jsonInterpreter.integration.test.ts
import {GetAsyncStore} from '@lenscape/async_storage'
import {
    ZeroEvent,
    InfoEvent,
    BaseEvent,
    SetValueEvent,
    SetIdEvent,
    AppendValueEvent,
    AppendIdEvent,
    ErrorEvent, LensEvent,
} from '@lenscape/events'
import {jsonInterpreterFn} from "./json.interpreter";
import {ErrorsOr, valueOrThrow} from "@lenscape/errors";

describe('jsonInterpreterFn integration (nested parent/child/grandchild + tags)', () => {
    // 1) prepare a fake async store for IDs
    const idStore = new Map<string, ErrorsOr<string>>([
        ['childId', {value: 'ChildData'}],
        ['grandchildId', {value: 'GrandChildData'}],
    ])
    const storeForIds: GetAsyncStore<string, any> = {
        get: async (id: string) => {
            if (!idStore.has(id)) throw new Error(`Unknown id ${id}`)
            let result = idStore.get(id);
            return result
        }
    }


    it('should fold all events into the expected nested result', async () => {
        const interpreter = jsonInterpreterFn(storeForIds)
        const events: LensEvent[] = [
            {event: 'zero'},                         // -> {}
            {event: 'info', info: 'just info'},     // -> noop
            {event: 'error', error: 'oops'},        // -> noop
            // build a “tags” array and append a raw value
            {event: 'setValue', path: 'tags', value: ['tag0']},
            {event: 'appendValue', path: 'tags', value: 'tag1'},
            // build a nested parent → child (by ID) → grandchildren array → append grandchild by ID
            {event: 'setValue', path: 'parent.child1', value: 'parentValue'},
            {event: 'setId', path: 'parent.child2', id: 'childId'},
            {event: 'setValue', path: 'parent.child3.grandchildren', value: ['gc1']},
            {event: 'appendId', path: 'parent.child3.grandchildren', id: 'grandchildId'},
        ]
        const value = valueOrThrow(await interpreter(events, /** initial acc */ {}))

        expect(value).toEqual({
            "parent": {
                "child1": "parentValue",
                "child2": "ChildData",
                "child3": {
                    "grandchildren": ["gc1", "GrandChildData"]
                }
            },
            "tags": ["tag0", "tag1"]
        })
    })
    it('should fold all events into the expected nested result - different owner', async () => {
        const interpreter = jsonInterpreterFn(storeForIds)
        const events: LensEvent[] = [
            {event: 'setValue', path: 'shouldnotbethere', value: 'value'},
            {event: 'zero'},                         // -> {}
            // build a “tags” array and append a raw value
            {event: 'setValue', path: 'tags', value: ['tag0']},
            {event: 'appendValue', path: 'tags', value: 'tag1'},
            // build a nested parent → child (by ID) → grandchildren array → append grandchild by ID
            {event: 'setValue', path: 'parent.child1', value: 'parentValue'},
            {event: 'setId', path: 'parent.child2', id: 'childId'},
            {event: 'setValue', path: 'parent.child3.grandchildren', value: ['gc1']},
            {event: 'appendId', path: 'parent.child3.grandchildren', id: 'grandchildId'},
            {event: 'info', info: 'just info'},     // -> noop
            {event: 'error', error: 'oops'},        // -> noop
        ]
        const value = valueOrThrow(await interpreter(events, /** initial acc */ {}))

        expect(value).toEqual({
            "parent": {
                "child1": "parentValue",
                "child2": "ChildData",
                "child3": {
                    "grandchildren": ["gc1", "GrandChildData"]
                }
            },
            "tags": ["tag0", "tag1"]
        })
    })
})
