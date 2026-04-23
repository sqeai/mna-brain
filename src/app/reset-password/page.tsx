'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LivingBackground } from '@/components/LivingBackground';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/api/client';

type Step = 'request' | 'reset';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const data = await apiRequest<{ key: string }>('/api/auth/forget-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setKey(data.key);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request reset key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await apiRequest<{ error: null }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ key, password: newPassword }),
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      <LivingBackground variant="default" />
      <div className="relative z-10 w-full flex justify-center">
        <Card className="w-full max-w-md min-h-[480px] flex flex-col rounded-md border-white/20 bg-white/10 backdrop-blur-xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 items-center justify-center">
              <Image
                src="/logo-light.png"
                alt="Brain 2.0"
                width={120}
                height={56}
                className="h-14 w-auto object-contain rounded-2xl"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-black dark:text-white">
              Reset Password
            </CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-[0.2em] text-black/70 dark:text-white/70">
              {step === 'request' ? 'Request a reset key' : 'Enter your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-black dark:text-white">
            {success ? (
              <Alert className="border-green-500/50 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Password reset successfully. Redirecting to sign in...
                </AlertDescription>
              </Alert>
            ) : step === 'request' ? (
              <form onSubmit={handleRequestKey} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm text-black/80 dark:text-white/80">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus-visible:ring-black/30 dark:focus-visible:ring-white/30"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Requesting key...
                    </>
                  ) : (
                    'Request Reset Key'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-key" className="text-sm text-black/80 dark:text-white/80">
                    Reset Key
                  </Label>
                  <Input
                    id="reset-key"
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus-visible:ring-black/30 dark:focus-visible:ring-white/30 font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm text-black/80 dark:text-white/80">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus-visible:ring-black/30 dark:focus-visible:ring-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm text-black/80 dark:text-white/80">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus-visible:ring-black/30 dark:focus-visible:ring-white/30"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center w-full text-center text-xs font-medium uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
            <Link href="/login" className="hover:underline">
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
