'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LivingBackground } from '@/components/LivingBackground';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };



  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <LivingBackground variant="grid" />
        <div className="relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      <LivingBackground variant="grid" />
      <div className="relative z-10 w-full flex justify-center">
      <Card className="w-full max-w-md min-h-[480px] flex flex-col rounded-md border-white/20 bg-white/10 backdrop-blur-xl shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-b from-violet-400 to-purple-800 shadow-md">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">BRAIN 2.0</CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            ENTERPRISE DEAL INTELLIGENCE
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 text-white">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-sm text-white/80">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-sm text-white/80">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/30"
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center w-full text-center text-xs font-medium uppercase tracking-[0.15em] text-white/60">
          SECURED BY NEURAL CORE LOGIC
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}
