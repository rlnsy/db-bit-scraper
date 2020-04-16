/**
 * Define Error handling structs
 */

export interface Result<T>  {
    success: T,
    error: null
};

export interface Error<T>  {
    success: null,
    error: any
};

export type Maybe<T> = Result<T> | Error<T>;

export function result<T>(r: T): Result<T> {
    return {
        success: r,
        error: null
    }
}

export function error<T>(e: any): Error<T> {
    return {
        success: null,
        error: e
    }
}
