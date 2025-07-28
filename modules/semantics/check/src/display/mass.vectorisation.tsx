import {AppChildProps} from "../appProps";
import {QuestionBar, questionOptions} from "./questions";
import React, {useEffect, useState} from "react";
import {massVectorise, VectoriseResult} from "../helpers/getters";
import {useElasticSearchContext} from "../elasticSearchConfig";

export function DisplayCurrentQuestions({questions}: { questions: string[] }) {
    const [vectors, setVectors] = useState<VectoriseResult[]>([])
    const esConfig = useElasticSearchContext()
    useEffect(() => {
        setVectors([])
        massVectorise(esConfig)(questions).then(vectors => {
            setVectors(vectors)
        })
    }, [questions]);

    return <table>
        <thead>
        <tr>
            <td>Question</td>
            <td>Vectorisation</td>
        </tr>
        </thead>
        <tbody>
        {vectors.map(q => <tr>
            <td>{q.query}</td>
            <td>{JSON.stringify(q.value)}</td>
        </tr>)}

        </tbody>
    </table>
}

export function MassVectorisation({questions, questionOps}: AppChildProps) {
    const currentQuestions = questionOptions(questions, questionOps[0])

    return <>
        <QuestionBar questions={questions} questionOps={questionOps}/>
        <DisplayCurrentQuestions questions={currentQuestions}/>

    </>

}
