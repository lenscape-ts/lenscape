import {lensFromPath, parseLens, serializeLens, tokenizePath} from "./lens.serialisation";

describe('Path Tokenizer', () => {
    it('should tokenize a simple path', () => {
        const serialized = 'a.b.c';
        const tokens = tokenizePath(serialized);
        expect(tokens).toEqual(['a', 'b', 'c']);
    });

    it('should tokenize a nested path with braces', () => {
        const serialized = 'a.{x:x1.x2,y:y1.{n:n1}}.y.z';
        const tokens = tokenizePath(serialized);
        expect(tokens).toEqual([
            'a', '{', 'x', ':', 'x1', 'x2', ',', 'y', ':', 'y1', '{', 'n', ':', 'n1', '}', '}', 'y', 'z'
        ]);
    });

    it('should tokenize a path with special characters escaped', () => {
        const serialized = 'a\\.key.{x\\.key:x1}';
        const tokens = tokenizePath(serialized);
        expect(tokens).toEqual(['a.key', '{', 'x.key', ':', 'x1', '}']);
    });

    it('should tokenize a path with numbers', () => {
        const serialized = 'a.0.{x:1,y:2}';
        const tokens = tokenizePath(serialized);
        expect(tokens).toEqual(['a', 0, '{', 'x', ':', 1, ',', 'y', ':', 2, '}']);
    });

    it('should handle empty braces', () => {
        const serialized = 'a.{}';
        const tokens = tokenizePath(serialized);
        expect(tokens).toEqual(['a', '{', '}']);
    });

    it('should throw an error on invalid escape sequences', () => {
        const serialized = 'a.\\';
        expect(() => tokenizePath(serialized)).toThrow('Incomplete escape sequence at end of string');
    });

    it('should throw an error on unexpected characters', () => {
        const serialized = 'a.@';
        expect(() => tokenizePath(serialized)).toThrow("Unexpected character '@' at position 2");
    });
});

describe('parseLens / serialisation', () => {
    it('should parse a simple path', () => {
        const serialized = 'a.b.c';
        const result = parseLens(serialized);
        expect(result).toEqual(['a', 'b', 'c']);
        const roundTrip = serializeLens(result);
        expect(roundTrip).toEqual(serialized);
    });

    it('should parse a nested path', () => {
        const serialized = 'a.{x:x1.x2,y:y1.{n:n1}}.y.z';
        const result = parseLens(serialized);
        expect(result).toEqual([
            'a',
            {
                x: ['x1', 'x2'],
                y: ['y1', {n: ['n1']}]
            },
            'y',
            'z'
        ]);
        const roundTrip = serializeLens(result);
        expect(roundTrip).toEqual(serialized);
    });

    it('should handle escaped characters in keys', () => {
        const serialized = 'a\\.key.{x\\.key:x1}';
        const result = parseLens(serialized);
        expect(result).toEqual([
            'a.key',
            {
                'x.key': ['x1']
            }
        ]);
        const roundTrip = serializeLens(result);
        expect(roundTrip).toEqual(serialized);
    });

    it('should parse paths with numbers', () => {
        const serialized = 'a.0.{x:1,y:2}';
        const result = parseLens(serialized);
        expect(result).toEqual([
            'a',
            0,
            {
                x: [1],
                y: [2]
            }
        ]);
        const roundTrip = serializeLens(result);
        expect(roundTrip).toEqual(serialized);
    });

    it('should throw an error for invalid input', () => {
        const serialized = 'a.{x:x1,y:{}}z';
        expect(() => parseLens(serialized)).toThrow();
    });

    it('should throw an error for mismatched brackets', () => {
        const serialized = 'a.{x:x1.{y:y2}}.z}';
        expect(() => parseLens(serialized)).toThrow('Unexpected tokens remaining at position');
    });

    it('should throw an error for empty braces with no content', () => {
        const serialized = 'a.{}';
        expect(() => parseLens(serialized)).toThrow("Unexpected '}' at position 3");
    });

    it('should throw an error for not finishing a nested structure', () => {
        const serialized = 'a.{x:x1,y:y1';
        expect(() => parseLens(serialized)).toThrow("Unexpected end of context. Expected a }. This object started at 2");
    });
});

describe('parseLens', () => {
    it('should parse a simple path', () => {
        const serialized = 'a.b.c';
        const result = parseLens(serialized);
        expect(result).toEqual(['a', 'b', 'c']);
        const roundTrip = serializeLens(result);
        expect(roundTrip).toEqual(serialized);
    });

    it('should parse a nested path', () => {
        const serialized = 'a.{x:x1.x2,y:y1.{n:n1}}.y.z';
        const result = parseLens(serialized);
        expect(result).toEqual([
            'a',
            {
                x: ['x1', 'x2'],
                y: ['y1', {n: ['n1']}]
            },
            'y',
            'z'
        ]);
        const roundTrip = serializeLens(result);
        expect(roundTrip).toEqual(serialized);
    });

    it('should handle escaped characters in keys', () => {
        const serialized = 'a\\.key.{x\\.key:x1}';
        const result = parseLens(serialized);
        expect(result).toEqual([
            'a.key',
            {
                'x.key': ['x1']
            }
        ]);
        const roundTrip = serializeLens(result);
        expect(roundTrip).toEqual(serialized);
    });

    it('should parse paths with numbers', () => {
        const serialized = 'a.0.{x:1,y:2}';
        const result = parseLens(serialized);
        expect(result).toEqual([
            'a',
            0,
            {
                x: [1],
                y: [2]
            }
        ]);
        const roundTrip = serializeLens(result);
        expect(roundTrip).toEqual(serialized);
    });

    it('should throw an error for invalid input', () => {
        const serialized = 'a.{x:x1,y:{}}z';
        expect(() => parseLens(serialized)).toThrow();
    });

    it('should throw an error for mismatched brackets', () => {
        const serialized = 'a.{x:x1.{y:y2}}.z}';
        expect(() => parseLens(serialized)).toThrow('Unexpected tokens remaining at position');
    });

    it('should throw an error for empty braces with no content', () => {
        const serialized = 'a.{}';
        expect(() => parseLens(serialized)).toThrow( "Unexpected '}' at position 3");
    });

    it('should throw an error for not finishing a nested structure', () => {
        const serialized = 'a.{x:x1,y:y1';
        expect(() => parseLens(serialized)).toThrow("Unexpected end of context. Expected a }. This object started at 2");
    });
});

describe('lensFromPath', () => {
    it('should construct a lens from a simple path', () => {
        const path = 'a.b.c';
        const lens = lensFromPath<any, any>(path);
        const obj = {a: {b: {c: 42}}};

        expect(lens.get(obj)).toEqual(42);
        const updated = lens.set(obj, 100);
        expect(updated).toEqual({a: {b: {c: 100}}});
    });

    it('should construct a lens from a simple nested path', () => {
        const path = 'a.b.{c:c1,d:d1}';
        const lens = lensFromPath<any, any>(path);
        const obj = {a: {b: {c1: 42, d1: 84}}};
        expect(lens.path).toEqual(['a', 'b', {c: ['c1'], d: ['d1']}]);
        expect(lens.get(obj)).toEqual({c: 42, d: 84});
        const updated = lens.set(obj, {c: 100, d: 200});
        expect(updated).toEqual({a: {b: {c1: 100, d1: 200}}});

    });

    it('should construct a lens from a nested path', () => {
        const path = 'a.{x:x.x1,y:y.y1.{n:n1}}';
        const lens = lensFromPath<any, any>(path);
        const obj = {
            a: {
                x: {x1: 10},
                y: {y1: {n1: 20}}
            },
            b: 'value'
        };
        expect(lens.path).toEqual(['a', {x: ['x', 'x1'], y: ['y', 'y1', {n: ['n1']}]}]);

        expect(lens.get(obj)).toEqual({
            "x": 10,
            "y": {
                "n": 20
            }
        });
        const updated = lens.set(obj, {
            "x": 15,
            "y": {
                "n": 25
            }
        });
        expect(updated).toEqual({
            a: {
                x: {x1: 15},
                y: {y1: {n1: 25}}
            },
            "b": "value"
        });
    });

    it('should construct a lens with array indices', () => {
        const path = 'a.b.0.c';
        const lens = lensFromPath(path);
        const obj = {a: {b: [{c: 42}, {c: 84}]}};

        expect(lens.get(obj)).toEqual(42);
        const updated = lens.set(obj, 100);
        expect(updated).toEqual({a: {b: [{c: 100}, {c: 84}]}});
    });

    it('should construct a lens with mixed types', () => {
        const path = 'a.0.{x:x1.{y:y1},z:z1}';
        const lens = lensFromPath(path);
        const obj = {
            a: [
                {
                    x1: {y1: 10},
                    z1: 20,
                    b: 'value'
                }
            ]
        };

        expect(lens.get(obj)).toEqual({
            "x": {
                "y": 10
            },
            "z": 20
        });
        const updated = lens.set(obj,{
            "x": {
                "y": 15
            },
            "z": 25
        });
        expect(updated).toEqual({
            "a": [
                {
                    "b": "value",
                    "x1": {
                        "y1": 15
                    },
                    "z1": 25
                }
            ]
        });
    });
});
