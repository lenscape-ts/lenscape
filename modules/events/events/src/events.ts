/**
 * The set of all possible event kinds.
 */
export type EventType =
    | 'zero'
    | 'setId'
    | 'setValue'
    | 'appendId'
    | 'appendValue'
    | 'info'
    | 'error'

/**
 * Arbitrary key/value pairs for debugging and auditing.
 */
export type Metadata = {
    [key: string]: string | number | boolean | Metadata
}

/**
 * The minimal core all events share.
 */
export type BaseEvent = {
    /** Non-functional info (timestamps, actor IDs, notes, etc.). */
    metadata?: Metadata

    /** Drives your dispatch/handler logic. */
    event: EventType
}

/**
 * Events that target a path in your JSON blob.
 */
export type LensPathEvent = BaseEvent & {
    /** This is a path for a lensandpath. For example a.b[1].d!.e The only difference to OGN is the ! which is used if we have varient types */
    path: string
}

export type LensIdEvent = BaseEvent & {
    /** Reference string into the content-addressable store. */
    id: string
}
/**
 * “Zero” or reset marker.
 */
export type ZeroEvent = BaseEvent & {
    event: 'zero'
}

/**
 * Informational/debug message.
 */
export type InfoEvent = BaseEvent & {
    event: 'info'
    /** Additional info for debugging. Semantics TBD. */
    info: any
}

/**
 * Error marker.
 */
export type ErrorEvent = BaseEvent & {
    event: 'error'
    /** Error message or payload. */
    error: any
    /** Original error object, if any. Semantics TBD. */
    from?: any
}

/**
 * Set a blob-pointer by ID (with parser).
 */
export type SetIdEvent = LensPathEvent & LensIdEvent & {
    event: 'setId'

    /** Which parser to use when resolving the ID. */
    parser: string
}

/**
 * Append a blob-pointer by ID to the array at `path`.
 */
export type AppendIdEvent = LensPathEvent & LensIdEvent & {
    event: 'appendId'
    /** Which parser to use when resolving the ID. */
    parser: string
}

/**
 * Replace the value at `path`.
 */
export type SetValueEvent = LensPathEvent & {
    event: 'setValue'
    /** Any JSON-serializable value. */
    value: any
}

/**
 * Append a raw value to the array at `path`.
 */
export type AppendValueEvent = LensPathEvent & {
    event: 'appendValue'
    /** Any JSON-serializable value. */
    value: any
}

/**
 * Union of all events.
 */
export type Event =
    | ZeroEvent
    | InfoEvent
    | ErrorEvent
    | SetIdEvent
    | AppendIdEvent
    | SetValueEvent
    | AppendValueEvent

// —————————————————————————————————————————————
// Type-guards for each event kind:

export function isIdEvent(e: BaseEvent): e is LensIdEvent {
    return e.event === 'setId' || e.event === 'appendId'
}
export function isZeroEvent(e: BaseEvent): e is ZeroEvent {
    return e.event === 'zero'
}

export function isInfoEvent(e: BaseEvent): e is InfoEvent {
    return e.event === 'info'
}

export function isErrorEvent(e: BaseEvent): e is ErrorEvent {
    return e.event === 'error'
}

export function isSetIdEvent(e: BaseEvent): e is SetIdEvent {
    return e.event === 'setId'
}

export function isAppendIdEvent(e: BaseEvent): e is AppendIdEvent {
    return e.event === 'appendId'
}

export function isSetValueEvent(e: BaseEvent): e is SetValueEvent {
    return e.event === 'setValue'
}

export function isAppendValueEvent(e: BaseEvent): e is AppendValueEvent {
    return e.event === 'appendValue'
}
