import {ApiKeyAuthentication, Authentication, BasicAuthentication, BearerAuthentication, EntraIdAuthentication, NoAuthentication, PrivateTokenAuthentication, SASAuthentication} from "./authentication.domain";
import {ErrorsOr} from "@lenscape/errors";

/**
 * Validates the EntraIdAuthentication type.
 */
export function validateEntraIdAuthentication(
    auth: any,
    prefix: string = ''
): ErrorsOr<EntraIdAuthentication> {
    const errors: string[] = [];

    if (typeof auth.credentials !== 'object' || auth.credentials === null) {
        return {errors: [`${prefix}credentials must be an object`]};
    }

    const credentials = auth.credentials;

    if (typeof credentials.clientId !== 'string') {
        errors.push(`${prefix}credentials.clientId must be a string`);
    }
    if (typeof credentials.clientSecret !== 'string') {
        errors.push(`${prefix}credentials.clientSecret must be a string`);
    }
    if (
        'tenantId' in credentials &&
        credentials.tenantId !== undefined &&
        typeof credentials.tenantId !== 'string'
    ) {
        errors.push(`${prefix}credentials.tenantId must be a string if provided`);
    }
    if (
        'resource' in credentials &&
        credentials.resource !== undefined &&
        typeof credentials.resource !== 'string'
    ) {
        errors.push(`${prefix}credentials.resource must be a string if provided`);
    }
    if (
        'scope' in credentials &&
        credentials.scope !== undefined &&
        typeof credentials.scope !== 'string'
    ) {
        errors.push(`${prefix}credentials.scope must be a string if provided`);
    }
    if (
        'version' in credentials &&
        credentials.version !== undefined &&
        credentials.version !== 1 &&
        credentials.version !== 2
    ) {
        errors.push(`${prefix}credentials.version must be 1 or 2 if provided`);
    }

    return errors.length ? {errors} : {value: (auth as EntraIdAuthentication)};
}

/**
 * Validates the SASAuthentication type.
 */
export function validateSASAuthentication(
    auth: any,
    prefix: string = ''
): ErrorsOr<SASAuthentication> {
    if (typeof auth.credentials !== 'object' || auth.credentials === null) {
        return {errors: [`${prefix}credentials must be an object`]};
    }
    if (typeof auth.credentials.sasToken !== 'string') {
        return {errors: [`${prefix}credentials.sasToken must be a string`]};
    }
    return {value: auth as SASAuthentication};
}

/**
 * Validates the BasicAuthentication type.
 */
export function validateBasicAuthentication(
    auth: any,
    prefix: string = ''
): ErrorsOr<BasicAuthentication> {
    const errors: string[] = [];

    // Validate that credentials is an object
    if (typeof auth.credentials !== 'object' || auth.credentials === null) {
        errors.push(`${prefix}credentials must be an object`);
        return {errors}; // No point in continuing if credentials is invalid
    }

    const {username, password} = auth.credentials;

    // Check if username is defined
    if (username === undefined) {
        errors.push(`${prefix}credentials.username is required`);
    } else if (typeof username !== 'string') {
        errors.push(`${prefix}credentials.username must be a string`);
    }

    // Check if password is defined
    if (password === undefined) {
        errors.push(`${prefix}credentials.password is required`);
    } else if (typeof password !== 'string') {
        errors.push(`${prefix}credentials.password must be a string`);
    }

    return errors.length ? {errors} : {value: (auth as BasicAuthentication)};
}


/**
 * Validates the ApiKeyAuthentication type.
 */
export function validateApiKeyAuthentication(
    auth: any,
    prefix: string = ''
): ErrorsOr<ApiKeyAuthentication> {
    if (typeof auth.credentials !== 'object' || auth.credentials === null) {
        return {errors: [`${prefix}credentials must be an object`]};
    }
    if (typeof auth.credentials.apiKey !== 'string') {
        return {errors: [`${prefix}credentials.apiKey must be a string`]};
    }
    return {value: auth as ApiKeyAuthentication};
}

/**
 * Validates the BearerAuthentication type.
 */
export function validateBearerAuthentication(
    auth: any,
    prefix: string = ''
): ErrorsOr<BearerAuthentication> {
    if (typeof auth.credentials !== 'object' || auth.credentials === null) {
        return {errors: [`${prefix}credentials must be an object`]};
    }
    if (typeof auth.credentials.apiKey !== 'string') {
        return {errors: [`${prefix}credentials.apiKey must be a string`]};
    }
    return {value: auth as BearerAuthentication};
}

/**
 * Validates the PrivateTokenAuthentication type.
 */
export function validatePrivateTokenAuthentication(
    auth: any,
    prefix: string = ''
): ErrorsOr<PrivateTokenAuthentication> {
    if (typeof auth.credentials !== 'object' || auth.credentials === null) {
        return {errors: [`${prefix}credentials must be an object`]};
    }
    if (typeof auth.credentials.token !== 'string') {
        return {errors: [`${prefix}credentials.token must be a string`]};
    }
    return {value: auth as PrivateTokenAuthentication};
}

/**
 * Validates the NoAuthentication type.
 */
export function validateNoAuthentication(
    auth: any,
    prefix: string = ''
): ErrorsOr<NoAuthentication> {
    if (Object.keys(auth).length !== 1) {
        return {errors: [`${prefix}authentication of method "none" should not have extra properties`]};
    }
    return {value: auth as NoAuthentication};
}

/**
 * Validates the Authentication union type.
 */
export function validateAuthentication(
    auth: any,
    prefix: string = ''
): ErrorsOr<Authentication> {
    if (typeof auth !== 'object' || auth === null) {
        return {errors: [`${prefix}authentication must be an object`]};
    }
    if (typeof auth.method !== 'string') {
        return {errors: [`${prefix}method must be a string`]};
    }

    switch (auth.method) {
        case 'EntraId':
            return validateEntraIdAuthentication(auth, prefix);
        case 'SAS':
            return validateSASAuthentication(auth, prefix);
        case 'Basic':
            return validateBasicAuthentication(auth, prefix);
        case 'ApiKey':
            return validateApiKeyAuthentication(auth, prefix);
        case 'Bearer':
            return validateBearerAuthentication(auth, prefix);
        case 'PrivateToken':
            return validatePrivateTokenAuthentication(auth, prefix);
        case 'none':
            return validateNoAuthentication(auth, prefix);
        default:
            return {errors: [`${prefix}method "${auth.method}" is not a valid authentication method`]};
    }
}
