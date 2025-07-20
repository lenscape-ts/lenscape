import {AppChildProps} from "../appProps";
import {QuestionBar, questionOptions} from "../display/questions";
import {InputBar} from "../display/inputBar";
import {TwoColumnAndRestLayout} from "../display/two.column.and.rest.layout";
import {ShowJson, ShowText} from "../display/show,json";
import {useEffect, useState} from "react";
import {useAiClient} from "../aiconfig";
import {BaseMessage} from "@lenscape/agents";

export function WhichAgent({questions, questionOps, mainQueryOps}: AppChildProps) {
    const [prompt, setPrompt] = useState('')
    const [resp, setResp] = useState<BaseMessage[]>([])
    const query = mainQueryOps[0]
    const ai = useAiClient()
    useEffect(() => {
        setPrompt(`Please select an agent to answer this question: ${query}`)
    }, [query]);
    useEffect(() => {
        ai([], {}).then((response) => {
            setResp(response)
        })
    }, [prompt]);
    return <div>
        <QuestionBar questions={questions} questionOps={questionOps}/>
        <InputBar ops={mainQueryOps} options={questionOptions(questions, questionOps[0])}/>
        <TwoColumnAndRestLayout>
            <ShowText text={prompt}/>
            <ShowJson json={resp}/>
        </TwoColumnAndRestLayout>
    </div>;
}