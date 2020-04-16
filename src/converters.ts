import { ParseData } from "./data";
import { Maybe, error } from "./result";

export function parse (content: string): Maybe<ParseData> {
    return error<ParseData>("stub");
}
