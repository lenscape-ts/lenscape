import {ComposedPathPart, identityLens, LensAndPath, LensPath} from "./lensPathPart";
import {child, index, objectCompose, variantChild} from "./lens.domain";
import {lensFromPath} from "./lens.serialisation";

export const mapLens = <Main, Child>(lens: LensAndPath<Main, Child>, fn: (c: Child) => Child) => (main: Main): Main => {
    const initial = lens.get(main)
    const updated = fn(initial)
    return lens.set(main, updated)
};

type VariantHavingKey<Union, Key extends PropertyKey> =
    Union extends Record<Key, any> ? Union : never;

/**
 * LensBuilder class for easier lens creation and focus chaining.
 *
 * @template Main - The root type of the object the lens operates on.
 * @template Child - The current focused type within the main object.
 *
 * @example
 * const obj = { a: { b: [1, 2, 3] } };
 * const lens = lensBuilder<typeof obj>()
 *   .focusOn('a')       // Focus on property 'a'
 *   .focusOn('b')       // Focus on property 'b'
 *   .focusIndex(1)      // Focus on the second element of the array
 *   .build();
 *
 * console.log(lens.path); // Output: ['a', 'b', 1]
 * console.log(lens.get(obj)); // Output: 2
 *
 * const updated = lens.set(obj, 42);
 * console.log(updated); // Output: { a: { b: [1, 42, 3] } }
 */
export class LensBuilder<Main, Child> implements LensAndPath<Main, Child> {
    private _lens: LensAndPath<Main, Child>;

    /**
     * @param {LensAndPath<Main, Child>} lens - The underlying lens to wrap.
     */
    constructor(lens: LensAndPath<Main, Child>) {
        this._lens = lens;
    }

    /**
     * Retrieve the focused value from the main object.
     * @param {Main} main - The object to retrieve the value from.
     * @returns {Child | undefined} The focused value or undefined if not present.
     */
    get(main: Main): Child | undefined {
        return this._lens.get(main);
    }

    /**
     * Set the focused value on the main object, returning a new updated object.
     * @param {Main} main - The original object.
     * @param {Child} child - The new value to set at the focus.
     * @returns {Main} A new object with the updated value.
     */
    set(main: Main, child: Child): Main {
        return this._lens.set(main, child);
    }

    /**
     * Map over the focused value, producing a new main object.
     * @param {(child: Child | undefined) => Child} fn - Function to transform the focused value.
     * @returns {(main: Main) => Main} A function that applies the mapping to a main object.
     *
     * @example
     * const incLens = lensBuilder<{ x?: number }>()
     *   .focusOn('x')
     *   .map(v => (v ?? 0) + 1);
     * const result = incLens({ x: 4 }); // { x: 5 }
     */
    map(fn: (child: Child | undefined) => Child) {
        return (main: Main) => this._lens.set(main, fn(this._lens.get(main)));
    }

    /**
     * The path representation of this lens within the main object.
     * @returns {LensPath} An array of keys, indices, or composed structures.
     */
    get path(): LensPath {
        return this._lens.path;
    }

    /**
     * Focus on a child property by key.
     * @template K - Key of the child property.
     * @param {K} key - The property name to focus on.
     * @returns {LensBuilder<Main, Child[K]>} A new builder focused on the specified property.
     */
    focusOn<K extends keyof Child>(key: K): LensBuilder<Main, Child[K]> {
        return new LensBuilder(child(this._lens, key));
    }

    focusOnSingleKeyVariant<
        Key extends PropertyKey,
        Variant extends VariantHavingKey<Child, Key>
    >(
        key: Key
    ): LensBuilder<Main, Variant[Key] > {
        const get = (main: Main): Variant[Key] | undefined => {
            const child = this._lens.get(main);
            if (child && typeof child === 'object' && key in child) {
                return (child as any)[key];
            }
            return undefined;
        };

        const set = (main: Main, value: Variant[Key]): Main => {
            const variant = {[key]: value} as Child;
            return this._lens.set(main, variant);
        };

        return new LensBuilder(variantChild<Main, Child, Key, Variant>(this._lens, key));
    }


    /**
     * Chain another lens after the current focus.
     * @template Child2 - The resulting focus type of the chained lens.
     * @param {LensAndPath<Child, Child2>} lens - The lens to chain.
     * @returns {LensBuilder<Main, Child2>} A new builder with the combined focus.
     */
    chain<Child2>(lens: LensAndPath<Child, Child2>): LensBuilder<Main, Child2> {
        return new LensBuilder({
            get: (main: Main) => {
                const c = this._lens.get(main);
                if (c === undefined) return undefined;
                return lens.get(c);
            },
            set: (main: Main, child: Child2) => {
                const parent = this._lens.get(main) || ({} as Child);
                const updatedParent = lens.set(parent, child);
                return this._lens.set(main, updatedParent);
            },
            path: [...this._lens.path, ...lens.path],
        });
    }

    /**
     * Focus on a path given as an array or serialized string.
     * @template T - The type at the end of the path.
     * @param {LensPath | string} path - The path descriptor.
     * @returns {LensBuilder<Main, T>} A builder focused at the specified path.
     */
    focusOnPath<T>(path: LensPath | string): LensBuilder<Main, T> {
        return this.chain(lensFromPath(path));
    }

    /**
     * Focus on an index within an array.
     * @param {number} idx - The array index to focus.
     * @returns {LensBuilder<Main, U>} A new builder focusing on the array element.
     */
    focusIndex(
        idx: number
    ): Child extends Array<infer U> ? LensBuilder<Main, U> : never {
        return new LensBuilder(index(this._lens as any, idx)) as any;
    }

    /**
     * Compose multiple child lenses into a single focus on an object of picks.
     * @template Children - Record of child lenses.
     * @param {Children} children - An object whose values are lenses focusing inside Child.
     * @returns {LensBuilder<Main, { [K in keyof Children]: ... }>} A builder focusing on the composed object.
     *
     * @example
     * const picker = lensBuilder<{ a: number; b: string }>()
     *   .focusCompose({
     *     x: lensBuilder<{ a: number; b: string }>().focusOn('a').build(),
     *     y: lensBuilder<{ a: number; b: string }>().focusOn('b').build()
     *   });
     * console.log(picker.path); // [{ a: ['a'], b: ['b'] }]
     */
    focusCompose<Children extends Record<string, LensAndPath<Child, any>>>(
        children: Children
    ): LensBuilder<
        Main,
        { [K in keyof Children]: Children[K] extends LensAndPath<Child, infer U> ? U : never }
    > {
        const composedLens = objectCompose(this._lens, children);
        return new LensBuilder(composedLens);
    }

    /**
     * From a previously composed focus, drill into one of the composed parts' sub-property,
     * producing an object that has all original keys but replaces one field with its nested sub-value.
     *
     * @template K - The key of the composed part to refine.
     * @template SubKey - The nested key inside that part.
     * @param {K} part - The top-level key in the composed object.
     * @param {SubKey} subPart - The nested key under `part` to extract.
     * @returns {LensBuilder<Main, { [P in keyof Child]: P extends K ? Child[K][SubKey] : Child[P] }>}
     * A builder focusing on the refined object where `part` is replaced by its `subPart`.
     *
     * @example
     * const composite = lensBuilder<Obj>()
     *   .focusCompose({
     *     sel: lensBuilder<Obj>().focusOn('selection').build(),
     *     dom: lensBuilder<Obj>().focusOn('domain').build(),
     *   }).build();
     * const refined = lensBuilder(composite)
     *   .focusOnPart('dom', 'other')
     *   .build();
     * console.log(refined.path);
     * // → [{ sel: ['selection'], dom: ['domain','other'] }]
     */
    focusOnPart<
        K extends keyof Child,
        SubKey extends keyof Child[K]
    >(
        part: K,
        subPart: SubKey
    ): LensBuilder<
        Main,
        { [P in keyof Child]: P extends K ? Child[K][SubKey] : Child[P] }
    > {
        const lastPath = this._lens.path[this._lens.path.length - 1];
        if (typeof lastPath !== 'object' || Array.isArray(lastPath)) {
            throw new Error(
                'Invalid path for focusOnPart. Must focus on an objectComposed path.'
            );
        }

        // Extract the existing array for `part`, drop it from the rest
        const pathForPart = lastPath[part as string];
        if (!pathForPart || !Array.isArray(pathForPart)) {
            throw new Error(`Invalid part [${String(part)}] for focusOnPart.`);
        }
        const {[part as string]: _dropped, ...rest} = lastPath;

        // Build new composed key for subPart
        const newLastPart: ComposedPathPart = {
            ...rest,
            [subPart as string]: [...pathForPart, subPart.toString()],
        };

        const path: LensPath = [
            ...this._lens.path.slice(0, -1),
            newLastPart,
        ];

        const get = (main: Main) => {
            const parentValue = this._lens.get(main);
            return {
                ...parentValue,
                [part]: parentValue?.[part]?.[subPart],
            };
        };

        const set = (main: Main, childValue: any) => {
            const parentValue = this._lens.get(main) || ({} as Child);
            const partValue = parentValue[part] || ({} as any);
            const newPartValue = {
                ...partValue,
                [subPart]: childValue[part],
            };
            const updatedChildValue = {
                ...childValue,
                [part]: newPartValue,
            };
            return this._lens.set(main, updatedChildValue);
        };

        return new LensBuilder({get, set, path}) as any;
    }

    /**
     * Finalize and return the underlying LensAndPath.
     * @returns {LensAndPath<Main, Child>} The built lens.
     */
    build(): LensAndPath<Main, Child> {
        return this._lens;
    }
}

/**
 * Create a new LensBuilder starting from an existing lens or the identity lens.
 *
 * @template T - The root type of the object.
 * @template Child - The initial focus type (defaults to T).
 * @param {LensAndPath<T, Child>} [lens=identityLens()] - An optional base lens.
 * @returns {LensBuilder<T, Child>} A new LensBuilder.
 *
 * @example
 * const base = lensBuilder<MyType>(); // identity focus
 * const objLens = lensBuilder<MyType, SubType>(customLens);
 */
export function lensBuilder<T, Child = T>(
    lens: LensAndPath<T, Child> = identityLens<T>() as any
): LensBuilder<T, Child> {
    return new LensBuilder(lens);
}
