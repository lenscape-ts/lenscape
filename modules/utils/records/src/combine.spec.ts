import {deepCombineTwoObject} from "./combine";

describe('deepCombineTwoObject', () => {
  test('merges two objects with primitive properties', () => {
    const obj1 :any= { a: 1, b: 2 };
    const obj2 :any= { b: 3, c: 4 };
    const expected = { a: 1, b: 3, c: 4 };

    const result = deepCombineTwoObject(obj1, obj2);
    expect(result).toEqual(expected);
  });

  test('merges two objects with array properties by concatenation', () => {
    const obj1 :any= { a: [1, 2], b: 'hello' };
    const obj2 = { a: [3, 4], b: 'world' };
    const expected = { a: [1, 2, 3, 4], b: 'world' };

    const result = deepCombineTwoObject(obj1, obj2);
    expect(result).toEqual(expected);
  });

  test('merges nested objects deeply', () => {
    const obj1 :any= {
      user: {
        name: 'Alice',
        details: {
          age: 30,
          hobbies: ['reading'],
        },
      },
    };
    const obj2 :any= {
      user: {
        details: {
          age: 25,
          hobbies: ['gaming'],
          location: 'Wonderland',
        },
        preferences: {
          theme: 'dark',
        },
      },
    };
    const expected:any = {
      user: {
        name: 'Alice',
        details: {
          age: 25,
          hobbies: ['reading', 'gaming'],
          location: 'Wonderland',
        },
        preferences: {
          theme: 'dark',
        },
      },
    };

    const result = deepCombineTwoObject(obj1, obj2);
    expect(result).toEqual(expected);
  });

  test('handles undefined and null values appropriately', () => {
    const obj1 = { a: 1, b: null };
    const obj2 = { a: undefined, b: 2, c: null };
    const expected = { a: undefined, b: 2, c: null };

    const result = deepCombineTwoObject(obj1, obj2);
    expect(result).toEqual(expected);
  });

  test('does not merge forbidden keys to prevent prototype pollution', () => {
    const obj1 :any= { a: 1 };
    const obj2 :any= { __proto__: { polluted: true }, b: 2, constructor: { malicious: true } };
    const expected = { a: 1, b: 2 };

    const result = deepCombineTwoObject(obj1, obj2);
    expect(result).toEqual(expected);

    // Ensure that prototype is not polluted
    // @ts-ignore
    expect({}.polluted).toBeUndefined();
    // @ts-ignore
    expect({}.constructor.malicious).toBeUndefined();
  });

  test('overwrites non-object and non-array properties correctly', () => {
    const obj1 :any= { a: { x: 1 }, b: [1, 2], c: 'foo' };
    const obj2 :any= { a: 'bar', b: [3], c: { y: 2 } };
    const expected = { a: 'bar', b: [1, 2, 3], c: { y: 2 } };

    const result = deepCombineTwoObject(obj1, obj2);
    expect(result).toEqual(expected);
  });

  test('ensures original objects are not mutated (immutability)', () => {
    const obj1 :any= {
      user: {
        name: 'Alice',
        hobbies: ['reading'],
      },
    };
    const obj2 :any= {
      user: {
        hobbies: ['gaming'],
      },
    };

    const obj1Copy = JSON.parse(JSON.stringify(obj1));
    const obj2Copy = JSON.parse(JSON.stringify(obj2));

    const result = deepCombineTwoObject(obj1, obj2);

    expect(result).toEqual({
      user: {
        name: 'Alice',
        hobbies: ['reading', 'gaming'],
      },
    });

    // Ensure original objects are unchanged
    expect(obj1).toEqual(obj1Copy);
    expect(obj2).toEqual(obj2Copy);
  });

  test('handles merging when one object is undefined', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = undefined;
    const expected = { a: 1, b: 2 };

    const result = deepCombineTwoObject(obj1, obj2 as any);
    expect(result).toEqual(expected);
  });

  test('handles merging when one object is null', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = null;
    const expected = { a: 1, b: 2 };

    const result = deepCombineTwoObject(obj1, obj2 as any);
    expect(result).toEqual(expected);
  });

  test('handles both objects being undefined', () => {
    const obj1 = undefined;
    const obj2 = undefined;
    const expected = undefined;

    const result = deepCombineTwoObject(obj1 as any, obj2 as any);
    expect(result).toBeUndefined();
  });

  test('handles both objects being null', () => {
    const obj1 = null;
    const obj2 = null;
    const expected = null;

    const result = deepCombineTwoObject(obj1 as any, obj2 as any);
    expect(result).toBeNull();
  });

  test('handles non-object types by returning the second object', () => {
    const obj1 = 42;
    const obj2 = { a: 1 };
    const expected = { a: 1 };

    const result = deepCombineTwoObject(obj1 as any, obj2 as any);
    expect(result).toEqual(expected);
  });

  test('handles merging arrays of objects correctly', () => {
    const obj1 = { a: [{ id: 1, value: 'foo' }] };
    const obj2 = { a: [{ id: 2, value: 'bar' }] };
    const expected = { a: [{ id: 1, value: 'foo' }, { id: 2, value: 'bar' }] };

    const result = deepCombineTwoObject(obj1, obj2);
    expect(result).toEqual(expected);
  });

  test('merges deeply nested structures', () => {
    const obj1 :any= {
      level1: {
        level2: {
          level3: {
            a: 1,
            b: [1, 2],
          },
        },
      },
    };
    const obj2 :any= {
      level1: {
        level2: {
          level3: {
            b: [3],
            c: 4,
          },
        },
      },
    };
    const expected = {
      level1: {
        level2: {
          level3: {
            a: 1,
            b: [1, 2, 3],
            c: 4,
          },
        },
      },
    };

    const result = deepCombineTwoObject(obj1, obj2);
    expect(result).toEqual(expected);
  });
});
