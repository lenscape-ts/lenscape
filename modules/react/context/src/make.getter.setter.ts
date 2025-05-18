import { GetterSetter, Setter } from "./context.utils";
import { LensAndPath } from "@lenscape/lens";

export function makeGetterSetter<Main, T>(t: Main, setter: Setter<Main>, lens: LensAndPath<Main, T>): GetterSetter<T> {
    return [lens.get(t) as T, (v) => {
        if (typeof v === "function") {
            setter(main => {
                const currentValue = lens.get(main) as T;
                const result = lens.set(main, (v as (t: T) => T)(currentValue));
                return result;
            });
        } else {
            setter(lens.set(t, v));
        }
    }];


}
