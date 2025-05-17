export type FindIdFn<T> = (t: T) => string;

export function interleave<T>(arrays: T[][]): T[] {
    const result: T[] = [];
    const maxLength = Math.max(...arrays.map((a) => a.length));
    for (let i = 0; i < maxLength; i++) {
        for (const a of arrays) {
            if (i < a.length) {
                result.push(a[i]);
            }
        }
    }
    return result;
}
export function removeDuplicates<T>(findIdFn: FindIdFn<T>) {
    return (rawResult: T[]) => {
        const result: T[] = [];
        const ids = new Set<string>();
        for (const t of rawResult) {
            const id = findIdFn(t);
            if (!ids.has(id)) {
                result.push(t);
                ids.add(id);
            }
        }
        return result;
    };
}

export function countByKey<T>(array: T[], key: keyof T): { [key: string]: number } {
    return array.reduce((acc: { [key: string]: number }, item: T) => {
        const keyValue = item[key];
        if (keyValue !== undefined && keyValue !== null) {
            const keyString = String(keyValue);
            acc[keyString] = (acc[keyString] || 0) + 1;
        }
        return acc;
    }, {});
}
