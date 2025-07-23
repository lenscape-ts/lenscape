import {InputBar} from "./inputBar";
import React, {useEffect, useMemo, useState} from "react";
import {knnSubmit, KnnSubmitResult, vectorise} from "../helpers/getters";
import {useElasticSearchContext} from "../elasticSearchConfig";
import {ShowJson} from "./show,json";
import {cosineSimilarity} from "../helpers/cosineSimilarity";
import {KnnResult} from "./knn.search";
import {AppChildProps} from "../appProps";
import {TwoColumnAndRestLayout} from "./two.column.and.rest.layout";
import {NameAnd} from "@lenscape/records";
import {ellipsesInMiddle} from "@lenscape/string_utils";
import {MultiSelect} from "./multiselect";
import {HasQuestionOps, HasQuestions, QuestionBar, questionOptions} from "./questions";


export type SimpleQueryResultDisplayProps = {
    results: KnnResult[]
}

export function SimpleQueryResultDisplay({results}: SimpleQueryResultDisplayProps) {
    return <table>
        <thead>
        <tr>
            <td>Similarity</td>
            <td>Index</td>
            {/*<td>Id</td>*/}
            <td>Keyfield</td>
        </tr>
        </thead>
        <tbody>
        {results.map((result, index) => (
            <tr key={index}>
                <td>{result.similarity.toFixed(4)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{result.index}</td>
                {/*<td>{result.id}</td>*/}
                <td>{result.keyfield}</td>
            </tr>
        ))}
        </tbody>
    </table>
}

export type QuestionsDisplayProps = AppChildProps & {
    indexOrIndices: string
}

type QuestionToSimiliarty = NameAnd<number>
type QuestionToKeyfield = NameAnd<string>

export function QuestionsDisplay({questions, mainQueryOps, questionOps, indexOrIndices}: QuestionsDisplayProps) {
    const [selected, setSelected] = questionOps;
    const [nameToNumber, setNameToNumber] = useState<QuestionToSimiliarty>({})
    const [nameToKeyfield, setNameToKeyfield] = useState<QuestionToKeyfield>({});
    const esConfig = useElasticSearchContext()
    const activeQuestions = useMemo(() => questionOptions(questions, questionOps[0]), [questions, questionOps[0]])

    useEffect(() => {
        setNameToNumber({})

        async function findQuestionData() {
            for (const question of activeQuestions) {
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
    }, [activeQuestions, indexOrIndices, questionOps[0]]);
    return (
        <table style={{borderCollapse: "collapse", width: "100%", fontFamily: "sans-serif"}}>
            <thead>
            <tr style={{backgroundColor: "#f2f2f2", textAlign: "left"}}>
                <th style={{padding: "8px", borderBottom: "2px solid #ccc"}}>Question</th>
                <th style={{padding: "8px", borderBottom: "2px solid #ccc"}}>Similarity</th>
                <th style={{padding: "8px", borderBottom: "2px solid #ccc"}}>Close question</th>
            </tr>
            </thead>
            <tbody>
            {activeQuestions.map((question, index) => (
                <tr
                    key={index}
                    onClick={() => {
                        // setSelected(question);
                        mainQueryOps[1](question);
                    }}
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


export function SimpleQuery({mainQueryOps, questions, questionOps}: AppChildProps & HasQuestions) {
    const query = mainQueryOps[0];
    const config = useElasticSearchContext()
    const [raw, setRaw] = useState<KnnSubmitResult[]>([])
    const [vector, setVector] = useState<number[]>([])
    const [knnResult, setKnnResult] = useState<KnnResult[]>([])
    const selectedIndicesOps = useState(config.indices);
    const selectedIndex = selectedIndicesOps[0];
    const indexOrIndices = useMemo(() => selectedIndex.join(','), [config, selectedIndex]);
    const [latency, setLatency] = useState(0)
    useEffect(() => {
        const start = new Date().getTime()
        setKnnResult( [])
        knnSubmit(config, indexOrIndices, query, {size: 30}).then(res => {
            setRaw(res);
            setLatency(new Date().getTime()-start)
        })
        vectorise(config, query).then(v => setVector(v))

    }, [query, selectedIndex, questionOps[0]]);
    useEffect(() => {
        const knnResult =
            raw.map((res): KnnResult => ({
                ...res,
                similarity: cosineSimilarity(res.full_text_embeddings, vector),
            })).sort((a, b) => b.similarity - a.similarity);
        console.log('calculating knn result', vector, raw, knnResult);
        setKnnResult(knnResult);

    }, [vector, raw]);

    return <div>
        <TwoColumnAndRestLayout>
            <MultiSelect selectedState={selectedIndicesOps} options={config.indices}/>
            <QuestionBar questions={questions} questionOps={questionOps}/>
        </TwoColumnAndRestLayout>
        <InputBar ops={mainQueryOps} options={questionOptions(questions, questionOps[0])}/>
        <TwoColumnAndRestLayout>
            <QuestionsDisplay mainQueryOps={mainQueryOps} questionOps={questionOps} questions={questions} indexOrIndices={indexOrIndices}/>
            <div>
                <div>Latency: {latency}</div>
                <SimpleQueryResultDisplay results={knnResult}/>
            </div>
        </TwoColumnAndRestLayout>
        <ShowJson json={knnResult}/>
    </div>
}