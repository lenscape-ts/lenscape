// SemanticSearchApp.tsx

import React, {useState} from 'react';
import {KnnSearch} from './display/knn.search';
import {Compare} from './display/compare';
import {SimpleQuery} from "./display/simple.query";
import {SelectButton} from "./display/selectButton";
import {HasQuestions} from "./appProps";


export const SemanticSearchApp: React.FC<HasQuestions> = ({questions}) => {
    const selectedOps = useState('knn');
    const mainQueryOps = useState(questions[0])
    const [selected] = selectedOps;


    const views: Record<string, React.ReactNode> = {
        knn: <KnnSearch mainQueryOps={mainQueryOps} questions={questions}/>,
        compare: <Compare mainQueryOps={mainQueryOps} questions={questions}/>,
        query: <SimpleQuery mainQueryOps={mainQueryOps} questions={questions}/>,
    };

    return (
        <div>
            <div style={{marginBottom: '1rem'}}>
                {['knn', 'compare', 'query'].map(option => (
                    <SelectButton key={option} ops={selectedOps} text={option}/>
                ))}
            </div>
            {views[selected]}
        </div>
    );
};
