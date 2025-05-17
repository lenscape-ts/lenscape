export type ErrorType = 's/w' | 'validation' | 'network' | 'ui'
export type ThrowError = (type: ErrorType, msg: string, e?: any) => never ;
