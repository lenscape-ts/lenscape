import React, {useEffect, useState} from "react";
import {vectorise} from "../helpers/getters";
import {cosineSimilarity} from "../helpers/cosineSimilarity";
import {InputBar} from "./inputBar";
import {AppChildProps} from "../appProps";
import {useElasticSearchContext} from "../elasticSearchConfig";
import {ShowText} from "./show,json";
import {QuestionBar, questionOptions} from "./questions";


export function Compare({mainQueryOps, questions, questionOps}: AppChildProps) {
    const secondOps = useState(Object.values(questions)[0][1] || '')
    const [firstVector, setFirstVector] = useState<number[]>([])
    const [secondVector, setSecondVector] = useState<number[]>([])
    const [diff, setDiff] = useState('')
    const elasticSearchConfig = useElasticSearchContext()

    function calcVectors() {
        vectorise(elasticSearchConfig, mainQueryOps[0]).then(v => setFirstVector(v))
        vectorise(elasticSearchConfig, secondOps[0]).then(v => setSecondVector(v))
    }

    useEffect(() => {
        try {
            const result = cosineSimilarity(firstVector, secondVector);
            setDiff(result.toString())
        } catch (e: any) {
            setDiff(`Error: ${e.message}`);
        }
    }, [firstVector, secondVector])

    return <div>
        <h1>First sentence</h1>
        <QuestionBar questions={questions} questionOps={questionOps}/>
        <InputBar ops={mainQueryOps} onEnter={calcVectors} options={questionOptions(questions, questionOps[0])}/>
        <ShowText text={firstVector.toString()}/>
        <h1>Second sentence</h1>
        <InputBar ops={secondOps} onEnter={calcVectors}/>
        <ShowText text={secondVector.toString()}/>
        <h1>Similarity</h1>
        <ShowText text={diff}/>

    </div>
}