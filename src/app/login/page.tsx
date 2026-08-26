'use client';

import { login } from '@/actions/auth';
import { Shield, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.requiresPin) {
        setStep(2);
        setLoading(false);
      } else if (result?.success) {
        router.push('/dashboard');
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 bg-blue-700 rounded-md flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        </div>
        <h2 className="text-center text-xl font-semibold text-zinc-900 tracking-tight">
          {step === 1 ? 'Sign in to your account' : 'Two-Factor Authentication'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-white py-8 px-4 shadow-sm border border-zinc-200 rounded-lg sm:px-10">
          <form action={handleLogin} className="space-y-5">
            {/* Keep inputs in DOM so formData retains them when step=2, just hide them if step=2 */}
            <div className={step === 2 ? 'hidden' : 'space-y-5'}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                  Email address
                </label>
                <div className="mt-1.5">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required={step === 1}
                    className="appearance-none block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Password
                </label>
                <div className="mt-1.5">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required={step === 1}
                    className="appearance-none block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-colors"
                  />
                </div>
              </div>
            </div>

            {step === 2 && (
              <div className="space-y-5 animate-in fade-in zoom-in duration-300">
                <p className="text-sm text-zinc-600 text-center mb-4">
                  Please enter your 6-digit Secure PIN to continue.
                </p>
                <div>
                  <label htmlFor="pin" className="block text-sm font-medium text-zinc-700">
                    Secure PIN
                  </label>
                  <div className="mt-1.5">
                    <input
                      id="pin"
                      name="pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      pattern="\d{6}"
                      maxLength={6}
                      required={step === 2}
                      className="appearance-none block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-center tracking-widest text-lg sm:text-sm transition-colors"
                      placeholder="------"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200 font-medium">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors disabled:bg-zinc-400"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (step === 1 ? 'Continue' : 'Verify & Sign in')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}