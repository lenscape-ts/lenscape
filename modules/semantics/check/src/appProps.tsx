import {GetterSetter} from "@lenscape/context";
import {HasQuestionOps, HasQuestions} from "./display/questions";

export type AppChildProps = HasQuestionOps & HasQuestions & {
    mainQueryOps: GetterSetter<string>;
}

