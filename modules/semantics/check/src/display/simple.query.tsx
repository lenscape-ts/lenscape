import {InputBar} from "./inputBar";
import React, {useEffect, useMemo, useState} from "react";
import {knnSubmit, KnnSubmitResult, vectorise} from "../helpers/getters";
import {useElasticSearchContext} from "../elasticSearchConfig";
import {ShowJson} from "./show,json";
import {cosineSimilarity} from "../helpers/cosineSimilarity";
import {KnnResult} from "./knn.search";
import {AppChildProps, HasQuestions} from "../appProps";
import {GetterSetter} from "@lenscape/context";
import {TwoColumnAndRestLayout} from "./two.column.and.rest.layout";
import {NameAnd} from "@lenscape/records";
import {Simulate} from "react-dom/test-utils";
import {ellipsesInMiddle} from "@lenscape/string_utils";
import {MultiSelect} from "./multiselect";


export type SimpleQueryResultDisplayProps = {
    results: KnnResult[]
}

export function SimpleQueryResultDisplay({results}: SimpleQueryResultDisplayProps) {
    return <table>
        <thead>
        <tr>
            <td>Id</td>
            <td>Similarity</td>
            <td>Keyfield</td>
        </tr>
        </thead>
        <tbody>
        {results.map((result, index) => (
            <tr key={index}>
                <td>{result.id}</td>
                <td>{result.similarity.toFixed(4)}</td>
                <td>{result.keyfield}</td>
            </tr>
        ))}
        </tbody>
    </table>
}

export type QuestionsDisplayProps = {
    questions: string[]
    questionOps: GetterSetter<string>
    indexOrIndices: string
    queryVector: number[]
}

type QuestionToSimiliarty = NameAnd<number>
type QuestionToKeyfield = NameAnd<string>

export function QuestionsDisplay({questions, questionOps, indexOrIndices, queryVector}: QuestionsDisplayProps) {
    const [selected, setSelected] = questionOps;
    const [nameToNumber, setNameToNumber] = useState<QuestionToSimiliarty>({})
    const [nameToKeyfield, setNameToKeyfield] = useState<QuestionToKeyfield>({});
    const esConfig = useElasticSearchContext()
    useEffect(() => {
        setNameToNumber({})

        async function findQuestionData() {
            for (const question of questions) {
                const queryVector = await vectorise(esConfig, question)
                const res = await knnSubmit(esConfig, indexOrIndices, question)
                setNameToNumber(old => ({
                    ...old,
                    [question]: cosineSimilarity(queryVector, res[0].full_text_embeddings)
                }))
                setNameToKeyfield(old => ({
                    ...old,
                    [question]: res[0].keyfield || ''
                }))
            }


        }

        findQuestionData();
    }, [questions, indexOrIndices]);
    return (
        <table style={{borderCollapse: "collapse", width: "100%", fontFamily: "sans-serif"}}>
            <thead>
            <tr style={{backgroundColor: "#f2f2f2", textAlign: "left"}}>
                <th style={{padding: "8px", borderBottom: "2px solid #ccc"}}>Question</th>
                <th style={{padding: "8px", borderBottom: "2px solid #ccc"}}>Similarity</th>
                <th style={{padding: "8px", borderBottom: "2px solid #ccc"}}>Keyfield</th>
            </tr>
            </thead>
            <tbody>
            {questions.map((question, index) => (
                <tr
                    key={index}
                    onClick={() => setSelected(question)}
                    style={{
                        cursor: "pointer",
                        backgroundColor: question === selected ? "#e6f7ff" : "white",
                        transition: "background-color 0.2s ease",
                    }}
                >
                    <td style={{padding: "8px", borderBottom: "1px solid #eee"}}>{question}</td>
                    <td style={{padding: "8px", borderBottom: "1px solid #eee"}}>
                        {nameToNumber[question]?.toFixed(4)}
                    </td>
                    <td style={{padding: "8px", borderBottom: "1px solid #eee"}}>
                        {ellipsesInMiddle(nameToKeyfield[question] ? nameToKeyfield[question] : "Loading...", 50)}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}


export function SimpleQuery({mainQueryOps, questions}: AppChildProps & HasQuestions) {
    const query = mainQueryOps[0];
    const config = useElasticSearchContext()
    const [raw, setRaw] = useState<KnnSubmitResult[]>([])
    const [vector, setVector] = useState<number[]>([])
    const [knnResult, setKnnResult] = useState<KnnResult[]>([])
    const selectedIndicesOps = useState(config.indices);
    const selectedIndex = selectedIndicesOps[0];
    const indexOrIndices = useMemo(() => selectedIndex.join(','), [config, selectedIndex]);
    useEffect(() => {
        knnSubmit(config, indexOrIndices, query, {size: 20}).then(res => setRaw(res))
        vectorise(config, query).then(v => setVector(v))

    }, [query, selectedIndex]);
    useEffect(() => {
        const knnResult =
            raw.map((res): KnnResult => ({
                ...res,
                similarity: cosineSimilarity(res.full_text_embeddings, vector),
            }));
        console.log('calculating knn result', vector, raw, knnResult);
        setKnnResult(knnResult);

    }, [vector, raw]);

    return <div>

        <MultiSelect selectedState={selectedIndicesOps} options={config.indices}/>
        <InputBar ops={mainQueryOps}/>
        <TwoColumnAndRestLayout>
            <QuestionsDisplay questionOps={mainQueryOps} questions={questions} queryVector={vector} indexOrIndices={indexOrIndices}/>
            <SimpleQueryResultDisplay results={knnResult}/>
        </TwoColumnAndRestLayout>
        <ShowJson json={knnResult}/>
    </div>
}