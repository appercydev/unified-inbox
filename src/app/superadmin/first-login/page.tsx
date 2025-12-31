'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { resetPassword } from '@/lib/auth'
import { generateTwoFactorSecret, generateQRCodeDataURL, verifyTwoFactorToken } from '@/lib/two-factor'
import { supabase } from '@/lib/supabase'
import { QrCodeIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function SuperAdminFirstLoginPage() {
  const [step, setStep] = useState<'password' | '2fa-setup' | 'complete'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const email = searchParams.get('email') || 'appercydev@gmail.com'
  
  // Password reset form
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  
  // 2FA setup form
  const [twoFactorData, setTwoFactorData] = useState({
    secret: '',
    qrCode: '',
    backupCodes: [] as string[],
    verificationCode: '',
  })

  useEffect(() => {
    if (!email || email !== 'appercydev@gmail.com') {
      router.push('/login')
    }
  }, [email, router])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      // Generate a reset token for the SuperAdmin
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store the reset token
      const { error: tokenError } = await supabase
        .from('password_resets')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          token,
          expires_at: expiresAt.toISOString(),
        })

      if (tokenError) throw tokenError

      // Reset the password
      const { success, error } = await resetPassword(token, passwordData.newPassword)
      
      if (success) {
        // Move to 2FA setup
        const twoFactorSetup = generateTwoFactorSecret(email)
        const qrCodeDataURL = await generateQRCodeDataURL(twoFactorSetup.qrCode)
        
        setTwoFactorData({
          secret: twoFactorSetup.secret,
          qrCode: qrCodeDataURL,
          backupCodes: twoFactorSetup.backupCodes,
          verificationCode: '',
        })
        
        setStep('2fa-setup')
      } else {
        setError(error || 'Failed to reset password')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handle2FASetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (twoFactorData.verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code')
      setLoading(false)
      return
    }

    try {
      const isValid = verifyTwoFactorToken(twoFactorData.secret, twoFactorData.verificationCode)
      
      if (isValid) {
        // Save 2FA secret to user profile
        const { error: updateError } = await supabase
          .from('tenant_users')
          .update({ 
            two_factor_enabled: true,
            two_factor_secret: twoFactorData.secret
          })
          .eq('email', email)

        if (updateError) throw updateError

        setStep('complete')
      } else {
        setError('Invalid verification code. Please try again.')
      }
    } catch (err) {
      setError('Failed to enable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/login')
  }

  if (step === 'password') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Unified Inbox
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            SuperAdmin First-Time Setup
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome, SuperAdmin!</h2>
              <p className="text-sm text-gray-600 mb-4">
                For security, please set a new password for your account.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Email:</strong> {email}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  required
                  minLength={8}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={8}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition duration-200"
              >
                {loading ? 'Setting Password...' : 'Set New Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === '2fa-setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Unified Inbox
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Setup Two-Factor Authentication
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enable 2FA for Security</h2>
              <p className="text-sm text-gray-600 mb-4">
                Scan the QR code below with your authenticator app (Google Authenticator, Microsoft Authenticator, etc.)
              </p>
            </div>

            <div className="mb-6">
              <div className="flex justify-center mb-4">
                {twoFactorData.qrCode && (
                  <img src={twoFactorData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                )}
              </div>
              
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-xs text-gray-600 mb-2">Can't scan? Enter this code manually:</p>
                <code className="text-xs bg-white p-2 rounded block break-all">
                  {twoFactorData.secret}
                </code>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-800">
                  <strong>Save these backup codes:</strong> Store them safely. You can use them to access your account if you lose your device.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {twoFactorData.backupCodes.map((code, index) => (
                    <code key={index} className="text-xs bg-white p-1 rounded text-center">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handle2FASetup} className="space-y-6">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 6-Digit Code *
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={twoFactorData.verificationCode}
                  onChange={(e) => setTwoFactorData(prev => ({ ...prev, verificationCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition duration-200"
              >
                {loading ? 'Enabling 2FA...' : 'Enable 2FA'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Unified Inbox
          </h1>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Your SuperAdmin account is now secured with a new password and two-factor authentication.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-center text-sm text-green-600">
                  <KeyIcon className="h-5 w-5 mr-2" />
                  Password updated
                </div>
                <div className="flex items-center justify-center text-sm text-green-600">
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  2FA enabled
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Sign In to SuperAdmin
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
