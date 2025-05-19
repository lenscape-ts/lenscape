import {BaseEvent} from "@lenscape/events"
import {NameAnd} from "@lenscape/records"
import {ErrorsOr} from "@lenscape/errors";

/**
 * Discriminator for plugin kinds.
 * Helps at debug‐time to see what type of plugin you’ve got.
 */
export type PluginKind = "interpreter"
export const InterpreterPluginKind: PluginKind = "interpreter"

/** Interpreters allow you to process events.
 * The 'classic' interpreter turns a list of events into a single blob of json representing the state of the system.
 * Other examples include 'make me an html page' or 'count the number of events'
 */
export type InterpreterPlugIn<Result> = {
    /** Must be `"interpreter"`—used for runtime introspection. */
    plugin: PluginKind

    /** Unique name for this plugin (should match its key in the registry). */
    name: string

    /** Short human‐readable description of what this plugin does. */
    description: string

    /**
     * Monoid‐identity (sometimes called “zero”).
     * The starting value when you begin folding over events.
     */
    initial: Result

    /**
     * Process a batch of events, starting from `initial`, and
     * return the new accumulated value.
     * @param events  The list of events to interpret.
     * @param initial The monoid “zero” (identity) value.
     * @returns A promise that resolves to the new value.
     */
    execute: InterpreterFn<Result>
}

/**
 * Registry type: map plugin‐name → plugin definition.
 */
export type InterpreterPlugins = NameAnd<InterpreterPlugIn<any>>

/**How we turn the events into a value*/
export type InterpreterFn<Result> = (events: BaseEvent[], initial: Result) => Promise<ErrorsOr<Result>>

