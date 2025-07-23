import {AppChildProps} from "../appProps";
import {QuestionBar, questionOptions} from "../display/questions";
import {InputBar} from "../display/inputBar";
import {TwoColumnAndRestLayout} from "../display/two.column.and.rest.layout";
import {ShowJson, ShowText} from "../display/show,json";
import {useEffect, useState} from "react";
import {useAgentCards, useSelectorFn} from "../aiconfig";
import {ErrorsOr} from "@lenscape/errors";
import {LlmSelector} from "@lenscape/llmselector";

export function WhichAgent({questions, questionOps, mainQueryOps}: AppChildProps) {
    const [resp, setResp] = useState<ErrorsOr<string>>({value: 'loading...'})
    const query = mainQueryOps[0]
    const selector = useSelectorFn()
    const agents = useAgentCards()
    const [latency, setLatency] = useState(0)
    useEffect(() => {
        setResp({value: 'loading...'})
        const start = new Date().getTime()
        selector.execute(agents.selector as LlmSelector, {query, 'lastSelected': 'unknown'}, [{role: 'user', content: query}]).then(
            res => {
                setResp(res);
                setLatency((new Date().getTime() - start))
            })
    }, [query, agents]);
    return <div>
        <QuestionBar questions={questions} questionOps={questionOps}/>
        <InputBar ops={mainQueryOps} options={questionOptions(questions, questionOps[0])}/>
        <TwoColumnAndRestLayout>
            <ShowJson json={agents}/>
            <div>
                <ShowText text={`Latency: ${latency}`}/>
                <ShowJson json={resp}/>
            </div>
        </TwoColumnAndRestLayout>
    </div>;
}