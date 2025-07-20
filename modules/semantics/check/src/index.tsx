import React from "react";
import {createRoot} from "react-dom/client";
import {SemanticSearchApp} from "./app";
import {ElasticSearchProvider} from "./elasticSearchConfig";
import {Env, NameAnd} from "@lenscape/records";
import {Questions} from "./display/questions";
import {defaultOpenAiConfig, openAiClient} from "@lenscape/openai";
import axios from "axios";
import {AiClientProvider} from "./aiconfig";
import {openAiToken} from "./secrets";

const root = createRoot(document.getElementById('root') as HTMLElement);
// const model_id = 'intfloat__multilingual-e5-large'
const model_id = '.multilingual-e5-small_linux-x86_64'

// const elasticSearchUrl = 'https://c3224bc073f74e73b4d7cec2bb0d5b5e.westeurope.azure.elastic-cloud.com:9243';
const elasticSearchUrl = 'https://f0571c62200b4d249a4c6750ab7f4716.westeurope.azure.elastic-cloud.com:9243';

const elasticSearchConfig = {
    elasticSearchUrl, model_id,
    centroidIndex: 'semantic-index',
    indices: [
        "semantic-meeondata-azureblob-prod",
        "semantic-kb-servicenow-prod",
        "semantic-order-it-api-prod",
        "semantic-apps-prod"
    ]
}

const questionList: Questions = {
    'pc freezes': [
        'Sometimes my PC freezes',
        'Sometimes my PC freezes, what should I do?',

    ],
    'reset password': [
        'I have forgotten my password',
        'I have forgotten my password, how can I reset it?',
        'how do I reset my password',
        'how to reset my password',
        'reset my password',
    ],
    'timesheets': [
        'timesheets',
        'time-tracking',
        'how do I fill in my timesheets',
        'how to fill in my timesheets',
        'fill in my timesheets',
    ],
    'jira': [
        'sprint 13',
        'what are my jira tickets',
    ],
    'mygenius': [
        'devops training',
        'how do I enroll for scrum master training',
        'how do I get better at project management',
        'Are there any courses on project management?',
        'Are there any courses on public speaking?',
    ]
}
export type Question = NameAnd<string[]>;
const aiClient = openAiClient(defaultOpenAiConfig(axios, {OPENAI_TOKEN: openAiToken}))

root.render(<React.StrictMode><AiClientProvider aiClient={aiClient}>
    <ElasticSearchProvider elasticSearchConfig={elasticSearchConfig}>
        <SemanticSearchApp questions={questionList}/>
    </ElasticSearchProvider>
</AiClientProvider>

</React.StrictMode>)



