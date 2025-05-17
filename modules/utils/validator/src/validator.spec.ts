import {
    combineValidators,
    composeOr,
    mustBeArrayOf,
    mustBeArrayOfIfPresent,
    mustBeBoolean,
    mustBeBooleanIfPresent,
    mustBeNumber,
    mustBeNumberIfPresent,
    mustBeObjectWithFields,
    mustBeString,
    mustBeStringIfPresent,
    Validator
} from './validator';

describe('combineValidators', () => {
    const atLeast3: Validator<string> = ctx => v =>
        v.length >= 3 ? [] : [`${ctx} must be at least 3 chars`];
    const combined = combineValidators(mustBeString, atLeast3);

    test('returns no errors for valid string', () => {
        expect(combined('ctx')('abcd')).toEqual([]);
    });

    test('collects errors from both validators when wrong type', () => {
        expect(combined('ctx')(123 as any)).toEqual([
            'ctx must be a string',
            'ctx must be at least 3 chars'
        ]);
    });

    test('returns length-error for short string', () => {
        expect(combined('ctx')('ab')).toEqual(['ctx must be at least 3 chars']);
    });
});

describe('composeOr', () => {
    const either = composeOr({
        string: mustBeString,
        stringArray: mustBeArrayOf(mustBeString)
    });

    test('passes if first validator succeeds', () => {
        expect(either('x')('foo')).toEqual([]);
    });

    test('passes if second validator succeeds', () => {
        expect(either('x')(['bar'])).toEqual([]);
    });

    test('returns reasons if none succeed', () => {
        expect(either('x')(123 as any)).toEqual([
            'x is not a string because x must be a string',
            'x is not a stringArray because x must be an array'
        ]);
    });
});

describe('mustBeType (required)', () => {
    test('flags undefined', () => {
        expect(mustBeString('ctx')(undefined as any)).toEqual([
            'ctx is required but was undefined'
        ]);
    });

    test('flags null', () => {
        expect(mustBeString('ctx')(null as any)).toEqual([
            'ctx is required but was null'
        ]);
    });

    test('returns no errors for correct type', () => {
        expect(mustBeNumber('n')(42)).toEqual([]);
    });

    test('returns error for wrong type', () => {
        expect(mustBeBoolean('b')('true' as any)).toEqual([
            'b must be a boolean'
        ]);
    });
});

describe('mustBeTypeIfPresent (optional)', () => {
    test('skips undefined', () => {
        expect(mustBeStringIfPresent('s')(undefined)).toEqual([]);
    });

    test('skips null', () => {
        expect(mustBeNumberIfPresent('n')(null as any)).toEqual([]);
    });

    test('returns no errors for correct type', () => {
        expect(mustBeBooleanIfPresent('b')(false)).toEqual([]);
    });

    test('returns error for wrong type', () => {
        expect(mustBeStringIfPresent('s')(123 as any)).toEqual([
            's must be a string'
        ]);
    });
});

describe('Array validators', () => {
    const numArr = mustBeArrayOf(mustBeNumber);
    const numArrOpt = mustBeArrayOfIfPresent(mustBeNumber);

    test('mustBeArrayOf: valid array', () => {
        expect(numArr('arr')([1, 2, 3])).toEqual([]);
    });

    test('mustBeArrayOf: element error', () => {
        expect(numArr('arr')([1, 'x' as any, 3])).toEqual([
            'arr[1] must be a number'
        ]);
    });

    test('mustBeArrayOf: non-array value', () => {
        expect(numArr('arr')(5 as any)).toEqual([
            'arr must be an array'
        ]);
    });

    test('mustBeArrayOfIfPresent: skips undefined', () => {
        expect(numArrOpt('arr')(undefined)).toEqual([]);
    });

    test('mustBeArrayOfIfPresent: skips null', () => {
        expect(numArrOpt('arr')(null as any)).toEqual([]);
    });

    test('mustBeArrayOfIfPresent: element error', () => {
        expect(numArrOpt('arr')([1, 'x' as any])).toEqual([
            'arr[1] must be a number'
        ]);
    });

    test('mustBeArrayOfIfPresent: non-array value', () => {
        expect(numArrOpt('arr')(5 as any)).toEqual([
            'arr must be an array'
        ]);
    });
});

describe('mustBeObjectWithFields', () => {
    interface Dummy { a: string; b?: number; }

    const validateDummy = mustBeObjectWithFields<Dummy>({
        a: mustBeString,
        b: mustBeNumberIfPresent
    });

    test('valid object', () => {
        expect(validateDummy('d')({ a: 'hi', b: 10 })).toEqual([]);
    });

    test('missing required field returns error', () => {
        expect(validateDummy('d')({ b: 5 } as any)).toEqual([
            'd.a is required but was undefined'
        ]);
    });

    test('invalid optional field', () => {
        expect(validateDummy('d')({ a: 'ok', b: 'no' as any })).toEqual([
            'd.b must be a number'
        ]);
    });

    test('non-object value', () => {
        expect(validateDummy('d')(123 as any)).toEqual([
            'd must be an object'
        ]);
    });
});
