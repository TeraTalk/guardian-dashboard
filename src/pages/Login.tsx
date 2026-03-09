import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, Sparkles } from 'lucide-react';

// Require the image asset correctly
import onboardImg from '../assets/onboard2.png';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            const { accessToken, user } = response.data;
            if (!accessToken || !user) {
                throw new Error('Invalid response from server');
            }

            signIn(accessToken, user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">

            {/* Left Side: Illustration / Brand Panel */}
            <div className="relative hidden w-0 flex-1 lg:flex bg-gradient-to-br from-[#12051f] via-[#1E0A33] to-[#1E0A33] overflow-hidden flex-col items-center justify-center p-12">
                {/* Decorative glowing orbs to complement the dark theme */}
                <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-[#4A148C]/40 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                    <img
                        src={onboardImg}
                        alt="Parent and Child sharing a learning moment"
                        className="w-full h-auto object-contain max-h-[70vh] drop-shadow-2xl mb-8 animate-in fade-in zoom-in duration-1000"
                    />
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <h2 className="text-4xl font-extrabold text-white tracking-tight">
                            Unlock their potential.
                        </h2>
                        <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
                            Join thousands of parents actively tracking and accelerating their child's speech therapy journey from home.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 relative overflow-hidden bg-slate-50 lg:bg-white w-full lg:w-1/2">

                {/* Mobile Decorative Blobs (Hidden on Desktop) */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 lg:hidden" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 lg:hidden" />

                <div className="w-full max-w-md relative z-10">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-100 text-purple-600 mb-6 lg:ml-0 mx-auto w-14 h-14 shadow-sm border border-purple-200">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 font-medium">
                            Sign in to view your child’s therapy progress and updates.
                        </p>
                    </div>

                    <div className="bg-white/60 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 lg:p-0 rounded-3xl lg:rounded-none shadow-xl lg:shadow-none border border-white/40 lg:border-none">
                        <form className="space-y-6" onSubmit={handleLogin}>
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-600 animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                    Email address
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3.5 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                    Password
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3.5 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <a href="#" className="text-sm font-semibold text-purple-600 hover:text-purple-500 transition-colors">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5 mr-2" />
                                            Continue to Dashboard
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                            Don't have an account?{' '}
                            <span className="text-purple-600 hover:text-purple-500 transition-colors font-semibold cursor-pointer">
                                Download the app to register
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
