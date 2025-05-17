import {lensBuilder, LensBuilder} from './lens';
import {identityLens, LensAndPath} from "./lensPathPart";
import {child} from "./lens.domain";

describe('Lens functionality', () => {
    describe('identityLens', () => {
        it('should get the main object as is', () => {
            const obj = {a: 1};
            const lens = identityLens<typeof obj>();
            expect(lens.get(obj)).toEqual(obj);
            expect(lens.path).toEqual([]); // Check that the path is empty
        });

        it('should set the main object entirely', () => {
            const obj: any = {a: 1};
            const newObj: any = {b: 2};
            const lens = identityLens<typeof obj>();
            expect(lens.set(obj, newObj)).toEqual(newObj);
            expect(lens.path).toEqual([]); // Path remains empty
        });
    });

    describe('child', () => {
        it('should get a child property of the main object', () => {
            const obj = {a: {b: 2}};
            const lens = child(identityLens<typeof obj>(), 'a');
            expect(lens.get(obj)).toEqual({b: 2});
            expect(lens.path).toEqual(['a']); // Path includes the child key
        });

        it('should set a child property of the main object', () => {
            const obj = {a: {b: 2}};
            const lens = child(identityLens<typeof obj>(), 'a');
            const updated = lens.set(obj, {b: 3});
            expect(updated).toEqual({a: {b: 3}});
            expect(lens.path).toEqual(['a']);
        });

        it('should handle undefined parent gracefully and create it when setting', () => {
            const obj: any = {};
            const lens = child(identityLens<typeof obj>(), 'a');
            const updated = lens.set(obj, {b: 3});
            expect(updated).toEqual({a: {b: 3}});
            expect(lens.path).toEqual(['a']);
        });
    });

    describe('LensBuilder - focusOn', () => {
        it('should create a lens that focuses on nested properties', () => {
            const obj = {a: {b: {c: 4}}};
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .focusOn('c')
                .build();

            expect(lens.get(obj)).toEqual(4);
            expect(lens.path).toEqual(['a', 'b', 'c']); // Path includes all keys

            const updated = lens.set(obj, 5);
            expect(updated).toEqual({a: {b: {c: 5}}});
        });

        it('should handle undefined intermediates gracefully', () => {
            const obj: any = {};
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .build();

            const updated = lens.set(obj, {c: 6});
            expect(updated).toEqual({a: {b: {c: 6}}});
            expect(lens.path).toEqual(['a', 'b']);
        });
    });

    describe('LensBuilder - focusIndex', () => {
        it('should get an element from an array within an object', () => {
            const obj = {a: {b: [10, 20, 30]}};
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .focusIndex(1)
                .build();

            expect(lens.get(obj)).toEqual(20);
            expect(lens.path).toEqual(['a', 'b', 1]); // Path includes array index
        });

        it('should set an element in an array within an object', () => {
            const obj = {a: {b: [10, 20, 30]}};
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .focusIndex(1)
                .build();

            const updated = lens.set(obj, 42);
            expect(updated).toEqual({a: {b: [10, 42, 30]}});
            expect(lens.path).toEqual(['a', 'b', 1]);
        });

        it('should create intermediate objects and arrays when setting an element', () => {
            const obj: any = {};
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .focusIndex(1)
                .build();

            const updated = lens.set(obj, 42);
            expect(updated).toEqual({a: {b: [undefined, 42]}});
            expect(lens.path).toEqual(['a', 'b', 1]);
        });

        it('should handle setting an element in an array that already has undefined elements', () => {
            const obj: any = {a: {b: [10, undefined, 30]}};
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .focusIndex(1)
                .build();

            const updated = lens.set(obj, 42);
            expect(updated).toEqual({a: {b: [10, 42, 30]}});
            expect(lens.path).toEqual(['a', 'b', 1]);
        });
    });
    describe('LensBuilder delegation', () => {
        it('should delegate get to the embedded lens', () => {
            const embeddedLens: LensAndPath<any, any> = {
                get: jest.fn(() => 42),
                set: jest.fn(),
                path: ['test']
            };

            const lensBuilder = new LensBuilder(embeddedLens);
            const result = lensBuilder.get({});

            expect(embeddedLens.get).toHaveBeenCalledWith({});
            expect(result).toBe(42);
        });

        it('should delegate set to the embedded lens', () => {
            const embeddedLens: LensAndPath<any, any> = {
                get: jest.fn(),
                set: jest.fn(() => ({updated: true})),
                path: ['test']
            };

            const lensBuilder = new LensBuilder(embeddedLens);
            const result = lensBuilder.set({}, {some: 'value'});

            expect(embeddedLens.set).toHaveBeenCalledWith({}, {some: 'value'});
            expect(result).toEqual({updated: true});
        });

        it('should delegate path to the embedded lens', () => {
            const embeddedLens: LensAndPath<any, any> = {
                get: jest.fn(),
                set: jest.fn(),
                path: ['test']
            };

            const lensBuilder = new LensBuilder(embeddedLens);
            expect(lensBuilder.path).toEqual(['test']);
        });
    });

    describe('LensBuilder - focusCompose', () => {
        type Obj = { a: A, b: B };
        type A = { x: number, y: number };
        type B = { z: number };
        const obj: Obj = {a: {x: 10, y: 20}, b: {z: 30}};

        const composedLens = lensBuilder<typeof obj>()
            .focusOn('a')
            .focusCompose({x: lensBuilder<A>().focusOn('x'), y: lensBuilder<A>().focusOn('y')})
            .build();

        it('should compose multiple child lenses into a single lens', () => {

            expect(composedLens.get(obj)).toEqual({x: 10, y: 20});
            expect(composedLens.path).toEqual([
                "a", {
                    "x": ["x"],
                    "y": ["y"]
                }]);

            const updatedObj = composedLens.set(obj, {x: 15, y: 25});
            expect(updatedObj).toEqual({a: {x: 15, y: 25}, b: {z: 30}});
        });

        it('should handle undefined parent values gracefully', () => {
            const obj: any = {};

            const updatedObj = composedLens.set(obj, {x: 10, y: 20});
            expect(updatedObj).toEqual({a: {x: 10, y: 20}});
        });

        it('should compose lenses for nested objects', () => {
            type Obj = { a: A };
            type A = { x: X, y: Y };
            type X = { m: number };
            type Y = { n: number };
            const obj: Obj = {a: {x: {m: 1}, y: {n: 2}}};

            const lensXM = lensBuilder<typeof obj['a']['x']>().focusOn('m').build();
            const lensYN = lensBuilder<typeof obj['a']['y']>().focusOn('n').build();

            const composedLens: LensAndPath<Obj, { m: number, n: number }> = lensBuilder<Obj>()
                .focusOn('a')
                .focusCompose({
                    m: lensBuilder<A>().focusOn('x').focusOn('m'),
                    n: lensBuilder<A>().focusOn('y').focusOn('n')
                })
                .build();

            expect(composedLens.get(obj)).toEqual({"m": 1, "n": 2});
            expect(composedLens.path).toEqual([
                "a",
                {
                    "m": ["x", "m"],
                    "n": ["y", "n"]
                }]);

            const updatedObj = composedLens.set(obj, {m: 42, n: 84});
            expect(updatedObj).toEqual({a: {x: {m: 42}, y: {n: 84}}});
        });
    });

    describe('Lens functionality - focusCompose with focusOn following', () => {
        type Obj = { a: A };
        type A = { x: number, y: Y };
        type Y = { z: number };

        const obj: Obj = {
            a: {
                x: 10,
                y: {
                    z: 20
                }
            }
        };
        it('should allow focusing on a part of a composed lens', () => {

            const testLensX = lensBuilder<typeof obj['a']>().focusOn('x').build();
            const testLensY = lensBuilder<typeof obj['a']>().focusOn('y').build();

            const composedLens: LensBuilder<Obj, { x: number, y: Y }> = lensBuilder<Obj>()
                .focusOn('a')
                .focusCompose({
                    x: lensBuilder<A>().focusOn('x'),
                    y: lensBuilder<A>().focusOn('y')
                })


            const focusOnY: LensAndPath<Obj, Y> = composedLens.focusOn('y').build();

            expect(focusOnY.get(obj)).toEqual({z: 20});
            expect(focusOnY.path).toEqual([
                "a",
                {
                    "x": ["x"],
                    "y": ["y"]
                },
                "y"
            ]);

            const updatedObj = focusOnY.set(obj, {z: 30});
            expect(updatedObj).toEqual({
                a: {
                    x: 10,
                    y: {
                        z: 30
                    }
                }
            });
        });

        it('should allow focusing on a nested property of a composed lens part', () => {
            type Obj = { a: A };
            type A = { x: number, y: Y };
            type Y = { z: number };

            const obj = {
                a: {
                    x: 10,
                    y: {
                        z: 20
                    }
                }
            };

            const composedLens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusCompose({
                    x: lensBuilder<A>().focusOn('x'),
                    y: lensBuilder<A>().focusOn('y')
                })

            const focusOnZ = composedLens.focusOn('y').focusOn('z').build();

            expect(focusOnZ.get(obj)).toEqual(20);
            expect(focusOnZ.path).toEqual([
                "a",
                {"x": ["x"], "y": ["y"]},
                "y",
                "z"
            ]);

            const updatedObj = focusOnZ.set(obj, 25);
            expect(updatedObj).toEqual({
                a: {
                    x: 10,
                    y: {
                        z: 25
                    }
                }
            });
        });

    });


    describe('focusOnPart', () => {
        type Obj = { selection: Selection, domain: Domain };
        type Selection = { x: number };
        type Domain = { other: string, junk: string };
        it('should refine a specific part of a composed lens', () => {
            const obj: Obj = {
                selection: {x: 42},
                domain: {other: 'value', junk: "junk"}
            };
            const compositeLens = lensBuilder<Obj>()
                .focusCompose({
                    selection: lensBuilder<Obj>().focusOn('selection').build(),
                    domain: lensBuilder<Obj>().focusOn('domain').build()
                });

            const refinedLens = compositeLens.focusOnPart('domain', 'other');
            expect(refinedLens.path).toEqual([
                {
                    "other": ["domain", "other"],
                    "selection": ["selection"]
                }
            ]);

            // Test get functionality
            expect(refinedLens.get(obj)).toEqual({
                selection: {x: 42},
                domain: 'value'
            });

            // Test set functionality
            const updated = refinedLens.set(obj, {
                selection: {x: 100},
                domain: 'newValue'
            });

            expect(updated).toEqual({
                selection: {x: 100},
                domain: {other: 'newValue', "junk": "junk"}
            });
        });

        it('should throw an error for invalid parts', () => {
            const compositeLens = lensBuilder<Obj>()
                .focusCompose({
                    selection: lensBuilder<Obj>().focusOn('selection').build(),
                    domain: lensBuilder<Obj>().focusOn('domain').build()
                });

            expect(() => compositeLens.focusOnPart('invalid' as any, 'key' as any)).toThrow('Invalid part [invalid] for focusOnPart.');
        });
    });

});
