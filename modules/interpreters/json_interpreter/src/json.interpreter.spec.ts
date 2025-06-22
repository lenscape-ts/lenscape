// interpreter.test.ts
import {
    ZeroEvent,
    InfoEvent,
    SetValueEvent,
    SetIdEvent,
    AppendIdEvent,
    ErrorEvent
} from "@lenscape/events"
import { GetAsyncStore } from "@lenscape/async_storage"
import {
    appendIdEp,
    appendValueEp,
    eventProcessors,
    jsonInterpreterFn,
    noopEp,
    processOneEvent,
    setIdEp,
    setValueEp,
    zeroEp
} from "./json.interpreter"
import { valueOrThrow } from "@lenscape/errors" // Added for unwrapping error monad

// adjust path as needed

describe("Event-processor functions", () => {
    const complexAcc = {
        user: { name: "Alice", scores: [10, 20] },
        meta: { valid: true }
    }

    test("zeroEp returns a fresh empty object", () => {
        const e: ZeroEvent = { event: "zero" }
        const out = zeroEp(e, complexAcc, new Map())
        expect(out).toEqual({})
    })

    test("noopEp returns the exact same accumulator instance", () => {
        const e: InfoEvent = { event: "info", info: "debug note" }
        const out = noopEp(e, complexAcc, new Map())
        expect(out).toBe(complexAcc)
    })

    test("setValueEp sets a primitive at a nested path", () => {
        const e: SetValueEvent = {
            event: "setValue",
            path: "user.name",
            value: "Bob"
        }
        const out = setValueEp(e, complexAcc, new Map())
        expect(out).toEqual({
            user: { name: "Bob", scores: [10, 20] },
            meta: { valid: true }
        })
    })

    test("setIdEp looks up an ID and writes it", () => {
        const ids = new Map<string, any>([["id1", 42]])
        const e: SetIdEvent = {
            event: "setId",
            path: "meta.id",
            id: "id1"
        }
        const out = setIdEp(e, complexAcc, ids)
        expect(out).toEqual({
            user: { name: "Alice", scores: [10, 20] },
            meta: { valid: true, id: 42 }
        })
    })

    test("appendValueEp pushes a raw value onto an existing array", () => {
        const e: SetValueEvent = {
            event: "setValue",
            path: "user.scores",
            value: 30
        }
        const out = appendValueEp(e, complexAcc, new Map())
          expect(out).toEqual({
            user: { name: "Alice", scores: [10, 20, 30] },
            meta: { valid: true }
        })
    })

    test("appendIdEp pushes a looked-up ID onto an array", () => {
        const ids = new Map<string, any>([["id2", 99]])
        const e: AppendIdEvent = {
            event: "appendId",
            path: "user.scores",
            id: "id2"
        }
        const out = appendIdEp(e, complexAcc, ids)
        expect(out).toEqual({
            user: { name: "Alice", scores: [10, 20, 99] },
            meta: { valid: true }
        })
    })

})

describe("processOneEvent", () => {
    test("routes to the correct processor", () => {
        const start = { x: 1 }
        const ids = new Map<string, any>([["foo", 5]])
        const ev: SetValueEvent = { event: "setValue", path: "x", value: 2 }
        const out = processOneEvent(eventProcessors, ids, ev, start)
        expect(out).toEqual({ x: 2 })
    })
})

describe("jsonInterpreterFn", () => {
    it("returns the initial accumulator when no events", async () => {
        const store = {} as GetAsyncStore<string, any>
        const interp = jsonInterpreterFn(store)
        const initial = { hello: "world" }
        expect(valueOrThrow(await interp([], initial))).toEqual(initial)
    })

    it("applies a simple setValue pipeline", async () => {
        const store = {} as GetAsyncStore<string, any>
        const interp = jsonInterpreterFn(store)
        const events: SetValueEvent[] = [
            { event: "setValue", path: "foo", value: 123 }
        ]
        expect(valueOrThrow(await interp(events, {}))).toEqual({ foo: 123 })
    })
})
