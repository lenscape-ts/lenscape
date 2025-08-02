import React, {useEffect, useState} from "react";
import {vectorise} from "../helpers/getters";
import {cosineSimilarity} from "../helpers/cosineSimilarity";
import {InputBar} from "./inputBar";
import {AppChildProps} from "../appProps";
import {useElasticSearchContext} from "../elasticSearchConfig";
import {ShowText} from "./show,json";
import {QuestionBar, questionOptions} from "./questions";
import {useAiClient} from "../aiconfig";


export async function translateText(text: string, aiClient: any): Promise<string> {
    try {
        const response = await aiClient([{role: 'user', content: `Translate the following text to English: ${text}. If it is already in English, just return the text. Don't return any text other than the translation`}]);
        return response[0].content;
    } catch (e: any) {
        return `Error: ${e.message}`;
    }

}

export function Compare({mainQueryOps, questions, questionOps}: AppChildProps) {
    const secondOps = useState(Object.values(questions)[0][1] || '')
    const [translated, setTranslated] = useState('')
    const [firstVector, setFirstVector] = useState<number[]>([])
    const [secondVector, setSecondVector] = useState<number[]>([])
    const [translatedVector, setTranslatedVector] = useState<number[]>([])
    const [diff, setDiff] = useState('')
    const [translatedDiff, setTranslatedDiff] = useState<string>('')
    const elasticSearchConfig = useElasticSearchContext()
    const aiClient = useAiClient()

    async function calcVectors() {
        try {
            const [first, second, tx, txVector] = await Promise.all([
                vectorise(elasticSearchConfig, mainQueryOps[0]),
                vectorise(elasticSearchConfig, secondOps[0]),
                ...await translateText(mainQueryOps[0], aiClient).then(async translatedText => [translatedText, await vectorise(elasticSearchConfig, translatedText)])
            ]);
            setFirstVector(first);
            setSecondVector(second);
            setTranslated(tx as string)
            setTranslatedVector(txVector as number[]);

            const diff = cosineSimilarity(first, second);
            setDiff(diff.toString());
            const translatedDiff = cosineSimilarity(second, txVector as number[])
            setTranslatedDiff(translatedDiff.toString())
        } catch (e: any) {
            setDiff(`Error: ${e.message}`);
        }
    }


    useEffect(() => {
        calcVectors()
    }, [mainQueryOps[0], secondOps[0]])

    return <div>
        <h1>First sentence</h1>
        <QuestionBar questions={questions} questionOps={questionOps}/>
        <InputBar ops={mainQueryOps} options={questionOptions(questions, questionOps[0])}/>
        <ShowText text={firstVector.toString()}/>

        <h1>Second sentence</h1>
        <InputBar ops={secondOps} options={questionOptions(questions, questionOps[0])} />
        <ShowText text={secondVector.toString()}/>

        <h1>Similarity</h1>
        <ShowText text={diff}/>

        <h1>Translated</h1>
        <ShowText text={translated}/>
        <ShowText text={translatedVector.toString()}/>
        <ShowText text={translatedDiff}/>


    </div>
}