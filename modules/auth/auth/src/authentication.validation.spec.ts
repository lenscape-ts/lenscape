import {validateApiKeyAuthentication, validateAuthentication, validateBasicAuthentication, validateBearerAuthentication, validateEntraIdAuthentication, validateNoAuthentication, validatePrivateTokenAuthentication, validateSASAuthentication} from "./authentication.validation";

import {ApiKeyAuthentication, BasicAuthentication, BearerAuthentication, EntraIdAuthentication, isEntraIdAuthentication, isSASAuthentication, NoAuthentication, PrivateTokenAuthentication, SASAuthentication} from "./authentication.domain";
import {errorsOrThrow, valueOrThrow} from "@lenscape/errors";

describe('validateEntraIdAuthentication', () => {
    it('should validate a correct EntraIdAuthentication', () => {
        const authInput: EntraIdAuthentication = {
            method: 'EntraId',
            credentials: {
                clientId: 'client-id',
                clientSecret: 'client-secret',
                tenantId: 'tenant-id',
                resource: 'resource',
                scope: 'scope',
                version: 2,
            },
        };

        const validationResult = valueOrThrow(validateEntraIdAuthentication(authInput));
        expect(validationResult.credentials.clientId).toBe('client-id');
        expect(validationResult.credentials.clientSecret).toBe('client-secret');
        expect(validationResult.credentials.tenantId).toBe('tenant-id');
        expect(validationResult.credentials.resource).toBe('resource');
        expect(validationResult.credentials.scope).toBe('scope');
        expect(validationResult.credentials.version).toBe(2);
    });

    it('should return errors when credentials is not an object', () => {
        const authInput = {
            method: 'EntraId',
            credentials: 'not an object',
        };

        const validationResult = errorsOrThrow(validateEntraIdAuthentication(authInput));
        expect(validationResult).toEqual(["credentials must be an object"])
    });

    it('should return errors for missing required fields', () => {
        const authInput = {
            method: 'EntraId',
            credentials: {
                clientId: 'client-id',
            },
        };

        const validationResult = errorsOrThrow(validateEntraIdAuthentication(authInput));
        expect(validationResult).toEqual(["credentials.clientSecret must be a string"]);
    });

    it('should return errors for invalid optional fields', () => {
        const authInput = {
            method: 'EntraId',
            credentials: {
                clientId: 'client-id',
                clientSecret: 'client-secret',
                tenantId: 123,
                version: 3,
            },
        };

        const validationResult = errorsOrThrow(validateEntraIdAuthentication(authInput));
        expect(validationResult).toEqual(["credentials.tenantId must be a string if provided", "credentials.version must be 1 or 2 if provided"]);
    });
});


describe('validateSASAuthentication', () => {
    it('should validate a correct SASAuthentication', () => {
        const authInput: SASAuthentication = {
            method: 'SAS',
            credentials: {
                sasToken: 'sas-token',
            },
        };

        const validationResult = valueOrThrow(validateSASAuthentication(authInput));
        expect(validationResult.credentials.sasToken).toBe('sas-token');
    });

    it('should return errors when credentials is not an object', () => {
        const authInput = {
            method: 'SAS',
            credentials: 'not an object',
        };

        const validationResult = errorsOrThrow(validateSASAuthentication(authInput));

        expect(validationResult).toEqual(["credentials must be an object"]);
    });

    it('should return errors for missing sasToken', () => {
        const authInput = {
            method: 'SAS',
            credentials: {},
        };

        const validationResult = errorsOrThrow(validateSASAuthentication(authInput));
        expect(validationResult).toEqual(["credentials.sasToken must be a string"]);

    });

    it('should return errors when sasToken is not a string', () => {
        const authInput = {
            method: 'SAS',
            credentials: {
                sasToken: 123,
            },
        };

        const validationResult = errorsOrThrow(validateSASAuthentication(authInput));

        expect(validationResult).toEqual(["credentials.sasToken must be a string"]);
    });
});


describe('validateBasicAuthentication', () => {
    it('should validate a correct BasicAuthentication', () => {
        const authInput: BasicAuthentication = {
            method: 'Basic',
            credentials: {
                username: 'user',
                password: 'pass',
            },
        };

        const validationResult = valueOrThrow(validateBasicAuthentication(authInput));

        expect(validationResult.credentials.username).toBe('user');
        expect(validationResult.credentials.password).toBe('pass');
    });

    it('should return errors when credentials is not an object', () => {
        const authInput = {
            method: 'Basic',
            credentials: 'not an object',
        };

        const validationResult = errorsOrThrow(validateBasicAuthentication(authInput));

        expect(validationResult).toEqual(["credentials must be an object"]);
    });

    it('should return errors for missing username and password', () => {
        const authInput = {
            method: 'Basic',
            credentials: {},
        };

        const validationResult = errorsOrThrow(validateBasicAuthentication(authInput));

        expect(validationResult).toEqual([
            "credentials.username is required",
            "credentials.password is required"
        ]);
    });

    it('should return errors when username or password is not a string', () => {
        const authInput = {
            method: 'Basic',
            credentials: {
                username: 123,
                password: true,
            },
        };

        const validationResult = errorsOrThrow(validateBasicAuthentication(authInput));


        expect(validationResult).toEqual(["credentials.username must be a string", "credentials.password must be a string"]);
    });
});


describe('validateApiKeyAuthentication', () => {
    it('should validate a correct ApiKeyAuthentication', () => {
        const authInput: ApiKeyAuthentication = {
            method: 'ApiKey',
            credentials: {
                apiKey: 'api-key',
            },
        };

        const validationResult = valueOrThrow(validateApiKeyAuthentication(authInput));

        expect(validationResult.credentials.apiKey).toBe('api-key');
    });

    it('should return errors when credentials is not an object', () => {
        const authInput = {
            method: 'ApiKey',
            credentials: 'not an object',
        };

        const validationResult = errorsOrThrow(validateApiKeyAuthentication(authInput));

        expect(validationResult).toEqual(["credentials must be an object"]);
    });

    it('should return errors for missing apiKey', () => {
        const authInput = {
            method: 'ApiKey',
            credentials: {},
        };

        const validationResult = errorsOrThrow(validateApiKeyAuthentication(authInput));

        expect(validationResult).toEqual(["credentials.apiKey must be a string"]);
    });

    it('should return errors when apiKey is not a string', () => {
        const authInput = {
            method: 'ApiKey',
            credentials: {
                apiKey: 123,
            },
        };

        const validationResult = errorsOrThrow(validateApiKeyAuthentication(authInput));

        expect(validationResult).toEqual(["credentials.apiKey must be a string"]);
    });
});
describe('validateBearerAuthentication', () => {
    it('should validate a correct BearerAuthentication', () => {
        const authInput: BearerAuthentication = {
            method: 'Bearer',
            credentials: {
                apiKey: 'bearer-token',
            },
        };

        const validationResult = valueOrThrow(validateBearerAuthentication(authInput));

        expect(validationResult.credentials.apiKey).toEqual('bearer-token');
    });

    it('should return errors when credentials is not an object', () => {
        const authInput = {
            method: 'Bearer',
            credentials: 'not an object',
        };

        const validationResult = errorsOrThrow(validateBearerAuthentication(authInput));

        expect(validationResult).toEqual(["credentials must be an object"]);
    });

    it('should return errors for missing apiKey', () => {
        const authInput = {
            method: 'Bearer',
            credentials: {},
        };

        const validationResult = errorsOrThrow(validateBearerAuthentication(authInput));

        expect(validationResult).toEqual(["credentials.apiKey must be a string"]);
    });

    it('should return errors when apiKey is not a string', () => {
        const authInput = {
            method: 'Bearer',
            credentials: {
                apiKey: 123,
            },
        };

        const validationResult = errorsOrThrow(validateBearerAuthentication(authInput))

        expect(validationResult).toEqual(["credentials.apiKey must be a string"]);
    });
});

describe('validatePrivateTokenAuthentication', () => {
    it('should validate a correct PrivateTokenAuthentication', () => {
        const authInput: PrivateTokenAuthentication = {
            method: 'PrivateToken',
            credentials: {
                token: 'private-token',
            },
        };

        const validationResult = valueOrThrow(validatePrivateTokenAuthentication(authInput));

        expect(validationResult.credentials.token).toBe('private-token');
    });

    it('should return errors when credentials is not an object', () => {
        const authInput = {
            method: 'PrivateToken',
            credentials: 'not an object',
        };

        const validationResult = errorsOrThrow(validatePrivateTokenAuthentication(authInput));

        expect(validationResult).toContain('credentials must be an object');
    });

    it('should return errors for missing token', () => {
        const authInput = {
            method: 'PrivateToken',
            credentials: {},
        };

        const validationResult = errorsOrThrow(validatePrivateTokenAuthentication(authInput));

        expect(validationResult).toEqual(["credentials.token must be a string"]);
    });

    it('should return errors when token is not a string', () => {
        const authInput = {
            method: 'PrivateToken',
            credentials: {
                token: true,
            },
        };

        const validationResult = errorsOrThrow(validatePrivateTokenAuthentication(authInput));

        expect(validationResult).toEqual(["credentials.token must be a string"]);
    });
});

describe('validateNoAuthentication', () => {
    it('should validate a correct NoAuthentication', () => {
        const authInput: NoAuthentication = {
            method: 'none',
        };

        const validationResult = valueOrThrow(validateNoAuthentication(authInput));

        expect(validationResult.method).toBe('none');
    });

    it('should return errors when extra properties are present', () => {
        const authInput = {
            method: 'none',
            extraProp: 'should not be here',
        };

        const validationResult = errorsOrThrow(validateNoAuthentication(authInput));

        expect(validationResult).toEqual(["authentication of method \"none\" should not have extra properties"]);
    });
});
describe('validateAuthentication', () => {
    it('should validate a correct EntraIdAuthentication', () => {
        const authInput: EntraIdAuthentication = {
            method: 'EntraId',
            credentials: {
                clientId: 'client-id',
                clientSecret: 'client-secret',
            },
        };

        const validationResult = valueOrThrow(validateAuthentication(authInput));
        if (isEntraIdAuthentication(validationResult)) {
            expect(validationResult.credentials.clientId).toBe('client-id');
            expect(validationResult.credentials.clientSecret).toBe('client-secret');
        } else {
            fail('Validation failed or incorrect type');
        }
    });

    it('should validate a correct SASAuthentication', () => {
        const authInput: SASAuthentication = {
            method: 'SAS',
            credentials: {
                sasToken: 'sas-token',
            },
        };

        const validationResult = valueOrThrow(validateAuthentication(authInput));


        if (isSASAuthentication(validationResult)) {
            expect(validationResult.credentials.sasToken).toBe('sas-token');
        } else {
            fail('Validation failed or incorrect type');
        }
    });

    // Repeat similar tests for other authentication types...

    it('should return errors when method is invalid', () => {
        const authInput = {
            method: 'InvalidMethod',
            credentials: {},
        };

        const validationResult = errorsOrThrow(validateAuthentication(authInput));

        expect(validationResult).toEqual(["method \"InvalidMethod\" is not a valid authentication method"]);
    });

    it('should return errors when auth is not an object', () => {
        const authInput = 'not an object';

        const validationResult = errorsOrThrow(validateAuthentication(authInput));

        expect(validationResult).toEqual(["authentication must be an object"]);
    });
});

