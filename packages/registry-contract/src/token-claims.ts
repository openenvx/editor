/** Default scope when REGISTRY_SCOPE env is unset (licensing tokens, docs). */
export const DEFAULT_REGISTRY_SCOPE = '@openenvxee';

/** @deprecated Use DEFAULT_REGISTRY_SCOPE */
export const REGISTRY_SCOPE = DEFAULT_REGISTRY_SCOPE;

export type RegistryLicenseType = 'subscription' | 'perpetual';

export interface RegistryTokenClaims {
  sub: string;
  typ: 'registry';
  scope: string;
  maxVersion: string;
  licenseType: RegistryLicenseType;
  iat: number;
  exp?: number;
  jti: string;
}

export function isPackageInScope(packageName: string, scope: string): boolean {
  if (!scope.startsWith('@')) {
    return !packageName.startsWith('@');
  }

  return packageName.startsWith(`${scope}/`);
}

export function isRegistryTokenClaims(
  value: unknown
): value is RegistryTokenClaims {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const claims = value as Record<string, unknown>;

  return (
    typeof claims.sub === 'string' &&
    claims.typ === 'registry' &&
    typeof claims.scope === 'string' &&
    claims.scope.startsWith('@') &&
    typeof claims.maxVersion === 'string' &&
    (claims.licenseType === 'subscription' ||
      claims.licenseType === 'perpetual') &&
    typeof claims.iat === 'number' &&
    typeof claims.jti === 'string' &&
    (claims.exp === undefined || typeof claims.exp === 'number')
  );
}
