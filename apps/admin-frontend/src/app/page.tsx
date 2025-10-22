'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api-client';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@locod.ai');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiClient.login(email, password);
      
      // Check if user has admin role
      const userRole = data.user?.role?.toLowerCase();
      if (userRole !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store tokens
      localStorage.setItem('adminToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      console.log('✅ Admin login successful:', data.user.email);
      
      // Redirect to admin dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('❌ Login error:', err.message);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="min-h-screen flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              LA
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            LOGEN Admin Portal
          </h1>
          <p className="text-lg text-slate-600">
            Accès administratif sécurisé pour gérer la génération de contenu IA
          </p>
        </div>

        {/* Login Form */}
        <div className="mx-auto w-full max-w-xs">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@locod.ai"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-3 focus:ring-indigo-100 focus:border-indigo-600 transition-all duration-200"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de Passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe sécurisé"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-3 focus:ring-indigo-100 focus:border-indigo-600 transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center px-4 py-3 text-white border-0 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-indigo-600 cursor-pointer hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">⏳</span>
                    Authentification...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔐</span>
                    Accéder au Portail Admin
                  </>
                )}
              </button>
            </form>
            
            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 m-0 flex items-center justify-center">
                <span className="mr-2">🛡️</span>
                Sécurisé avec un chiffrement de niveau entreprise
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            © 2024 LOGEN. L'accès administratif est surveillé et enregistré.
          </p>
        </div>
      </div>
    </div>
  );
}