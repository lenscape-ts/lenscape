import {AppendAndGetAsyncStore, StoreGetAsyncStore} from "@lenscape/async_storage";
import {Codec} from "@lenscape/codec";
import {ErrorsOr, isErrors, isValue, mapErrorsOr, mapErrorsOrK, partitionNameAndErrorsOr} from "@lenscape/errors";
import * as fs from "node:fs";
import path from "path";
import {collect} from "@lenscape/arrays";

export type IdToFileNameFn<Id> = (id: Id) => string;
export type AsyncFileStorageConfig<Id, Data> = {
    idToFileName: IdToFileNameFn<Id>
    codec: Codec<Data>
    debug?: boolean
}

export function idToFileName22<Id>(root: string, toString: (id: Id) => string): IdToFileNameFn<Id> {
    return (id: Id) => {
        const idString = toString(id)
        const longenough = idString.length < 5 ? (idString + 'xxxxxx').slice(0, 5) : idString; // ensure at least 4 characters
        const firstTwoChars = longenough.slice(0, 2);
        const secondTwoChars = longenough.slice(2, 4);
        const restOfId = longenough.slice(4);
        return path.join(root, `${firstTwoChars}/${secondTwoChars}/${restOfId}.json`).replaceAll(/\\/g,'/')
    };
}

export function fileAsyncStore<Id, Data>({idToFileName, codec, debug}: AsyncFileStorageConfig<Id, Data>): StoreGetAsyncStore<Id, Data> {
    const store = (id: Id, data: Data): Promise<ErrorsOr<void>> => {
        const filename = idToFileName(id);
        const dir = path.dirname(filename);
        if (debug) console.log(`Storing data for id: ${id} in file: ${filename}`);
        return fs.promises.mkdir(dir, {recursive: true})
            .then(() => mapErrorsOrK(codec.encode(data), text =>
                fs.promises.writeFile(filename, text))
                .catch(e => ({errors: [`Error writing file: ${filename}. ${e.message}`]})))
    }
    const get = async (id: Id): Promise<ErrorsOr<Data>> => {
        const filename = idToFileName(id);
        if (debug) console.log(`Retrieving data for id: ${id} from file: ${filename}`);
        try {
            return codec.decode(await fs.promises.readFile(filename, 'utf-8'))
        } catch (e) {
            return {errors: [`Error opening file: ${filename}. ${e.message}`]}
        }
    }
    return {store, get}
}

export function fileAppendStore<Id, Data>({idToFileName, codec, debug}: AsyncFileStorageConfig<Id, Data>): AppendAndGetAsyncStore<Id, Data> {
    const append = (id: Id, data: Data): Promise<ErrorsOr<void>> => {
        const filename = idToFileName(id);
        const dir = path.dirname(filename);
        if (debug) console.log(`Storing data for id: ${id} in file: ${filename}`);
        return fs.promises.mkdir(dir, {recursive: true})
            .then(() => mapErrorsOrK(codec.encode(data), text =>
                fs.promises.appendFile(filename, `${text}\n`))
                .catch(e => ({errors: [`Error writing file: ${filename}. ${e.message}`]})))
    }
    const get = async (id: Id): Promise<ErrorsOr<Data[]>> => {
        const filename = idToFileName(id);
        if (debug) console.log(`Retrieving data for id: ${id} from file: ${filename}`);
        try {
            const allLines = await fs.promises.readFile(filename, 'utf-8');
            const lines = allLines.split('\n').filter(line => line.trim() !== '');
            const parsedData = lines.map(line => codec.decode(line));
            const errors = collect(parsedData, isErrors).flatMap(e => e.errors)
            if (errors.length > 0) return {errors};
            const value = collect(parsedData, isValue).map(v => v.value);
            return {value}

        } catch (e) {
            return {errors: [`Error opening file: ${filename}. ${e.message}`]}
        }
    }
    return {append, get}
}
