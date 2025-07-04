import {AgentCard, AgentCards} from "@lenscape/agents";
import {Context, Pipelines, Selector} from "./domain";

export const apps: AgentCard<Context, Pipelines> = {
    purpose: 'This agent answers questions about apps that have been installed on the system. These are general apps general office work and productivity apps.',
    samples: [
        'How can I fill in my timesheet?',
        'How can I book a meeting room?',
        'How do I access the company calendar?'],
    tags: ['apps', 'productivity', 'office'],
    pipeline: {
        rag: {
            type: "rag",
            source: 'es',
            indices: ['semantic-apps-prod'],
            top: 3,
        },
        llm: {
            type: 'llm',
            agent: 'openai',
            prefix: [
                {
                    role: 'system', content: `
You are an expert in answering questions about apps that have been installed on the system. These are general office work and productivity apps.
A RAG search has been performed on the question and the top 3 results are provided below.`
                }
            ]
        }
    }
}

export const generalCompany: AgentCard<Context, Pipelines> = {
    purpose: 'This agent answers general questions about the company, and the tools the company uses. It uses a RAG search to find relevant documents, which are typically in the form of question and answer pairs.',
    samples: [
        'where is the ruhr campus?',
        'what is the canteen menu today at essen?',
        'What is the company policy on remote work?',
        'How can I trouble shoot issues with Microsoft 365 calandar?',
        "What is the process for provisioning the current certificate to mobile devices?",
        "What should I do if I am using a VPN and experiencing call dropping in Microsoft Teams?",
        "How do I clear offline items in the Outlook app?",
    ],
    tags: ['company', 'tools'],
    pipeline: {
        rag: {
            type: "rag",
            source: 'es',
            indices: ['semantic-azureblob-prod'],
            top: 3,
        },
        llm: {
            type: 'llm',
            agent: 'openai',
            prefix: [
                {
                    role: 'system',
                    content: `
You are an expert in answering questions the company and the tools the company uses. It uses a RAG search to find relevant documents, which are typically in the form of question and answer pairs.
A RAG search has been performed on the question and the top 3 results are provided below.`
                }
            ]
        }
    }
}

export const agentCards: AgentCards<Context, Pipelines, Selector> = {
    cards: {apps, generalCompany},
    selector: {
        type: 'llm',
        model: 'openai',
        prefix: [
            {
                role: 'system',
                content: `
You are to decide which agent to use based on the conversation. Your result will be a single word which is the name of the agent to use. If you are not sure, say "generalCompany".
The next message is a list of the agents available to you, and their purpose. You will also be given the conversation so far, which is a list of messages.

Please be careful when giving your answer, as it will be used to select the agent to use. The only legal names are \${agentNames}
`
            },
            {role: 'system', content: '${agentDetails}'}
        ]
    }
}