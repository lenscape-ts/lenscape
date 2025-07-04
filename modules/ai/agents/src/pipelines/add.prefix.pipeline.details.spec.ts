import {defaultDereferenceMessages} from "../dereference.messages";
import {defaultLookupMessages} from "../lookup.messages";
import {BaseMessage} from "../messages";
import {AddPrefixPipelineDetails, executeAddPrefixPipelineDetails} from "./add.prefix.pipeline.details";


describe('executeAddPrefixPipelineDetails', () => {
    type Context = { name: string };

    const lookup = defaultLookupMessages({
        greeting: [{role: 'system', content: 'Hello ${context.name}'}]
    });

    const deref = defaultDereferenceMessages;
    const failingDeref: typeof defaultDereferenceMessages = () => ({errors: ['Dereference failed']});

    const context: Context = {name: 'Alice'};

    const messages: BaseMessage[] = [
        {role: 'user', content: 'Can you help me?'}
    ];

    const executor = executeAddPrefixPipelineDetails(lookup, deref);

    it('successfully adds prefix messages with dereferenced context', async () => {
        const pipelineDetails: AddPrefixPipelineDetails = {type: 'add-prefix', prefix: 'greeting'};

        const result = await executor(pipelineDetails, {context, messages});

        expect(result).toEqual({
            "log": {
                "params": "{\"value\":[{\"role\":\"system\",\"content\":\"Hello Alice\"}]}",
                "whatHappened": "Added prefix messages"
            },
            "value": {
                "context": {
                    "name": "Alice"
                },
                "messages": [
                    {
                        "content": "Hello Alice",
                        "role": "system"
                    },
                    {
                        "content": "Can you help me?",
                        "role": "user"
                    }
                ]
            }
        });
    });

    it('successfully handles direct message input without lookup', async () => {
        const directMessages: BaseMessage[] = [{role: 'system', content: 'Direct message'}];

        const pipelineDetails: AddPrefixPipelineDetails = {type: 'add-prefix', prefix: directMessages};

        const result = await executor(pipelineDetails, {context, messages});

        expect(result).toEqual({
            "log": {
                "params": "{\"value\":[{\"role\":\"system\",\"content\":\"Direct message\"}]}",
                "whatHappened": "Added prefix messages"
            },
            "value": {
                "context": {"name": "Alice"},
                "messages": [
                    {"content": "Direct message", "role": "system"},
                    {"content": "Can you help me?", "role": "user"}
                ]
            }
        });
    });
    it('returns errors if dereference fails', async () => {
        const executor = executeAddPrefixPipelineDetails(lookup, failingDeref);
        const pipelineDetails: AddPrefixPipelineDetails = {type: 'add-prefix', prefix: 'greeting'};

        const result = await executor(pipelineDetails, {context, messages});

        expect(result).toEqual({
            "errors": [
                "Dereference failed"
            ],
            "log": {
                "params": "\"greeting\"",
                "whatHappened": "Error dereferencing prefix messages"
            }
        });
    });

    it('throws an error if lookup fails', async () => {
        const pipelineDetails: AddPrefixPipelineDetails = {type: 'add-prefix', prefix: 'unknown'};

        await expect(async () => {
            await executor(pipelineDetails, {context, messages});
        }).rejects.toThrow('No messages found for name: unknown.');
    });
});
