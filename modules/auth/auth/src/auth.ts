import {Axios} from "axios";
import {Env, NameAnd} from "@lenscape/records";
import {ApiKeyAuthentication, Authentication, BasicAuthentication, BearerAuthentication, EntraIdAuthentication, HeaderAuthentication, isApiKeyAuthentication, isBasicAuthentication, isBearerAuthentication, isEntraIdAuthentication, isHeaderAuthentication, isNoAuthentication, isOauth2, isOAuthForBasicAuthentication, isPrivateTokenAuthentication, isSASAuthentication, Oauth2Authentication, OAuthForBasicAuthentication, PrivateTokenAuthentication} from "./authentication.domain";
import {authForEntraId, oauth2AuthenticationToken} from "./oauth.fetcher";
import {toArray} from "@lenscape/arrays";
import {getTokenAndTimeUsingCache, getTokenUsingCache, globalTokenCache, TokenCache, TokenCacheConfig} from "./token.cache";
import {TimeService} from "@lenscape/time";

export type AuthFn = (auth: Authentication) => Promise<NameAnd<string>>;

function authForApiToken(env: NameAnd<string>, auth: ApiKeyAuthentication) {
    const apiKey = auth.credentials?.apiKey;
    if (!apiKey) throw Error('No apiKey in ' + JSON.stringify(auth))
    const token = env[apiKey]
    if (!token) throw Error('No token for apiKey ' + apiKey)
    return {Authorization: `ApiKey ${token}`}
}

function authForBearerToken(env: NameAnd<string>, auth: BearerAuthentication) {
    const apiKey = auth.credentials?.apiKey;
    if (!apiKey) throw Error('No apiKey in ' + JSON.stringify(auth))
    const token = env[apiKey]
    if (!token) throw Error('No token for apiKey ' + apiKey)
    return {Authorization: `Bearer ${token}`}
}

function authForBasic(env: NameAnd<string>, auth: BasicAuthentication) {
    if (!auth.credentials.username) throw Error('No username in ' + JSON.stringify(auth))
    if (!auth.credentials.password) throw Error('No password in ' + JSON.stringify(auth))
    const password = env[auth.credentials.password]
    if (!password) throw Error('No password in environment for ' + auth.credentials.password)
    return {Authorization: `Basic ${Buffer.from(`${auth.credentials.username}:${password}`).toString('base64')}`}
}

async function oAuthForBasic(env: NameAnd<string>, axios: Axios, auth: OAuthForBasicAuthentication) {
    const {username, password, tokenUrl} = auth.credentials;
    if (!username) throw Error('No username in ' + JSON.stringify(auth))
    if (!password) throw Error('No password in ' + JSON.stringify(auth))
    if (!tokenUrl) throw Error('No tokenUrl in ' + JSON.stringify(auth))
    const passwordFromEnv = env[password]
    if (!passwordFromEnv) throw Error('No password in environment for ' + password)
    const basicToken = `Basic ${Buffer.from(`${username}:${passwordFromEnv}`).toString('base64')}`;

    const params = new URLSearchParams({grant_type: "client_credentials"});
    const url = `${tokenUrl}?${params.toString()}`;
    const response = await axios.request({url, method: "Post", headers: {Authorization: basicToken}});

    const data = await response.data;
    return {token: data.access_token, expires: data.expires_in};
}

async function authForPrivate(env: NameAnd<string>, auth: PrivateTokenAuthentication) {
    const privateKey = auth.credentials?.token;
    if (!privateKey) throw Error('No privateKey in ' + JSON.stringify(auth))
    const token = env[privateKey]
    if (!token) throw Error('No token for privateKey ' + privateKey)
    return {'PRIVATE-TOKEN': token}
}

export async function getOrUpdateEntraId(
    config: TokenCacheConfig<EntraIdAuthentication>,
    auth: EntraIdAuthentication,
): Promise<string> {

    return (await getTokenAndTimeUsingCache(config, auth)).token
}

function authForHeader(env: Env, auth: HeaderAuthentication) {
    const results: NameAnd<string> = {}

    for (const {header, value} of toArray(auth.credentials)) {
        const apikey = env[value];
        if (!apikey)
            throw Error('No apiKey in environment for ' + header + '\n' + JSON.stringify(auth))
        results[header] = apikey
    }
    return results;
}

export const defaultAuthFn = (env: NameAnd<string>, axios: Axios, timeService: TimeService, tokenCache: TokenCache = globalTokenCache): AuthFn => {
    const entraIdConfig: TokenCacheConfig<EntraIdAuthentication> = {
        axios,
        timeService,
        env,
        tokenCache,
        tokenCacheLoadFn: authForEntraId,
        keyFn: (auth: EntraIdAuthentication) => auth.credentials.clientId + '/' + auth.credentials.scope,
    }
    const authForBearerConfig: TokenCacheConfig<Oauth2Authentication> = {
        axios,
        timeService,
        env,
        tokenCache,
        tokenCacheLoadFn: oauth2AuthenticationToken,
        keyFn: (auth: Oauth2Authentication) => auth.credentials.clientId + '/' + auth.credentials.scope,

    }
    return async (auth: Authentication) => {
        if (isEntraIdAuthentication(auth))
            return {Authorization: `Bearer ${await getTokenUsingCache(entraIdConfig, auth)}`}
        if (isHeaderAuthentication(auth)) return authForHeader(env, auth)
        if (isOauth2(auth))
            return {Authorization: `Bearer ${await getTokenUsingCache(authForBearerConfig, auth)}`};
        if (isSASAuthentication(auth)) return {}//no auth needed except for the sas token which is part of the url
        if (isApiKeyAuthentication(auth)) return authForApiToken(env, auth);
        if (isBearerAuthentication(auth)) return authForBearerToken(env, auth);
        if (isBasicAuthentication(auth)) return authForBasic(env, auth);
        if (isOAuthForBasicAuthentication(auth)) return oAuthForBasic(env, axios, auth);
        if (isPrivateTokenAuthentication(auth)) return authForPrivate(env, auth)
        if (isNoAuthentication(auth)) return {}
        throw Error('Unknown auth method ' + JSON.stringify(auth))
    };
};
export const findVarsFrom = (env: NameAnd<string>) => (auth: Authentication | undefined): string[] => {
    function value(key: string): string[] {
        const v = env[key]
        return [`${key}${v ? `: ${v}` : ' is undefined'}`]
    }

    if (auth === undefined) return []
    if (isSASAuthentication(auth)) return value(auth.credentials.sasToken)
    if (isHeaderAuthentication(auth)) return toArray(auth.credentials).flatMap(key => value(key.value))
    if (isOauth2(auth)) return value(auth.credentials.clientSecret)
    if (isOAuthForBasicAuthentication(auth)) return value(auth.credentials.password)
    if (isEntraIdAuthentication(auth)) return value(auth.credentials.clientSecret)
    if (isApiKeyAuthentication(auth)) return value(auth.credentials.apiKey);
    if (isBearerAuthentication(auth)) return value(auth.credentials.apiKey);
    if (isBasicAuthentication(auth)) return value(auth.credentials.password)
    if (isPrivateTokenAuthentication(auth)) return value(auth.credentials.token)
    if (isNoAuthentication(auth)) return []
    throw Error('Unknown auth method ' + JSON.stringify(auth))
};
