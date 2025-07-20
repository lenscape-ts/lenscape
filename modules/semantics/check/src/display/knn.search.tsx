import React, {useEffect, useState} from 'react';
import {knnSubmit, massVectorise, QueryAndSimilarity, vectorise} from "../helpers/getters";
import {cosineSimilarity} from "../helpers/cosineSimilarity";
import {TwoColumnAndRestLayout} from "./two.column.and.rest.layout";
import {InputBar} from "./inputBar";
import {AppChildProps, HasQuestions} from "../appProps";
import {useElasticSearchContext} from "../elasticSearchConfig";
import {SimilarityAndIdProps, SimiliarityAndIdList} from "./similiarityAndIdList";
import {ShowJson, ShowText} from "./show,json";

export type KnnResult = {
    id: string
    score: number
    index: string
    similarity: number
    keyfield: string
    keyfields: string[]
}

export function KnnResults({results, selected, queryVec}: SimilarityAndIdProps) {
    const result = results[selected[0]];
    return <TwoColumnAndRestLayout rootId='knn.results'>
        <SimiliarityAndIdList selected={selected} results={results} queryVec={queryVec}/>
        <KnnSelectedResult result={result} queryVec={queryVec}/>
    </TwoColumnAndRestLayout>
}

export type KnnSelectedResultProps = {
    result: KnnResult
    queryVec: number[]
}

export function KnnSelectedResult({result, queryVec}: KnnSelectedResultProps) {
    const [vecResult, setVecResult] = useState<QueryAndSimilarity[]>([]);
    const elasticSearchConfig = useElasticSearchContext()
    useEffect(() => {
        setVecResult([])
        massVectorise(elasticSearchConfig)(result?.keyfields).then(vec => {
            const res: QueryAndSimilarity[] = vec.map(({query, value}, i) => {
                const similarity = cosineSimilarity(queryVec, value);
                return ({query, similarity: similarity});
            });
            setVecResult(res.sort((a, b) => b.similarity - a.similarity));
        })
    }, [result]);
    return <>
        <h2>Questions in the selected centroid</h2>
        <pre>{JSON.stringify(vecResult, null, 2)}</pre>
    </>

}


export function KnnSearch({mainQueryOps, questions}: AppChildProps & HasQuestions) {
    const [res, setRes] = useState<any>(null);
    const [qv, setQv] = useState<number[]>([]);
    const [sims, setSims] = useState<any>([])
    const elasticSearchConfig = useElasticSearchContext()
    const selectedOps = useState(0)
    const onEnter = (query: string) => {
        knnSubmit(elasticSearchConfig, elasticSearchConfig.centroidIndex, query).then(x => setRes(x));
        vectorise(elasticSearchConfig, query).then(x => setQv(x));
    };
    useEffect(() => {
        if (res && qv) {
            const result = res.map((r: any) => {
                return {
                    ...r,
                    similarity: cosineSimilarity(qv, r.full_text_embeddings)
                };
            })
            setSims(result);
        }
    }, [res, qv]);

    return (
        <div style={{padding: '1rem', fontFamily: 'sans-serif', width: 1800, margin: 'auto'}}>
            <h2>Semantic Search</h2>
            <InputBar ops={mainQueryOps} onEnter={onEnter} options={questions}/>

            <KnnResults results={sims} selected={selectedOps} queryVec={qv}/>
            <ShowJson json={sims}/>
            <ShowText text={qv.toString()}/>
            <ShowJson json={res}/>
            {res ? JSON.stringify(res, null, 2) : 'Results will appear here...'}
        </div>
    )
        ;
}