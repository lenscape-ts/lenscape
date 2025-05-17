// -------------------------------------------------------------------------------------------------
// Core types & combinator with new signature
// -------------------------------------------------------------------------------------------------

/**
 * Validator<T> now is a function that, given a context string,
 * returns a function which takes a value of type T and returns error messages.
 */
export type Validator<T> = (context: string) => (t: T) => string[];

/**
 * Compose multiple validators into one (collects all errors).
 */
export function combineValidators<T>(...validators: Validator<T>[]): Validator<T> {
    return (ctx: string) => (t: T): string[] =>
        validators.flatMap(v => v(ctx)(t));
}

// -------------------------------------------------------------------------------------------------
// Helper to extract the payload type from a Validator<T>
// -------------------------------------------------------------------------------------------------

type UnwrapValidator<V> = V extends Validator<infer U> ? U : never;

/**
 * Given a map of named validators, return a Validator over the union of their input types.
 */
export function composeOr<
    V extends Record<string, Validator<any>>
>(
    validators: V
): Validator<UnwrapValidator<V[keyof V]>> {
    return (ctx: string) => (value: UnwrapValidator<V[keyof V]>): string[] => {
        const reasons: string[] = [];
        for (const key in validators) {
            const validator = validators[key] as Validator<UnwrapValidator<V[keyof V]>>;
            const errors = validator(ctx)(value as any);
            if (errors.length === 0) {
                return [];
            }
            reasons.push(`${ctx} is not a ${key} because ${errors.join(", ")}`);
        }
        return reasons;
    };
}

// -------------------------------------------------------------------------------------------------
// Generic "must be type" factories (required + optional)
// -------------------------------------------------------------------------------------------------

/**
 * Creates a validator that asserts the value is present (not undefined/null) and of type T.
 */
export function mustBeType<T>(
    typeCheck: (v: unknown) => v is T,
    typeName: string
): Validator<T> {
    return (ctx: string) => (value: T): string[] => {
        if (value === undefined) return [`${ctx} is required but was undefined`];
        if (value === null) return [`${ctx} is required but was null`];
        return typeCheck(value)
            ? []
            : [`${ctx} must be a ${typeName}`];
    };
}

/**
 * Creates a validator that skips undefined/null, else behaves like mustBeType.
 */
export function mustBeTypeIfPresent<T>(
    typeCheck: (v: unknown) => v is T,
    typeName: string
): Validator<T | undefined> {
    const required = mustBeType(typeCheck, typeName);
    return (ctx: string) => (value: T | undefined): string[] => {
        if (value === undefined || value === null) return [];
        return required(ctx)(value as T);
    };
}

// -------------------------------------------------------------------------------------------------
// Primitive validators
// -------------------------------------------------------------------------------------------------

export const mustBeString: Validator<string> = mustBeType<string>(
    v => typeof v === 'string',
    'string'
);

export const mustBeNumber: Validator<number> = mustBeType<number>(
    v => typeof v === 'number',
    'number'
);

export const mustBeBoolean: Validator<boolean> = mustBeType<boolean>(
    v => typeof v === 'boolean',
    'boolean'
);

export const mustBeStringIfPresent: Validator<string | undefined> =
    mustBeTypeIfPresent<string>(v => typeof v === 'string', 'string');

export const mustBeNumberIfPresent: Validator<number | undefined> =
    mustBeTypeIfPresent<number>(v => typeof v === 'number', 'number');

export const mustBeBooleanIfPresent: Validator<boolean | undefined> =
    mustBeTypeIfPresent<boolean>(v => typeof v === 'boolean', 'boolean');

// -------------------------------------------------------------------------------------------------
// Array-of-T validators (required + optional)
// -------------------------------------------------------------------------------------------------

/**
 * Creates a Validator for T[]: checks array and applies item validator to each element.
 */
export function mustBeArrayOf<T>(
    itemValidator: Validator<T>
): Validator<T[]> {
    return (ctx: string) => (value: T[]): string[] => {
        if (!Array.isArray(value)) {
            return [`${ctx} must be an array`];
        }
        return value.flatMap((item, idx) =>
            itemValidator(`${ctx}[${idx}]`)(item)
        );
    };
}

/**
 * Optional version of mustBeArrayOf: skips undefined/null, else applies array validator.
 */
export function mustBeArrayOfIfPresent<T>(
    itemValidator: Validator<T>
): Validator<T[] | undefined> {
    const required = mustBeArrayOf(itemValidator);
    return (ctx: string) => (value: T[] | undefined): string[] => {
        if (value === undefined || value === null) return [];
        return required(ctx)(value);
    };
}

// -------------------------------------------------------------------------------------------------
// Object field validators
// -------------------------------------------------------------------------------------------------

/**
 * Builds a Validator<T> from per-key validators.
 * Checks object shape and applies each field validator.
 */
export function mustBeObjectWithFields<T extends Record<string, any>>(
    fields: { [K in keyof T]: Validator<T[K]> }
): Validator<T> {
    return (ctx: string) => (value: T): string[] => {
        if (typeof value !== 'object' || value === null) {
            return [`${ctx} must be an object`];
        }
        const obj = value as { [K in keyof T]: unknown };
        return (Object.keys(fields) as (keyof T)[]).flatMap(key =>
            fields[key](`${ctx}.${String(key)}`)(obj[key] as T[typeof key])
        );
    };
}