import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {AppendAndGetAsyncStore, AsyncStore} from "@lenscape/async_storage";
import {fileAppendStore, fileAsyncStore, idToFileName22} from "./async.file.storage";
import {jsonCodec} from "@lenscape/codec";
import {errorsOrThrow, valueOrThrow} from "@lenscape/errors";

let tempDir: string;
let asyncStore: AsyncStore<string, any>
let appendStore: AppendAndGetAsyncStore<string, any>


describe('idToFileName22', () => {
    test('should generate correct file names for various IDs', () => {
        const idToFileName = idToFileName22('root', (id: string) => id);
        expect(idToFileName('12345')).toBe('root/12/34/5.json');
        expect(idToFileName('abcde')).toBe('root/ab/cd/e.json');
        expect(idToFileName('a')).toBe('root/ax/xx/x.json'); // less than 5 chars, should pad
        expect(idToFileName('')).toBe('root/xx/xx/x.json'); // empty string, should pad
    })
})

describe('File Storage Tests', () => {
    beforeEach(async () => {
        tempDir = path.join(os.tmpdir(), `test-dir-${Date.now()}`);
        await fs.mkdir(tempDir);
        const config = {debug: false, idToFileName: idToFileName22<string>(tempDir, id => id), codec: jsonCodec('async store')};
        asyncStore = fileAsyncStore(config,)
        appendStore = fileAppendStore(config);
    });

    afterEach(async () => {
        if (tempDir && (await fs.stat(tempDir).catch(() => false))) {
            await fs.rm(tempDir, {recursive: true});
        }
    });

    describe('Async File Storage Tests', () => {

        test('error if file not found', async () => {
            const errors = errorsOrThrow(await asyncStore.get('notin'))
            expect(errors[0]!).toMatch(/Error opening file/);
        });
        test('store and get data', async () => {
            const data = {foo: 'bar'};
            const value = valueOrThrow(await asyncStore.store('testId', data))
            const result = valueOrThrow(await asyncStore.get('testId'));
            expect(result).toEqual(data);
        })
    });
    describe('File Append Storage Tests', () => {
        test('error if file not found', async () => {
            const errors = errorsOrThrow(await appendStore.get('notin'))
            expect(errors[0]!).toMatch(/Error opening file/);
        })
        test('appending one item to new file', async () => {
            valueOrThrow(await appendStore.append('id1', {hello: 'world'}));
            expect(valueOrThrow(await appendStore.get('id1'))).toEqual([{hello: 'world'}]);
        })
        test('appending multiple items to new file', async () => {
            await appendStore.append('id2', {foo: 'bar'});
            await appendStore.append('id2', {foo: 'baz'});
            expect(valueOrThrow(await appendStore.get('id2'))).toEqual([{foo: 'bar'}, {foo: 'baz'}]);
        });
        test('interleaving multiple appends', async () => {
            await appendStore.append('id2', {foo: 'bar'});
            valueOrThrow(await appendStore.append('id1', {hello: 'world'}));
            await appendStore.append('id2', {foo: 'baz'});
            expect(valueOrThrow(await appendStore.get('id1'))).toEqual([{hello: 'world'}]);
            expect(valueOrThrow(await appendStore.get('id2'))).toEqual([{foo: 'bar'}, {foo: 'baz'}]);
        })

    })
})

//export function fileAppendStore<Id, Data>({idToFileName, codec, debug}: AsyncFileStorageConfig<Id, Data>): AppendAndGetAsyncStore<Id, Data> {
//     const append = (id: Id, data: Data): Promise<ErrorsOr<void>> => {
//         const filename = idToFileName(id);
//         const dir = path.dirname(filename);
//         if (debug) console.log(`Storing data for id: ${id} in file: ${filename}`);
//         return fs.promises.mkdir(dir, {recursive: true})
//             .then(() => mapErrorsOrK(codec.encode(data), text =>
//                 fs.promises.appendFile(filename, `${text}\n`))
//                 .catch(e => ({errors: [`Error writing file: ${filename}. ${e.message}`]})))
//     }
//     const get = async (id: Id): Promise<ErrorsOr<Data[]>> => {
//         const filename = idToFileName(id);
//         if (debug) console.log(`Retrieving data for id: ${id} from file: ${filename}`);
//         try {
//             const allLines = await fs.promises.readFile(filename, 'utf-8');
//             const lines = allLines.split('\n').filter(line => line.trim() !== '');
//             const parsedData = lines.map(line => codec.decode(line));
//             const errors = collect(parsedData, isErrors).flatMap(e => e.errors)
//             if (errors.length > 0) return {errors};
//             const value = collect(parsedData, isValue).map(v => v.value);
//             return {value}
//
//         } catch (e) {
//             return {errors: [`Error opening file: ${filename}. ${e.message}`]}
//         }
//     }
//     return {append, get}
// }