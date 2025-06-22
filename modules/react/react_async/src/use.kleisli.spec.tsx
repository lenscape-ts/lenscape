import { useKleisli } from "./use.kleisli";
import { act, renderHook, waitFor } from "@testing-library/react";

describe("useKleisli", () => {
    let consoleErrorMock: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorMock = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorMock.mockRestore();
    });

    it("should initialize with loading state", async () => {
        const kleisli = async () => new Promise<string>(() => {});

        const { result } = renderHook(() => useKleisli(kleisli, 1));

        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("should handle successful data fetching", async () => {
        const kleisli = async (input: number) => `Resolved: ${input}`;

        const { result } = renderHook(() => useKleisli(kleisli, 1));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBe("Resolved: 1");
        expect(result.current.error).toBeNull();
    });

    it("should call onError and not console.error when an error occurs", async () => {
        const kleisli = async (input: number) => {
            throw new Error(`Error with input: ${input}`);
        };
        const onErrorMock = jest.fn();

        const { result } = renderHook(() => useKleisli(kleisli, 1, onErrorMock));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe("Error with input: 1");
        expect(onErrorMock).toHaveBeenCalledWith("Error with input: 1");
        expect(consoleErrorMock).not.toHaveBeenCalled();
    });

    it("should use the default error handler if onError is not provided", async () => {
        const kleisli = async (input: number) => {
            throw new Error(`Default error handler: ${input}`);
        };

        const { result } = renderHook(() => useKleisli(kleisli, 1));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe("Default error handler: 1");
        expect(consoleErrorMock).toHaveBeenCalledWith(
            "Error",
            "Default error handler: 1"
        );
    });
    it("should handle none 'Error' errors", async () => {
        const kleisli = async (input: number) => {
            throw `Default error handler: ${input}`;
        };

        const { result } = renderHook(() => useKleisli(kleisli, 2));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe("Default error handler: 2");
        expect(consoleErrorMock).toHaveBeenCalledWith(
            "Error",
            "Default error handler: 2"
        );
    });

    it("should not update state or call onError after unmount", async () => {
        const kleisli = async (input: number) => {
            return new Promise((resolve) =>
                setTimeout(() => resolve(`Resolved: ${input}`), 500)
            );
        };
        const onErrorMock = jest.fn();

        const { result, unmount } = renderHook(() =>
            useKleisli(kleisli, 1, onErrorMock)
        );

        expect(result.current.loading).toBe(true);

        unmount();

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(onErrorMock).not.toHaveBeenCalled();
        expect(consoleErrorMock).not.toHaveBeenCalled();
    });

    it("should re-fetch data when input changes", async () => {
        const kleisli = async (input: number) => `Resolved: ${input}`;
        const onErrorMock = jest.fn();

        const { result, rerender } = renderHook(
            ({ input }) => useKleisli(kleisli, input, onErrorMock),
            { initialProps: { input: 1 } }
        );

        await waitFor(() => expect(result.current.data).toBe("Resolved: 1"));

        rerender({ input: 2 });

        await waitFor(() => expect(result.current.data).toBe("Resolved: 2"));

        expect(onErrorMock).not.toHaveBeenCalled();
    });

    it("should not re-fetch data when kleisli is stable and input does not change", async () => {
        const kleisli = jest.fn(async (input: number) => `Resolved: ${input}`);
        const onErrorMock = jest.fn();

        const { result, rerender } = renderHook(
            ({ input }) => useKleisli(kleisli, input, onErrorMock),
            { initialProps: { input: 1 } }
        );

        await waitFor(() => expect(result.current.data).toBe("Resolved: 1"));

        rerender({ input: 1 });

        expect(kleisli).toHaveBeenCalledTimes(1);
        expect(onErrorMock).not.toHaveBeenCalled();
    });

    it("should handle Kleisli functions that resolve immediately", async () => {
        const kleisli = async (input: number) => `Resolved: ${input}`;
        const onErrorMock = jest.fn();

        const { result } = renderHook(() => useKleisli(kleisli, 1, onErrorMock));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toBe("Resolved: 1");
        expect(result.current.error).toBeNull();
        expect(onErrorMock).not.toHaveBeenCalled();
    });

    it("should handle non-Error exceptions gracefully and call onError", async () => {
        const kleisli = async () => {
            throw "Non-error exception";
        };
        const onErrorMock = jest.fn();

        const { result } = renderHook(() => useKleisli(kleisli, 1, onErrorMock));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe("Non-error exception");
        expect(onErrorMock).toHaveBeenCalledWith("Non-error exception");
        expect(consoleErrorMock).not.toHaveBeenCalled();
    });
});
