import React from "react";
import {createRoot} from "react-dom/client";
import {SemanticSearchApp} from "./app";
import {ElasticSearchProvider} from "./elasticSearchConfig";
import {Questions} from "./display/questions";
import {defaultOpenAiConfig, openAiClient} from "@lenscape/openai";
import axios from "axios";
import {AgentCardsProvider, SelectorFnProvider} from "./aiconfig";
import {openAiToken} from "./secrets";
import {llmSelector} from "@lenscape/llmselector";
import {agentCards, Context, Pipelines} from "./agents/cards";
import {defaultLookupMessages} from "@lenscape/agents";

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
        "semantic-apps-prod",
        "questionator-mygenius-prod",
        "questionator-office-buddy-prod"
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
    ],
    '3 day holiday': [
        'I am trying to book a three day holiday',
        'hi I want to apply for 3 days leave from monday to wednesday next week',
        'what app should I use to book a three day holiday',

    ],
    "room booking": [
        "I need to book  a seat in munich arnulstrasse",
        "I need to book  a seat in munich arnulstrasse app",
        "I need to book  a room in munich arnulstrasse",
        "I need to book  an office in munich arnulstrasse"
    ]
}

const aiClients = {
    openai: openAiClient({
        ...defaultOpenAiConfig(axios, {
            OPENAI_TOKEN: openAiToken,
            // model_id:'gpt-3.5-turbo-0125'
            model_id: 'gpt-4o-mini'
        }), tiktokenEncoder: undefined
    })
}
export const llmSel = llmSelector<Context, Pipelines>(aiClients,
    agentCards.cards,
    defaultLookupMessages({}))

root.render(<React.StrictMode>
    <AgentCardsProvider agentCards={agentCards}>
        <SelectorFnProvider selectorFn={llmSel}>
            <ElasticSearchProvider elasticSearchConfig={elasticSearchConfig}>
                <SemanticSearchApp questions={questionList}/>
            </ElasticSearchProvider>
        </SelectorFnProvider>
    </AgentCardsProvider>

</React.StrictMode>)



