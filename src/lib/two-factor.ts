import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export interface TwoFactorSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export function generateTwoFactorSecret(userEmail: string): TwoFactorSetup {
  const secret = speakeasy.generateSecret({
    name: `Unified Inbox (${userEmail})`,
    issuer: 'Unified Inbox',
  })

  const backupCodes = Array.from({ length: 10 }, () => 
    Math.random().toString(36).substring(2, 15).toUpperCase()
  )

  return {
    secret: secret.base32!,
    qrCode: secret.otpauth_url!,
    backupCodes,
  }
}

export async function generateQRCodeDataURL(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl)
  } catch (error) {
    throw new Error('Failed to generate QR code')
  }
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 steps before/after current time
  })
}

export function verifyBackupCode(backupCodes: string[], providedCode: string): boolean {
  return backupCodes.includes(providedCode.toUpperCase())
}
