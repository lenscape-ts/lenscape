import axios from "axios";
import {elasticSearchToken} from "../secrets";
import {chunkAndMapArrays} from "@lenscape/arrays";
import {ElasticSearchConfig} from "../elasticSearchConfig";


export type KnnSubmitResult = {
    id: string;
    score: number;
    index: string;
    full_text_embeddings: number[];
    keyfields: string[];
    keyfield: string;
}

export type KnnSubmitConfig = {
    size?: number;
}

export async function knnSubmit({elasticSearchUrl, model_id}: ElasticSearchConfig, indexOrIndices: string, query: string, config?: KnnSubmitConfig): Promise<KnnSubmitResult[]> {
    const {size = 6} = config || {};
    const resp = await axios.post(
        `${elasticSearchUrl}/${indexOrIndices}/_search`,
        {
            size,
            // _source: {"excludes": ["full_text_embeddings"]},
            knn: {
                field: 'full_text_embeddings',
                query_vector_builder: {
                    text_embedding: {
                        model_id,
                        model_text: query
                    }
                },
                k: size,
                num_candidates: size * 3
            },
            from: 0
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: elasticSearchToken
            }
        }
    );
    return resp.data.hits.hits.map((hit: any) => {
        return {
            id: hit._id,
            score: hit._score,
            index: hit._source.originalIndex || hit._index,
            full_text_embeddings: hit._source.full_text_embeddings,
            keyfield: hit._source.keyfield || '',
            keyfields: hit._source.keyfields || []
        };
    });
}

export async function vectorise({elasticSearchUrl, model_id}: ElasticSearchConfig, query: string): Promise<number[]> {
    const {data} = await axios.post(
        `${elasticSearchUrl}/_ml/trained_models/${model_id}/_infer`,
        {docs: [{text_field: query}]},
        {headers: {Authorization: elasticSearchToken}}
    );
    const queryVector = data.inference_results[0].predicted_value;
    return queryVector

}

export type VectoriseResult = {
    query: string;
    value: number[];
}
export type QueryAndSimilarity = {
    query: string;
    similarity: number;
}

export const massVectorise = ({elasticSearchUrl, model_id}: ElasticSearchConfig) => async (queries?: string[]): Promise<VectoriseResult[]> => {
    if (!queries || queries.length === 0) return [];
    const {data} = await axios.post(
        `${elasticSearchUrl}/_ml/trained_models/${model_id}/_infer`,
        {docs: queries.map(text => ({text_field: text}))},
        {headers: {Authorization: elasticSearchToken}}
    );

    return data.inference_results.map((r: any, i: number) => ({query: queries[i], value: r.predicted_value}));
};

export const chunkAndMassVectorise = (elasticSearchConfig: ElasticSearchConfig) =>
    chunkAndMapArrays(500, massVectorise(elasticSearchConfig))


