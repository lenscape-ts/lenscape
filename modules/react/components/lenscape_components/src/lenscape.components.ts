import {AsyncState} from "@lenscape/async";
import {FC} from "react"

export type LoadingOrErrorProps<T> = {
    state: AsyncState<T>
    whatWeAreLoading: string,
    rootId: string,
}

export type LenscapeComponents = {
    LoadingOrError: FC<LoadingOrErrorProps<any>>
}