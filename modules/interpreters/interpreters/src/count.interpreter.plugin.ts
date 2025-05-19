import {InterpreterPlugIn, InterpreterPluginKind} from "./interpreters";

export const CountInterpreterPlugin: InterpreterPlugIn<number> = {
    plugin: InterpreterPluginKind,
    name: 'count',
    description: 'Counts the number of events',
    initial: 0,
    execute: async (params) => params.length
}

