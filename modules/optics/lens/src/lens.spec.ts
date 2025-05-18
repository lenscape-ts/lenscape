import { lensBuilder, LensBuilder } from './lens';
import { identityLens, LensAndPath } from './lensPathPart';
import { child } from './lens.domain';

describe('Lens utilities', () => {
    describe('identityLens', () => {
        it('gets and sets the root object unchanged', () => {
            const obj :any= { a: 1 };
            const lens = identityLens<typeof obj>();
            expect(lens.get(obj)).toEqual(obj);
            expect(lens.set(obj, { b: 2 })).toEqual({ b: 2 });
            expect(lens.path).toEqual([]);
        });
    });

    describe('child lens', () => {
        it('focuses on an object property', () => {
            const obj = { a: { b: 2 } };
            const lens = child(identityLens<typeof obj>(), 'a');
            expect(lens.get(obj)).toEqual({ b: 2 });
            expect(lens.set(obj, { b: 3 })).toEqual({ a: { b: 3 } });
            expect(lens.path).toEqual(['a']);
        });

        it('creates missing parent objects when setting', () => {
            const obj: any = {};
            const lens = child(identityLens<typeof obj>(), 'a');
            expect(lens.set(obj, { b: 3 })).toEqual({ a: { b: 3 } });
        });
    });
});

describe('LensBuilder', () => {
    describe('.focusOn()', () => {
        it('chains into nested properties and get/set works', () => {
            const obj = { a: { b: { c: 4 } } };
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .focusOn('c')
                .build();
            expect(lens.path).toEqual(['a','b','c']);
            expect(lens.get(obj)).toEqual(4);
            expect(lens.set(obj, 5)).toEqual({ a: { b: { c: 5 } } });
        });

        it('gracefully builds intermediates when missing', () => {
            const obj: any = {};
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .build();
            expect(lens.set(obj, { c: 6 })).toEqual({ a: { b: { c: 6 } } });
        });
    });

    describe('.focusIndex()', () => {
        it('focuses an array element and get/set works', () => {
            const obj = { a: { b: [10,20,30] } };
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .focusIndex(1)
                .build();
            expect(lens.path).toEqual(['a','b',1]);
            expect(lens.get(obj)).toEqual(20);
            expect(lens.set(obj, 42)).toEqual({ a: { b: [10,42,30] } });
        });

        it('builds missing arrays/entries when setting', () => {
            const obj: any = {};
            const lens = lensBuilder<typeof obj>()
                .focusOn('a')
                .focusOn('b')
                .focusIndex(1)
                .build();
            expect(lens.set(obj, 42)).toEqual({ a: { b: [undefined,42] } });
        });
    });

    describe('.map()', () => {
        it('applies a function over the focused value', () => {
            type Obj = { x?: number };
            const inc = (v: number|undefined) => (v||0)+2;
            const mapper = lensBuilder<Obj>().focusOn('x').map(inc);
            expect(mapper({ x: 3 })).toEqual({ x: 5 });
            expect(mapper({})).toEqual({ x: 2 });
        });
    });

    describe('.focusOnPath()', () => {
        it('handles array-based paths', () => {
            const obj = { a: { b: [10,20,30] } };
            const lens = lensBuilder<typeof obj>().focusOnPath(['a','b',2]).build();
            expect(lens.path).toEqual(['a','b',2]);
            expect(lens.get(obj)).toEqual(30);
            expect(lens.set(obj,99)).toEqual({ a: { b: [10,20,99] } });
        });

        it('handles string-based paths', () => {
            const obj = { a: { b: [5,6,7] } };
            const lens = lensBuilder<typeof obj>().focusOnPath('a.b.1').build();
            expect(lens.path).toEqual(['a','b',1]);
            expect(lens.get(obj)).toEqual(6);
            expect(lens.set(obj,42)).toEqual({ a: { b: [5,42,7] } });
        });
        it('throws when base path is not an object-composed path', () => {
            // Build a simple lens that isn’t composed
            const simple = lensBuilder<{ a: number }>().focusOn('a');
            expect(
                () => simple.focusOnPart('a' as any, 'b') //as any because this is actually testing things that shouldn't be possible
            ).toThrow(
                'Invalid path for focusOnPart. Must focus on an objectComposed path.'
            );
        });
    });

    describe('.chain()', () => {
        it('composes two custom lenses', () => {
            const baseLens: LensAndPath<{ x: number }, number> = {
                get: o => o.x,
                set: (_, v) => ({ x: v }),
                path: ['x']
            };
            const additional: LensAndPath<number, string> = {
                get: n => n.toString(),
                set: (_, s) => parseInt(s,10),
                path: []
            };
            const lens = lensBuilder<{ x: number }, number>(baseLens).chain(additional).build();
            expect(lens.get({ x: 7 })).toEqual('7');
            expect(lens.set({ x: 0 }, '10')).toEqual({ x: 10 });
            expect(lens.path).toEqual(['x', ...additional.path]);
        });
    });

    describe('.focusCompose()', () => {
        type Obj = { a: { x:number,y:number }, b:{ z:number } };
        const sample: Obj = { a:{ x:10,y:20}, b:{ z:30} };
        const picker = lensBuilder<Obj>()
            .focusOn('a')
            .focusCompose({ x:lensBuilder<{x:number,y:number}>().focusOn('x').build(),
                y:lensBuilder<{x:number,y:number}>().focusOn('y').build() })
            .build();

        it('picks multiple sub-lenses into one object', () => {
            expect(picker.path).toEqual(['a',{ x:['x'], y:['y'] }]);
            expect(picker.get(sample)).toEqual({ x:10,y:20 });
            expect(picker.set(sample,{x:15,y:25})).toEqual({ a:{x:15,y:25}, b:{z:30} });
        });

        it('handles undefined root gracefully', () => {
            expect(picker.set({} as any,{x:1,y:2})).toEqual({ a:{x:1,y:2} });
        });
    });

    describe('.focusCompose()+.focusOn()', () => {
        type Obj = { a:{ x:number, y:{z:number} } };
        const sample: Obj = { a:{ x:10, y:{z:20} } };
        const composed = lensBuilder<Obj>()
            .focusOn('a')
            .focusCompose({
                x: lensBuilder<{x:number,y:{z:number}}>().focusOn('x'),
                y: lensBuilder<{x:number,y:{z:number}}>().focusOn('y')
            });

        it('can then focus on one of the composed parts', () => {
            const lensY = composed.focusOn('y').build();
            expect(lensY.path).toEqual(['a',{ x:['x'], y:['y'] }, 'y']);
            expect(lensY.get(sample)).toEqual({ z:20 });
            expect(lensY.set(sample,{z:30})).toEqual({ a:{ x:10, y:{z:30} } });
        });

        it('can drill further into the composed part', () => {
            const lensZ = composed.focusOn('y').focusOn('z').build();
            expect(lensZ.path).toEqual(['a',{ x:['x'], y:['y'] }, 'y', 'z']);
            expect(lensZ.get(sample)).toEqual(20);
            expect(lensZ.set(sample,25)).toEqual({ a:{ x:10, y:{z:25} } });
        });
    });

    describe('.focusOnPart()', () => {
        type Obj = { sel:{x:number}, dom:{other:string,junk:string} };
        const sample: Obj = { sel:{x:42}, dom:{other:'v',junk:'j'} };
        const composed = lensBuilder<Obj>()
            .focusCompose({
                sel: lensBuilder<Obj>().focusOn('sel').build(),
                dom: lensBuilder<Obj>().focusOn('dom').build()
            });

        it('refines one key of a composed object', () => {
            const refined = composed.focusOnPart('dom','other');
            expect(refined.path).toEqual([{ other:['dom','other'], sel:['sel'] }]);
            expect(refined.get(sample)).toEqual({ sel:{x:42}, dom:'v' });
            expect(refined.set(sample,{ sel:{x:7}, dom:'new' }))
                .toEqual({ sel:{x:7}, dom:{other:'new', junk:'j'} });
        });

        it('throws on invalid part', () => {
            expect(() => composed.focusOnPart('bad' as any,'x' as any))
                .toThrow('Invalid part [bad] for focusOnPart.');
        });
    });

    describe('.build()', () => {
        it('returns the exact underlying lens', () => {
            const custom: LensAndPath<{v:number},number> = {
                get: o => o.v*2,
                set: (_,v) => ({ v:v/2 }),
                path: ['v']
            };
            const built = new LensBuilder(custom).build();
            expect(built).toBe(custom);
        });
    });
});
