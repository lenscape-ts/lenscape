import {AgentCard, AgentCards} from "@lenscape/agents";
import {Context, Pipelines, Selector} from "./domain";

export const jiraAgentCard: AgentCard<Context, Pipelines> = {
    purpose: 'Answers questions about Jira, sprints, and tickets.',
    samples: {
        sprintQuestions: [
            'What is the current sprint?',
            'What is the status of ticket ABC-123?',
            'what is the goal of the current sprint?',
            'Who is assigned to the current sprint?',
            'How do I create a new ticket in Jira?',
        ],
        ticketQuestions: [
            'How many tickets are in the backlog?',
            'What are the open tickets in project XYZ?',
            'How can I search for tickets by label?',
            'What is the average time to resolve a ticket in our project?',
            'How do I link two tickets together in Jira?',
            'What is the process for closing a ticket?',
        ],
        goalQuestions: [
            'What is the goal of the current sprint?',
            'What was the goal of the last sprint?',
        ]
    },
    pipeline: {
        'findJqlQuery': {
            type: 'llm',
            agent: 'openai',
            prefix: [{
                role: 'system', content: 'you need to turn the question into a jira jql query'//This is a summary of the real prompt
            }]
        },
        'executeJql': {type: 'jira-jql',}
        'giveAnswer': {
            type: "llm",
            agent: 'openai',
            prefix: [
                {role: 'system', content: 'Here is some prompt that says "summarise the results of the JQL query in a human readable format. The results are provided below. If there are no results, say "No results found".'}
            ]

        }
    }
}

export const hrAgentCard: AgentCard<Context, Pipelines> = {
    purpose: 'Answers questions aboutHR policies, benefits, and procedures.',
    samples: {
        policies: [
            'What is the company\'s policy on remote work?',
            'What are the company\'s vacation policies?',
            'What is the company\'s policy on remote work?',
            'What is the dress code for the office?'
        ],
        howTos: [
            'How do I request a day off?',
            'How do I update my personal information in the HR system?',
            'How do I enroll in health insurance?',
            'How do I access my pay stubs online?',
            'How do I apply for a promotion or raise?',
            'What is the process for submitting an expense report?',
            'What is the procedure for reporting workplace harassment?',
        ],
    },
    pipeline: {
        'rag':
            {
                type: 'rag',
                source:
                    'elasticsearch',
                indices:
                    ['hr-policies', 'hr-procedures', 'hr-benefits'],
                top:
                    3 // Number of documents to retrieve
            }
        ,

        'giveAnswer':
            {
                type: "llm",
                agent:
                    'openai',
                prefix:
                    [
                        {role: 'system', content: 'Here is some prompt that says "summarise the results of the HR search in a human readable format. The results are provided below. If there are no results, say "No results found".'}
                    ]
            }
    }
}