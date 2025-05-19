import {LenscapeComponents} from "./lenscape.components";
import {SimpleLoadingOrError} from "./simple.loading.or.error";
import {makeContextFor} from "@lenscape/context";

export const defaultLenscapeComponents: LenscapeComponents = {
    LoadingOrError: SimpleLoadingOrError
}


export const {use: useLenscapeComponents, Provider: LenscapeComponentsProvider} = makeContextFor('lenscapeComponents', defaultLenscapeComponents)