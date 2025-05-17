export type LensPathPart = string | number | ComposedPathPart;
export type ComposedPathPart = Record<string, LensPath>;
export type LensPath = LensPathPart[];
// Types for Lens and Path
export type LensAndPath<Main, Child> = {
    get: (main: Main) => Child | undefined;
    set: (main: Main, child: Child) => Main;
    path: LensPath;
};

// Create an identity lens for a given object
export function identityLens<T>(): LensAndPath<T, T> {
    return {
        get: (main: T) => main, // Simply return the main object
        set: (main: T, child: T) => child, // Replace the main object with the child
        path: [], // Start with an empty LensPath
    };
}