import {render, screen} from "@testing-library/react";
import {makeContextFor, makeContextForState} from "./context.utils";
import "@testing-library/jest-dom";
import {captureConsoleError, captureConsoleLog} from "@lenscape/test_utils";


type TestData = { value: string };

const {use: useTestContext, Provider: TestProvider} = makeContextFor<TestData, "test">("test");
const {use: useTestState, Provider: TestStateProvider} = makeContextForState<string, "state">("state");
const StateComponent = () => {
    const [state] = useTestState();
    return <div>{state}</div>;
};
describe("makeContextFor", () => {
    test("provides and consumes context value", () => {
        render(
            <TestProvider test={{value: "Hello"}}>
                <TestComponent/>
            </TestProvider>,
        );
        expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    test("throws error when context is not provided", () => {
        captureConsoleError(() =>
            expect(() => render(<TestComponent/>)).toThrow(
                "useTest must be used within a TestProvider",
            ))
    });
});

const TestComponent = () => {
    const data = useTestContext();
    return <div>{data.value}</div>;
};

describe("makeContextForState", () => {
    test("provides and consumes state with initial value", () => {
        render(
            <TestStateProvider state="Initial State">
                <StateComponent/>
            </TestStateProvider>,
        );
        expect(screen.getByText("Initial State")).toBeInTheDocument();
    });

    test("throws error if state is not provided and undefined is not allowed", () => {
        captureConsoleError(() => expect(() => render(<StateComponent/>)).toThrow(
            "useState must be used within a StateProvider",
        ))
    });
});

import { getterSetterWithDebug } from './context.utils';

// assume captureConsoleLog is imported

describe('getterSetterWithDebug', () => {
    it('calls setter and logs without stack trace when showStackTrace is false', () => {
        const getter = 42;
        const setter = jest.fn<void, [number]>();
        const [_, debugSetter] = getterSetterWithDebug([getter, setter], 'debugName', false);

        const { logs } = captureConsoleLog(() => {
            debugSetter(100);
        });

        // Setter should have been called with new value
        expect(setter).toHaveBeenCalledWith(100);

        // Only one log call
        expect(logs).toEqual([
            ['debugName setter called with value:', 100]
        ]);
    });

    it('calls setter and logs with stack trace when showStackTrace is true', () => {
        const getter = 'initial';
        const setter = jest.fn<void, [string]>();
        const [_, debugSetter] = getterSetterWithDebug([getter, setter], 'myKey', true);

        const { logs } = captureConsoleLog(() => {
            debugSetter('newValue');
        });

        // Setter should have been called with new value
        expect(setter).toHaveBeenCalledWith('newValue');

        // Two log calls: setter message and stack trace
        expect(logs.length).toBe(2);
        expect(logs[0]).toEqual([
            'myKey setter called with value:',
            'newValue'
        ]);
        expect(logs[1][0]).toMatch(/^MyKey stack trace:\n/);
        expect(typeof logs[1][1]).toBe('string');
        expect((logs[1][1] as string).length).toBeGreaterThan(0);
    });

    it('supports functional updater and logs function reference', () => {
        const getter = 0;
        const setter = jest.fn<void, [(prev: number) => number]>();
        const updater = (prev: number) => prev + 1;
        const [_, debugSetter] = getterSetterWithDebug([getter, setter], 'count', false);

        const { logs } = captureConsoleLog(() => {
            debugSetter(updater);
        });

        // Setter should have been called with the functional updater
        expect(setter).toHaveBeenCalledWith(updater);

        // log the function as second argument
        expect(logs).toEqual([
            ['count setter called with value:', updater]
        ]);
    });
});

