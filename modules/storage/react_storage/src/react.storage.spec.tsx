import {
    cookieStorageImplementation,
    localStorageImplementation,
    sessionStorageImplementation,
    useWorkingStorage, workingStorage, WorkingStorageProvider
} from "./react.storage";
import "@testing-library/jest-dom";
import {mapStorageImplementation} from "@lenscape/storage";
import {screen, render} from "@testing-library/react";

describe("Storage Implementations", () => {
    const testKey = "testKey";
    const testValue = "testValue";

    beforeEach(() => {
        // Clear out data from each storage before every test.
        localStorage.clear();
        sessionStorage.clear();
        cookieStorageImplementation.removeItem(testKey);
    });

    it("localStorageImplementation works correctly", () => {
        localStorageImplementation.setItem(testKey, testValue);
        expect(localStorageImplementation.getItem(testKey)).toBe(testValue);
        localStorageImplementation.removeItem(testKey);
        expect(localStorageImplementation.getItem(testKey)).toBeNull();
    });

    it("sessionStorageImplementation works correctly", () => {
        sessionStorageImplementation.setItem(testKey, testValue);
        expect(sessionStorageImplementation.getItem(testKey)).toBe(testValue);
        sessionStorageImplementation.removeItem(testKey);
        expect(sessionStorageImplementation.getItem(testKey)).toBeNull();
    });

    it("cookieStorageImplementation works correctly", () => {
        cookieStorageImplementation.setItem(testKey, testValue);
        expect(cookieStorageImplementation.getItem(testKey)).toBe(testValue);
        cookieStorageImplementation.removeItem(testKey);
        expect(cookieStorageImplementation.getItem(testKey)).toBeNull();
    });


});


// Component that reads from storage and displays the value for a given key
const DisplayStorageValue: React.FC<{ keyName: string }> = ({keyName}) => {
    const storage = useWorkingStorage();
    const value = storage.getItem(keyName);
    return <div data-testid="value">{value}</div>;
};

describe('WorkingStorage context', () => {
    it('provides storage instance via context and displays stored value', () => {
        // Create a map-based storage and preload a key
        const mapStore = mapStorageImplementation();
        mapStore.setItem('greeting', 'hello world');

        render(
            <WorkingStorageProvider workingStorage={mapStore}>
                <DisplayStorageValue keyName="greeting"/>
            </WorkingStorageProvider>
        );

        expect(screen.getByTestId('value')).toHaveTextContent('hello world');
    });

});


