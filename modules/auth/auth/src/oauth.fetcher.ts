import {EntraIdAuthentication, Oauth2Authentication} from "./authentication.domain";
import {TokenCacheLoadFn} from "./token.cache";
import {Axios, AxiosRequestConfig} from "axios";
import {NameAnd} from "@lenscape/records";

interface TokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    token_type: string;
    scope?: string;
    id_token?: string;
}

export const authForEntraId: TokenCacheLoadFn<EntraIdAuthentication> = async (env: NameAnd<string>, axios: Axios, oauth: EntraIdAuthentication) => {
    const {tenantId, clientId, clientSecret, resource, scope} = oauth.credentials;
    const version = oauth.credentials.version || 2
    const url = version === 2 ?
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token` :
        `https://accounts.accesscontrol.windows.net/${tenantId}/tokens/OAuth/2` //legacy but OK endpoint
    const body = new URLSearchParams();
    const secret = env[clientSecret]
    if (!secret) throw Error(`Need Environment variable for client secret ${clientSecret}`)
    body.append('grant_type', 'client_credentials');
    body.append('client_id', clientId);
    if (resource) body.append('resource', resource);
    body.append('client_secret', secret);
    if (scope) body.append('scope', scope);

    const config: AxiosRequestConfig = {
        method: 'post',
        url,
        data: body.toString(),
        headers: {'Content-Type': 'application/x-www-form-urlencoded',},
        // (Optional) you can set a timeout, e.g. 10s
        timeout: 10_000,
        // If you need to inspect headers in error cases, tell Axios to include them
        // validateStatus: status => status < 500,
    };

    const response = await axios.request<TokenResponse>(config);

    const data = await response.data;
    return {token: data.access_token, expires: data.expires_in, refreshToken: data.refresh_token};
};


export const oauth2AuthenticationToken: TokenCacheLoadFn<Oauth2Authentication> = async (env: NameAnd<string>, axios: Axios, auth: Oauth2Authentication) => {
    const {clientId, clientSecret, url, scope} = auth.credentials;
    const body = new URLSearchParams();
    const secret = env[clientSecret]
    if (!secret) throw Error(`Need Environment variable for client secret ${clientSecret}`)
    body.append('grant_type', 'client_credentials');
    body.append('client_id', clientId);
    body.append('client_secret', secret);
    if (scope) body.append('scope', scope);

    const config: AxiosRequestConfig = {
        method: 'post',
        url,
        data: body.toString(),
        headers: {'Content-Type': 'application/x-www-form-urlencoded',},
        // (Optional) you can set a timeout, e.g. 10s
        timeout: 10_000,
        // If you need to inspect headers in error cases, tell Axios to include them
        // validateStatus: status => status < 500,
    };

    const response = await axios.request<TokenResponse>(config);

    const data = await response.data;
    return {token: data.access_token, expires: data.expires_in, refreshToken: data.refresh_token};
}