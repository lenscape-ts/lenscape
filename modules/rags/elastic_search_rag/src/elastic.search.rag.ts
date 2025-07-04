import {RagBaseMessage, RagFn} from "@lenscape/rag_agents";
import axios, {Axios, AxiosError, AxiosResponse} from "axios";
import {BaseMessage} from "@lenscape/agents";
import {ErrorsOr, isErrors} from "@lenscape/errors";
import {LogAnd} from "@lenscape/agents/src/log.options";

export type  TokenFn = () => Promise<string>;
export type ElasticSearchConfig = {
    elasticSearchUrl: string
    axios: Axios
    tokenFn: TokenFn
    blacklistedFields?: string[]
}

export function defaultElasticSearchRagConfig(): ElasticSearchConfig {
    return {
        elasticSearchUrl: 'https://f0571c62200b4d249a4c6750ab7f4716.westeurope.azure.elastic-cloud.com:9243',
        axios,
        tokenFn: async () => process.env.ELASTIC_TOKEN2,
        blacklistedFields: ['full_text_embeddings', 'vectorisation_model']
    }
}

export const elasticSearchRag = ({elasticSearchUrl, axios, tokenFn, blacklistedFields}: ElasticSearchConfig): RagFn =>
    async (query, indices, top) => {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `ApiKey ${await tokenFn()}`,
        };
        const url = `${elasticSearchUrl}/${indices}/_search`
        const body = {
            _source: {
                excludes: blacklistedFields
            },
            knn: {
                field: "full_text_embeddings",
                query_vector_builder: {
                    text_embedding: {
                        model_id: ".multilingual-e5-small_linux-x86_64",
                        model_text: query,
                    },
                },
                k: top,
                num_candidates: top + 10,
            },
        }

        console.log(JSON.stringify(body,null,2))
        async function post(): Promise<LogAnd<ErrorsOr<AxiosResponse>>> {
            try {
                return {value: await axios.post(url, body, {headers})}
            } catch (e) {
                if (e instanceof AxiosError) {
                    const errorMessage = e.response?.data?.error?.reason || e.message;
                    return {
                        errors: [errorMessage], extras: e, log: {
                            whatHappened: 'elasticsearchrag.axioserror',
                            params: `Status: ${e.response.status}\nResponse: ${JSON.stringify(e.response.data)}`, severity: 'error'
                        }
                    };
                }
                return {errors: [e instanceof Error ? e.message : 'Unknown error occurred'], extras: e, log: 'elasticsearchrag.error'}
            }
        }

        const response = await post()
        if (isErrors(response)) return response;
        const hits: any[] = response.value.data.hits.hits || []
        const firstIndex = hits[0]?._index
        console.log('rag', JSON.stringify(response.value.data, null, 2))
        console.log('hits', JSON.stringify(hits, null, 2))
        const topHits = hits.slice(0, top).map((hit, index) => `Document ${index + 1}:\n${JSON.stringify(hit._source)}\n`);
        console.log('topHits', JSON.stringify(topHits, null, 2))
        const message: RagBaseMessage = {role: 'system' as const, content: `Found ${hits.length} documents. Top ${top} are:\n${topHits.join('\n')}`, firstIndex};
        return {value: [message], log: 'elasticsearchrag.success'};
    }