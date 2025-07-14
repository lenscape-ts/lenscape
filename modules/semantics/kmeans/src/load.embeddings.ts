import {promises as fs} from 'fs';
import {LabeledVector} from "./labeledVector";

export function transformIntoLabeledVectors(parsed: any) {

    const hits = parsed?.hits?.hits ?? [];

    const vectors: LabeledVector[] = hits
        .filter((hit: any) => Array.isArray(hit._source?.full_text_embeddings))
        .map((hit: any) => ({
            id: hit._id,
            vector: new Float32Array(hit._source.full_text_embeddings),
        }));

    return vectors;
}

export async function loadLabeledVectors(filePath: string): Promise<LabeledVector[]> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return transformIntoLabeledVectors(parsed);
}
