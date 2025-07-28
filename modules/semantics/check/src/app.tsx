// SemanticSearchApp.tsx

import React, {useState} from 'react';
import {KnnSearch} from './display/knn.search';
import {Compare} from './display/compare';
import {SimpleQuery} from "./display/simple.query";
import {SelectButton} from "./display/selectButton";
import {HasQuestions} from "./display/questions";
import {AppChildProps} from "./appProps";
import {WhichAgent} from "./agents/agents";
import {MassVectorisation} from "./display/mass.vectorisation";


export const SemanticSearchApp: React.FC<HasQuestions> = ({questions}) => {
    const selectedOps = useState('knn');
    const mainQueryOps = useState<string>(Object.values(questions)[0][0])
    const [selected] = selectedOps;
    const questionOps = useState('all')

    const childProps: AppChildProps = {questionOps, questions, mainQueryOps}
    const views: Record<string, React.ReactNode> = {
            knn: <KnnSearch {...childProps} />,
        compare: <Compare {...childProps}/>,
        query: <SimpleQuery {...childProps} />,
        massVectorisation: <MassVectorisation {...childProps} />,
        agents: <WhichAgent {...childProps} />,
    };

    return (
        <div>
            <div style={{marginBottom: '1rem'}}>
                {Object.keys(views).map(option => (
                    <SelectButton key={option} ops={selectedOps} text={option}/>
                ))}
            </div>
            {views[selected]}
        </div>
    );
};
