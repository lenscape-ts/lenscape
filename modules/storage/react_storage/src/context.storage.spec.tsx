import React, {ReactNode} from "react";
import {render, screen, fireEvent} from "@testing-library/react";

import {mapStorageImplementation} from "@lenscape/storage";
import {makeContextForSyncPersistentState} from "./context.storage";
import {captureConsoleError} from "@lenscape/test_utils";
import {Codec} from "@lenscape/codec";


// Simple string‐based number codec
const numberCodec: Codec<number> = {
    encode: (value: number) => ({value: String(value)}),
    decode: (input: string) => ({value: Number(input)}),
};

function setupSyncState(field: string, initialValue: number) {
    const storage = mapStorageImplementation();
    const key = `${field}-key`;

    const {Provider, use: useField} = makeContextForSyncPersistentState<number, typeof field>(
        field,
        {storage, key, codec: numberCodec},
        {debug: false},
    );

    // Test component that reads and writes the value
    const TestComponent: React.FC = () => {
        const [value, setValue] = useField();
        return (
            <div>
                <span data-testid="value">{value}</span>
                <button
                    data-testid="set-direct"
                    onClick={() => setValue(123)}
                >
                    set 123
                </button>
                <button
                    data-testid="increment"
                    onClick={() => setValue(v => v + 1)}
                >
                    +1
                </button>
            </div>
        );
    };

    const wrapper: React.FC<{ children: ReactNode }> = ({children}) => {
        const ivProps: { children: ReactNode } & Record<string, number> = {[field]: initialValue, children} as any;
        return Provider(ivProps);
    };

    return {storage, key, wrapper, TestComponent};
}

describe("syncPersistentState (via component)", () => {
    it("renders initial prop when storage is empty", () => {
        const {storage, wrapper, TestComponent} = setupSyncState("count", 7);

        // ensure nothing persisted yet
        expect(storage.getItem("count-key")).toBeNull();

        render(<TestComponent/>, {wrapper});
        expect(screen.getByTestId("value").textContent).toBe("7");
    });

    it("renders stored value when present", () => {
        const {storage, key, wrapper, TestComponent} = setupSyncState("count", 0);
        storage.setItem(key, "42");

        render(<TestComponent/>, {wrapper});
        expect(screen.getByTestId("value").textContent).toBe("42");
    });

    it("persists a direct setValue call", () => {
        const {storage, key, wrapper, TestComponent} = setupSyncState("count", 5);

        render(<TestComponent/>, {wrapper});
        fireEvent.click(screen.getByTestId("set-direct"));

        // after clicking, UI should update
        expect(screen.getByTestId("value").textContent).toBe("123");
        // and storage should have been written
        expect(storage.getItem(key)).toBe("123");
    });

    it("supports functional updates", () => {
        const {storage, key, wrapper, TestComponent} = setupSyncState("count", 10);

        render(<TestComponent/>, {wrapper});
        fireEvent.click(screen.getByTestId("increment"));

        // UI increments by 1
        expect(screen.getByTestId("value").textContent).toBe("11");
        // storage also reflects the new value
        expect(storage.getItem(key)).toBe("11");
    });

    it("throws when used outside a provider", () => {
        const storage = mapStorageImplementation();
        const key = "noprov-key";

        const {use: useField} = makeContextForSyncPersistentState<number, "noprov">(
            "noprov",
            {storage, key, codec: numberCodec},
            {debug: false},
        );

        // A component that tries to call the hook
        const Broken: React.FC = () => {
            // this should throw
            useField();
            return null;
        };

        // rendering without a wrapper should error
        captureConsoleError(() => expect(() => render(<Broken/>)).toThrow());
    });
});
