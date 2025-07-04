export type EntraIdAuthentication={
  method: 'EntraId';
  credentials: {
    tenantId?: string
    clientId: string;            // Public identifier for the app
    clientSecret: string;        // Secret used to authenticate the app and obtain tokens
    resource?: string; // The resource to access. Often not specified
    scope?: string
    version?: 1 | 2

  };
};
export function isEntraIdAuthentication(auth: Authentication): auth is EntraIdAuthentication{
  return auth?.method==='EntraId';
}

type HeaderAndValue={
    header: string;
    value: string;
}
export type HeaderAuthentication={
    method: 'Header';
    credentials: HeaderAndValue | HeaderAndValue[];
}
export function isHeaderAuthentication(auth: Authentication): auth is HeaderAuthentication{
  return auth?.method==='Header';
}

export type SASAuthentication={
  method: 'SAS';
  credentials: {
    sasToken: string;
  };
}
export function isSASAuthentication(auth: Authentication): auth is SASAuthentication{
  return auth?.method==='SAS';
}

export type BasicAuthentication={
  method: 'Basic';
  credentials: {
    username: string;
    password: string;
  };
};
export const isBasicAuthentication=(auth: Authentication): auth is BasicAuthentication => auth?.method==='Basic';

export type OAuthForBasicAuthentication={
  method: 'OAuthForBasic';
  credentials: {
    tokenUrl: string;
    username: string;
    password: string;
  };
};
export const isOAuthForBasicAuthentication=(auth: Authentication): auth is OAuthForBasicAuthentication => auth?.method==='OAuthForBasic';

export type ApiKeyAuthentication={
  method: 'ApiKey';
  credentials: {
    apiKey: string;
  };
};
export function isApiKeyAuthentication(auth: Authentication): auth is ApiKeyAuthentication{
  return auth?.method==='ApiKey';
}
export type BearerAuthentication={
  method: 'Bearer';
  credentials: {
    apiKey: string;
  };
};
export function isBearerAuthentication(auth: Authentication): auth is BearerAuthentication{
  return auth?.method==='Bearer';
}

export type Oauth2Authentication={
  method: 'OAuth2';
  credentials: {
    url: string
    clientId: string
    clientSecret: string
    scope: string
  };
};

export function isOauth2(auth: Authentication): auth is Oauth2Authentication{
  return auth?.method==='OAuth2';
}

export type PrivateTokenAuthentication={
  method: 'PrivateToken';
  credentials: {
    token: string;
  };
};
export function isPrivateTokenAuthentication(auth: Authentication): auth is PrivateTokenAuthentication{
  return auth?.method==='PrivateToken';
}

export type NoAuthentication={
  method: 'none';
};
export function isNoAuthentication(auth: Authentication): auth is NoAuthentication{
  return auth?.method==='none';
}

// Union export type for general authentication
export type Authentication=EntraIdAuthentication | BasicAuthentication |HeaderAuthentication| OAuthForBasicAuthentication | ApiKeyAuthentication | PrivateTokenAuthentication | SASAuthentication | NoAuthentication | BearerAuthentication | Oauth2Authentication;

export function isAuthentication(auth: Authentication): auth is Authentication{
  return isEntraIdAuthentication(auth)||
    isOauth2(auth)||
    isHeaderAuthentication(auth)||
    isBearerAuthentication(auth)||
    isBasicAuthentication(auth)||
    isApiKeyAuthentication(auth)||
    isBasicAuthentication(auth)||
    isOAuthForBasicAuthentication(auth)||
    isNoAuthentication(auth)||
    isSASAuthentication(auth)||
    isPrivateTokenAuthentication(auth);
}
// Example Usage
