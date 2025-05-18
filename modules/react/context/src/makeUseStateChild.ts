import { GetterSetter } from "./context.utils";
import { makeGetterSetter } from "./make.getter.setter";
import { useMemo } from "react";
import { LensAndPath, lensBuilder, LensBuilder } from "@lenscape/lens";

export function makeUseStateChild<Data, Child>(
    parent: () => GetterSetter<Data>,
    lens: (id: LensBuilder<Data, Data>) => LensAndPath<Data, Child>
): () => GetterSetter<Child> {

    return () => {
        const [value, setValue] = parent(); // This is `useField()` behind the scenes
        return useMemo(() => {
            return makeGetterSetter(value, setValue, lens(lensBuilder()));
        }, [value, setValue, lens]); // lens might be stable or not, depends on usage
    };
}