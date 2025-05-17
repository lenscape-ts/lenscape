// Create a lens that focuses on a specific child property in a larger object
import { ComposedPathPart, LensAndPath, LensPath } from "./lensPathPart";

export function child<Main, T, K extends keyof T>(
    lens: LensAndPath<Main, T>,
    key: K,
): LensAndPath<Main, T[K]> {
    return {
        get: (main: Main) => lens.get(main)?.[key], // Get the child property
        set: (main: Main, child: T[K]) => {
            const parent = lens.get(main) || ({} as T); // Default parent to an empty object if undefined
            const updatedParent = { ...parent, [key]: child }; // Create a new object with the updated child
            return lens.set(main, updatedParent as T); // Set the updated parent in the main object
        },
        path: [...lens.path, key as string], // Append key to the path
    };
}

// A function that allows us to focus on an array element at a specific index
export function index<Main, T extends any[]>(
    lens: LensAndPath<Main, T>,
    idx: number,
): T extends Array<infer U> ? LensAndPath<Main, U> : never {
    return {
        //@ts-ignore the typechecker doesn't know that T extends Array<infer U> here
        get: (main: Main) => lens.get(main)?.[idx], // Get the array element. The any is needed to satisfy the type checker
        set: (main: Main, child: any) => {
            const parent = lens.get(main) || []; // Default parent to an empty array if undefined
            const updatedParent = [...(parent as Array<any>)]; // Clone the array
            updatedParent[idx] = child; // Update the specific index
            return lens.set(main, updatedParent as T); // Set the updated array in the main object
        },
        path: [...lens.path, idx], // Append index to the path
    } as T extends Array<infer U> ? LensAndPath<Main, U> : never;
}

export function objectCompose<Main, T, Children extends Record<string, LensAndPath<T, any>>>(
    main: LensAndPath<Main, T>,
    children: Children,
): LensAndPath<Main, { [K in keyof Children]: Children[K] extends LensAndPath<T, infer U> ? U : never }> {
    const structure: ComposedPathPart = {};
    for (const key in children) {
        structure[key] = children[key].path;
    }
    const path: LensPath = [...main.path, structure];
    return {
        get: (mainObj: Main) => {
            const parentValue = main.get(mainObj);
            if (parentValue === undefined) return undefined;
            const result = {} as { [K in keyof Children]: Children[K] extends LensAndPath<T, infer U> ? U : never };
            for (const key in children) {
                result[key] = children[key].get(parentValue);
            }
            return result;
        },
        set: (mainObj: Main, childValue: { [K in keyof Children]: Children[K] extends LensAndPath<T, infer U> ? U : never }) => {
            const parentValue = main.get(mainObj) || ({} as T);
            let updatedParent = { ...parentValue };
            for (const key in children) {
                if (key in childValue) {
                    updatedParent = children[key].set(updatedParent, childValue[key]);
                }
            }
            return main.set(mainObj, updatedParent);
        },
        path,
    };
}