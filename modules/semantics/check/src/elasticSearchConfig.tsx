import {makeContextFor} from "@lenscape/context";


export type ElasticSearchConfig = {
    elasticSearchUrl: string;
    model_id: string
    centroidIndex: string
    indices: string[]
}

export const {use: useElasticSearchContext, Provider: ElasticSearchProvider} = makeContextFor<ElasticSearchConfig, 'elasticSearchConfig'>('elasticSearchConfig')