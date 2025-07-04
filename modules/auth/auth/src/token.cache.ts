import {Axios} from "axios";
import {Env, NameAnd} from "@lenscape/records";
import {TimeService} from "@lenscape/time";

export type TokenAndExpires = {
    token: string
    expires: number
}
export type TokenAndTime = TokenAndExpires & {
    refreshToken?: string;
}
export type TokenCache = NameAnd<Promise<TokenAndTime>>
export const globalTokenCache: TokenCache = {}
export type TokenCacheLoadFn<Auth> = (env: NameAnd<string>, axios: Axios, oauth: Auth) => Promise<TokenAndTime>

export type TokenCacheConfig<Auth> = {
    env: Env,
    axios: Axios,
    timeService: TimeService,
    tokenCacheLoadFn: TokenCacheLoadFn<Auth>,
    keyFn: (oauth: Auth) => string,
    tokenCache: TokenCache,
}

export async function getTokenUsingCache<Auth>(
    config: TokenCacheConfig<Auth>,
    oauth: Auth,
): Promise<string> {
    const tokenAndTime = await getTokenAndTimeUsingCache(config, oauth)
    return tokenAndTime.token
}

export async function getTokenAndTimeUsingCache<Auth>(
    config: TokenCacheConfig<Auth>,
    oauth: Auth,
): Promise<TokenAndTime> {
    const {axios, timeService, tokenCacheLoadFn, keyFn, env, tokenCache} = config;
    const key = keyFn(oauth);
    const tokenDataPromise = tokenCache[key];
    if (tokenDataPromise) {
        const tokenData = await tokenDataPromise;
        if (tokenData && tokenData.expires > timeService()) return tokenData;
    }

    //double sync check. the await in the above check can cause multiple fetches. Only causes wasted calls..but still...
    const doubleCheck = tokenCache[key];
    if (doubleCheck && (await doubleCheck).expires > timeService()) return (await doubleCheck);

    const newToken = tokenCacheLoadFn(env, axios, oauth).then(rawToken => {
        const expires = timeService() + rawToken.expires * 900; //We are using this instead of 1000ms to ensure we don't hit the expiry time
        const tokenAndTime: TokenAndTime = {...rawToken, expires}
        return tokenAndTime
    }).catch(e => {
        console.error(e);
        tokenCache[key] = undefined;
        throw e
    })
    tokenCache[key] = newToken
    return (await newToken);
}