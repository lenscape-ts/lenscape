import {AsyncState} from "@lenscape/async";
import {FC} from "react"

export type LoadingOrErrorProps = {
    state: AsyncState<any>
    whatWeAreLoading,
    rootId,
}

export type LenscapeComponents = {
    LoadingOrError: FC<LoadingOrErrorProps>
}