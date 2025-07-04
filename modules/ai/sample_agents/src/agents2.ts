import {AgentCard, AgentCards} from "@lenscape/agents";
import {Context, Pipelines, Selector} from "./domain";

export const ragDrivenAgentCard: AgentCard<Context, Pipelines> = {
    purpose: `This agent uses a RAG search to find relevant documents. 
Then based on the index of the most relevant document, it uses a specific LLM to answer the question.`,
    samples: [
        'How can I fill in my timesheet?',
        'How can I book a meeting room?',
        'How do I access the company calendar?',
        'where is the ruhr campus?',
        'what is the canteen menu today at essen?',
        'What is the company policy on remote work?',
        'How can I trouble shoot issues with Microsoft 365 calandar?',
        "What is the process for provisioning the current certificate to mobile devices?",
        "What should I do if I am using a VPN and experiencing call dropping in Microsoft Teams?",
        "How do I clear offline items in the Outlook app?",
    ],
    tags: ['company', 'apps', 'general'],
    pipeline: {
        rag: {
            type: 'rag',
            source: 'es',
            indices: ['apps-dev', 'semantic-azureblob-prod'],
            top: 3,
        },
        llm: {
            type: 'rag.index.llm',
            pipelines: {
                'apps-dev': {
                    type: 'llm',
                    agent: 'openai',
                    prefix: [
                        {
                            role: 'system',
                            content: 'You are an expert in answering questions about the company and the apps that have been installed on the system. These are general office work and productivity apps. A RAG search has been performed on the question and the top 3 results are provided below.'
                        }],
                },
                'semantic-azureblob-prod': {
                    type: 'llm',
                    agent: 'openai',
                    prefix: [{
                        role: 'system',
                        content: 'You are an expert in answering questions about the company, and the tools the company uses. It uses a RAG search to find relevant documents, which are typically in the form of question and answer pairs. A RAG search has been performed on the question and the top 3 results are provided below.'
                    }],
                }
            },
            defaultPipeline: {
                type: "llm",
                agent: 'openai',
                prefix: 'You are an expert in answering questions about the company and the apps that have been installed on the system. These are general office work and productivity apps. A RAG search has been performed on the question and the top 3 results are provided below.',
            }

        }

    }
}

export const agentCards2: AgentCards<Context, Pipelines, Selector> = {
    cards: {rag: ragDrivenAgentCard},
    selector: {
        type: 'chain',
        chain: [
            {
                type: 'keywords',
                description: 'Looking for jira keywords',
                keywords: ['jira', 'sprint', 'ticket'],
                select: 'jira'
            },
            {
                type: 'fixed',
                description: `default is 'use rag and then the index of the most relevant document to select the llm pipeline'`,
                select: 'rag'
            }
        ]
    }
}