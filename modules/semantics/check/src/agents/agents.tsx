import {AppChildProps} from "../appProps";
import {HasQuestionOps, HasQuestions, QuestionBar, questionOptions} from "../display/questions";
import {InputBar} from "../display/inputBar";
import {TwoColumnAndRestLayout} from "../display/two.column.and.rest.layout";
import {ShowJson, ShowText} from "../display/show,json";
import {useEffect, useMemo, useState} from "react";
import {useAgentCards, useSelectorFn} from "../aiconfig";
import {ErrorsOr, isValue} from "@lenscape/errors";
import {LlmSelector} from "@lenscape/llmselector";
import {BaseMessage, paramsFrom} from "@lenscape/agents";

const lhsOptions = ['agents', 'prompt', 'multiple']

export type ShowPromptProps = {
    prompt?: string
}

import React from 'react';
import {delay} from "@lenscape/time";

export function ShowPrompt({prompt}: ShowPromptProps) {
    if (!prompt) return <span>No prompt</span>;
    try {
        const parsed: ErrorsOr<BaseMessage[]> = JSON.parse(prompt);

        if (isValue<BaseMessage[]>(parsed)) {
            return (
                <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                    <thead>
                    <tr>
                        <th style={{borderBottom: '1px solid #ccc', padding: '8px'}}>Role</th>
                        <th style={{borderBottom: '1px solid #ccc', padding: '8px'}}>Content</th>
                    </tr>
                    </thead>
                    <tbody>
                    {parsed.value.map((msg, i) => (
                        <tr key={i}>
                            <td style={{borderBottom: '1px solid #eee', verticalAlign: 'top', padding: '8px'}}>
                                {msg.role}
                            </td>
                            <td style={{borderBottom: '1px solid #eee', padding: '8px'}}>
                                <div style={{whiteSpace: 'pre-wrap'}}>
                                    {msg.content.trim().split('\n\n').map((para, idx) => (
                                        <p key={idx} style={{margin: '0 0 1em 0'}}>{para}</p>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            );
        } else {
            return <span>{parsed.errors}</span>;
        }
    } catch (e: any) {
        return <span>{`Error: ${e.message}`}</span>;
    }
}

export type MultipleAgentQuestionsProps = HasQuestionOps & HasQuestions


export function MultipleAgentQuestions({questions, questionOps}: MultipleAgentQuestionsProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const selector = useSelectorFn()
    const agents = useAgentCards()
    const activeQuestions = useMemo(() => questionOptions(questions, questionOps[0]), [questions, questionOps[0]]);


    useEffect(() => {
        async function getAnswers() {
            for (const question of activeQuestions) {
                await selector.execute(agents.selector as LlmSelector, {query: question, 'lastSelected': 'unknown'}, [{role: 'user', content: question}]).then(
                    res => {
                        setAnswers(old => ({
                            ...old,
                            [question]: isValue<string>(res) ? res.value : 'Error: ' + res.errors
                        }))
                    })
                await delay(500)
            }
        }

        getAnswers()
    }, [questions, questionOps]);
    return <div>
        <QuestionBar questions={questions} questionOps={questionOps}/>
        <table>
            <thead>
            <tr>
                <th>Question</th>
                <th>Answer</th>
            </tr>
            </thead>
            <tbody>
            {activeQuestions.map((question, index) => (
                <tr key={index}>
                    <td>{question}</td>
                    <td>{answers[question] || 'Loading...'}</td>
                </tr>
            ))}
            </tbody>
        </table>
    </div>
}

export function WhichAgent({questions, questionOps, mainQueryOps}: AppChildProps) {
    const [resp, setResp] = useState<ErrorsOr<string>>({value: 'loading...'})
    const query = mainQueryOps[0]
    const selector = useSelectorFn()
    const agents = useAgentCards()
    const [latency, setLatency] = useState(0)
    const [lhs, setLhs] = useState(lhsOptions[0]);
    const [prompt, setPrompt] = useState<string>('')
    useEffect(() => {
        setResp({value: 'loading...'})
        const start = new Date().getTime()
        selector.execute(agents.selector as LlmSelector, {query, 'lastSelected': 'unknown'}, [{role: 'user', content: query}]).then(
            res => {
                setResp(res);
                setPrompt(paramsFrom(res))
                setLatency((new Date().getTime() - start))
            })
    }, [query, agents]);
    return <div>
        <QuestionBar questions={questions} questionOps={questionOps}/>
        <InputBar ops={mainQueryOps} options={questionOptions(questions, questionOps[0])}/>
        <TwoColumnAndRestLayout>
            <div>
                {lhsOptions.map(o => <button key={o} onClick={() => setLhs(o)}>{o}</button>)}
                {lhs === 'agents' && <ShowJson json={agents}/>}
                {lhs === 'prompt' && <ShowPrompt prompt={prompt}/>}
                {lhs === 'multiple' && <MultipleAgentQuestions questions={questions} questionOps={questionOps}/>}
            </div>
            <div>
                <ShowText text={`Latency: ${latency}`}/>
                <ShowJson json={resp}/>
            </div>
        </TwoColumnAndRestLayout>
    </div>;
}