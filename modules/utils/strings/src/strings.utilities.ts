/**
 * Converts a camelCase string to a series of words with the first letter capitalized.
 * Example: "thisText" => "This Text"
 *
 * @param input - The camelCase string to convert.
 * @returns The formatted string.
 */
export function camelCaseToWords(input: string): string {
    if (!input) return input;
    return input
        .replace(/([a-z])([A-Z])/g, "$1 $2") // Insert space before uppercase letters preceded by lowercase letters
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // Handle sequences of uppercase letters
        .replace(/([a-zA-Z])([0-9])/g, "$1 $2") // Insert space before numbers following letters
        .replace(/([0-9])([a-zA-Z])/g, "$1 $2") // Insert space before letters following numbers
        .split(" ") // Split into words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(" ") // Join words back into a string
        .trim(); // Trim leading and trailing spaces
}

export function camelCase(input: string): string {
    if (!input) return input;
    return input
        .replace(/[^a-zA-Z@0-9\s-_]/g, "")  // Remove special characters except spaces, hyphens, and underscores
        .toLowerCase()
        .split(/[\s-_]+/)  // Split by space, hyphen, or underscore
        .filter(x => x.trim().length > 0)
        .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join("");
}


export function capitalizeFirstLetter(input: string): string {
    if (!input) return input;
    return input.charAt(0).toUpperCase() + input.slice(1);
}

export const ellipsesInMiddle = (
    text: string,
    maxLength: number,
    ellipsis = "...",
): string => {
    if (text.length <= maxLength) return text;

    const ellipsisLength = ellipsis.length;
    const partLength = Math.floor((maxLength - ellipsisLength) / 2);

    // Ensure we don't cut too much when maxLength is small
    if (partLength <= 0) return ellipsis;

    const start = text.slice(0, partLength);
    const end = text.slice(-partLength);

    return `${start}${ellipsis}${end}`;
};


const nameWithOptionsRegex = /^\s*(.*?)\s*(?:\(\s*(.*?)\s*\))?\s*$/;

export type NameAndOptions = {
    name: string
    options: string[]
}

export function nameWithOptions(input: string): NameAndOptions {
    const match = input.match(nameWithOptionsRegex);
    if (!match) return { name: input.trim(), options: [] };

    const name = match[1].trim();
    const optionsPart = match[2];

    const options = optionsPart
        ? optionsPart.split(",").map((opt) => opt.trim()).filter((opt) => opt.length > 0)
        : [];

    return { name, options };
}

export type AttributeValue = {
    attribute: string;
    value?: string;
};

export function parseAttributeValue(input: string): AttributeValue {
    const parts = input.split(":");
    if (parts.length === 1 && parts[0]) return { attribute: parts[0], value: undefined };
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(`Invalid attribute:value format: '${input}'`);
    }

    return {
        attribute: parts[0],
        value: parts[1],
    };
}