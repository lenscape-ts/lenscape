const ENGLISH_STOPWORDS = new Set([
    "the", "and", "is", "in", "to", "it", "you", "of", "for", "on", "with",
    "this", "that", "at", "by", "from", "are", "was", "be", "as", "or", "have",
    "but", "not", "they", "an", "his", "her", "we", "which", "can", "has",
    "my", "me", "I", "do", "does", "did", "a", "he", "she", "them", "their", "our"
]);

/**
 * Checks whether a given text is probably in English.
 * It does this by checking the proportion of English stopwords present in the text.
 *
 * @param text - The input text to evaluate.
 * @param threshold - Minimum proportion of English stopwords to assume text is English (default: 0.1).
 * @returns boolean indicating if the text is likely English.
 */
export function isProbablyEnglish(text: string, threshold = 0.1): boolean {
    const tokens = text.toLowerCase().match(/\b[a-z]+\b/g);

    if (!tokens || tokens.length === 0) return false;

    const stopwordCount = tokens.reduce((count, token) => {
        return ENGLISH_STOPWORDS.has(token) ? count + 1 : count;
    }, 0);

    const proportion = stopwordCount / tokens.length;

    return proportion >= threshold;
}


