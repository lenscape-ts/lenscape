import {AsyncState, LoadingAS, ErrorAS, DataAS} from "@lenscape/async";
import {lensBuilder} from "./lens";
import exp = require("node:constants");
import {lensFromPath} from "./lens.serialisation";

type Child = { a: number }
type Parent = {
    state: AsyncState<Child>,
    other: 'something'
}

const parentLoading: Parent = {
    state: {loading: true},
    other: 'something'

}
const parentError: Parent = {
    state: {error: 'some error'},
    other: 'something'
}
const newError: Parent = {
    state: {error: 'newError'},
    other: 'something'
}
const parent1: Parent = {
    state: {data: {a: 1}},
    other: 'something'
}
const parent2: Parent = {
    state: {data: {a: 2}},
    other: 'something'
}

const lb = lensBuilder<Parent>()
const stateL = lb.focusOn('state')
const dataL = stateL.focusOnSingleKeyVariant('data')

describe('checking focusOnSingleKeyVariant with async state', () => {
    describe('using builder', () => {
        const loadingL = stateL.focusOnSingleKeyVariant('loading')
        const errorL = stateL.focusOnSingleKeyVariant('error')
        const childAL = dataL.focusOn('a')

        test('getters', () => {
            expect(loadingL.get(parentLoading)).toEqual(true)
            expect(loadingL.get(parentError)).toEqual(undefined)
            expect(loadingL.get(parent1)).toEqual(undefined)
        })
        test('loader setting', () => {
            expect(loadingL.set(parentLoading, true)).toEqual(parentLoading)
            expect(loadingL.set(parentError, true)).toEqual(parentLoading)
            expect(loadingL.set(parent1, true)).toEqual(parentLoading)
        })
        test('error setting', () => {
            expect(errorL.set(parentLoading, 'newError')).toEqual(newError)
            expect(errorL.set(parentError, 'newError')).toEqual(newError)
            expect(errorL.set(parent1, 'newError')).toEqual(newError)
        })
        test('data setting', () => {
            expect(childAL.set(parentLoading, 2)).toEqual(parent2)
            expect(childAL.set(parentError, 2)).toEqual(parent2)
            expect(childAL.set(parent1, 2)).toEqual(parent2)
        })
        test('path', () => {
            expect(loadingL.path).toEqual(['state', 'loading!'])
            expect(errorL.path).toEqual(['state', 'error!'])
            expect(childAL.path).toEqual(['state', 'data!', 'a'])
        })
    })
    describe('serialisation', () => {
        const loadingL = lensFromPath(stateL.focusOnSingleKeyVariant('loading').path)
        const errorL = lensFromPath(stateL.focusOnSingleKeyVariant('error').path)
        const childAL = lensFromPath(dataL.focusOn('a').path)

        test('getters', () => {
            expect(loadingL.get(parentLoading)).toEqual(true)
            expect(loadingL.get(parentError)).toEqual(undefined)
            expect(loadingL.get(parent1)).toEqual(undefined)
        })
        test('loader setting', () => {
            expect(loadingL.set(parentLoading, true)).toEqual(parentLoading)
            expect(loadingL.set(parentError, true)).toEqual(parentLoading)
            expect(loadingL.set(parent1, true)).toEqual(parentLoading)
        })
        test('error setting', () => {
            expect(errorL.set(parentLoading, 'newError')).toEqual(newError)
            expect(errorL.set(parentError, 'newError')).toEqual(newError)
            expect(errorL.set(parent1, 'newError')).toEqual(newError)
        })
        test('data setting', () => {
            expect(childAL.set(parentLoading, 2)).toEqual(parent2)
            expect(childAL.set(parentError, 2)).toEqual(parent2)
            expect(childAL.set(parent1, 2)).toEqual(parent2)
        })
        test('path', () => {
            expect(loadingL.path).toEqual(['state', 'loading!'])
            expect(errorL.path).toEqual(['state', 'error!'])
            expect(childAL.path).toEqual(['state', 'data!', 'a'])
        })
    })


})