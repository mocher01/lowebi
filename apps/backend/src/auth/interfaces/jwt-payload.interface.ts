export interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // 'customer' | 'admin'
  iat?: number; // Issued at
  exp?: number; // Expiration
  jti?: string; // JWT ID - unique identifier to ensure token uniqueness
}
