import {GetterSetter} from "@lenscape/context";

export type AppChildProps = {
    mainQueryOps: GetterSetter<string>;
}

export type HasQuestions = {
    questions: string[],
}