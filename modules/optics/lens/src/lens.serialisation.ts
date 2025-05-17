
import { ComposedPathPart, identityLens, LensAndPath, LensPath, LensPathPart } from "./lensPathPart";
import { child, index, objectCompose } from "./lens.domain";

export type Token = string | number | '{' | '}' | ':' | ',';

export function tokenizePath(serialized: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const isDigit = (char: string) => char >= '0' && char <= '9';

    while (i < serialized.length) {
        const char = serialized[i];

        if (char === '{' || char === '}' || char === ':' || char === ',') {
            tokens.push(char);
            i++;
        } else if (char === '\\') {
            // Handle escaped characters
            if (i + 1 < serialized.length) {
                const nextChar = serialized[i + 1];
                if (['.', '{', '}'].includes(nextChar)) {
                    tokens.push(nextChar);
                    i += 2;
                } else {
                    throw new Error(`Invalid escape sequence at position ${i}`);
                }
            } else {
                throw new Error('Incomplete escape sequence at end of string');
            }
        } else if (isDigit(char) || char === '-') {
            // Handle numbers
            let num = char;
            i++;
            while (i < serialized.length && isDigit(serialized[i])) {
                num += serialized[i];
                i++;
            }
            tokens.push(parseInt(num, 10));
        } else if (/[a-zA-Z_]/.test(char)) {
            // Handle strings
            let str = '';
            while (i < serialized.length && !['.', '{', '}', ':', ','].includes(serialized[i])) {
                if (serialized[i] === '\\' && i + 1 < serialized.length) {
                    str += serialized[++i]; // Add escaped character
                } else {
                    str += serialized[i];
                }
                i++;
            }
            tokens.push(str);
        } else if (char === '.') {
            // Skip separators (dots)
            i++;
        } else {
            throw new Error(`Unexpected character '${char}' at position ${i}`);
        }
    }

    return tokens;
}

export function parseTokens(tokens: Token[]): LensPath {
    let index = 0;

    const parseLensPath = (): LensPath => {
        const path: LensPath = [];
        while (index < tokens.length) {
            const token = tokens[index++];
            if (token === '}' || token === ',') {
                index-- //don't consume the token
                return path;// End of a nested object
            } else if (token === '{') {                // Start of a nested object
                path.push(parseNestedObject());
            } else if (typeof token === 'string' || typeof token === 'number') {
                // Add strings and numbers directly to the path
                path.push(token);
            } else {
                // Skip structural tokens that are misplaced
                throw new Error(`Unexpected token '${token}' at position ${index}`);
            }
        }
        return path;
    };

    const parseNestedObject = (): Record<string, LensPath> => {
        const nestedObject: Record<string, LensPath> = {};
        const startIdx = index;
        while (index < tokens.length) {
            const keyToken = tokens[index++];
            if (typeof keyToken !== 'string') {
                throw new Error(`Expected string key, got '${keyToken}' at position ${index}`);
            }
            if (keyToken === '}') throw new Error(`Unexpected '}' at position ${index}`);
            if (keyToken === ',') throw new Error(`Unexpected ',' at position ${index}`);

            if (tokens[index++] !== ':') {
                throw new Error(`Expected ':' after key '${keyToken}', got '${tokens[index]}'`);
            }

            const value = parseLensPath();
            nestedObject[keyToken] = value;
            if (tokens[index] === ',') {
                index++; // Consume the comma
                continue;// we carry on the loop
            } else if (tokens[index] === '}') {
                // End of the nested object
                index++; // Consume the closing brace
                return nestedObject;
            }
            if (index >= tokens.length) {
                throw new Error(`Unexpected end of context. Expected a }. This object started at ${startIdx}`);
            } else {
                throw new Error(`Expected ',' or '}', got '${tokens[index]}' at position ${index}`);
            }
        }
        throw new Error(`Unexpected end of nested object at position ${index}. This object started at ${startIdx}`);
    };

    const result = parseLensPath();
    if (index < tokens.length) {
        throw new Error(`Unexpected tokens remaining at position ${index}`);
    }
    return result;
}

export function parseLens(serialized: string): LensPath {
    const tokens = tokenizePath(serialized);
    return parseTokens(tokens);
}

export function serializeLens(path: LensPath): string {
    const escapeLabel = (label: string): string => label.replace(/[.{}:,]/g, '\\$&'); // Escape '.', '{', '}', ':', ','

    const serializePart = (part: LensPathPart): string => {
        if (typeof part === 'string') {
            return escapeLabel(part);
        }
        if (typeof part === 'number') {
            return part.toString();
        }
        if (typeof part === 'object') {
            const entries = Object.entries(part).map(
                ([key, value]) => `${escapeLabel(key)}:${serializeLens(value)}`
            );
            return `{${entries.join(',')}}`;
        }
        throw new Error('Invalid LensPathPart');
    };

    return path.map(serializePart).join('.');
}

export function lensFromPath<Main, Child>(path: LensPath | string): LensAndPath<Main, Child> {

    const buildLens = (lens: LensAndPath<any, any>, pathPart: LensPathPart): LensAndPath<any, any> => {
        if (typeof pathPart === 'string') {
            return child(lens, pathPart);
        } else if (typeof pathPart === 'number') {
            return index(lens, pathPart);
        } else if (typeof pathPart === 'object') {
            const childLenses: Record<string, LensAndPath<any, any>> = {};
            for (const [key, subPath] of Object.entries(pathPart as ComposedPathPart)) {
                childLenses[key] = lensFromPath(subPath);
            }
            return objectCompose(lens, childLenses);
        } else {
            throw new Error(`Unexpected path part: ${pathPart}`);
        }
    };

    if (typeof path === 'string') {
        path = parseLens(path);
    }
    return path.reduce(buildLens, identityLens<Main>());
}