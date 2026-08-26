'use client';

import { verifySudo } from '@/actions/auth';
import { Shield, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SudoVerifyPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await verifySudo(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        router.push('/dashboard/security');
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100">
            <Lock className="w-6 h-6" strokeWidth={2} />
          </div>
        </div>
        
        <h2 className="text-center text-xl font-bold text-zinc-900 mb-2">Restricted Access</h2>
        <p className="text-center text-sm text-zinc-500 mb-8">
          Please confirm your identity to access the Cybersecurity Command Center. This area contains sensitive system controls.
        </p>

        <form action={handleVerify} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Admin Password
            </label>
            <div className="mt-1.5">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-zinc-700">
              2FA Secure PIN
            </label>
            <div className="mt-1.5">
              <input
                id="pin"
                name="pin"
                type="password"
                pattern="\d{6}"
                maxLength={6}
                required
                className="appearance-none block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm text-center tracking-widest text-lg transition-colors"
                placeholder="------"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200 font-medium">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors disabled:bg-zinc-400"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Identity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}