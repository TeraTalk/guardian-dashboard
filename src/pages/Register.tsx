import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles, UserPlus, Stethoscope, Heart } from 'lucide-react';

import onboardImg from '../assets/onboard2.png';

export const Register: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'guardian' | 'therapist'>('guardian');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                fullName,
                role
            });

            const { accessToken, user } = response.data;
            if (!accessToken || !user) {
                throw new Error('Invalid response from server');
            }

            signIn(accessToken, user);
            if (user.role === 'therapist') {
                navigate('/therapist-dashboard');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side: Illustration / Brand Panel */}
            <div className="relative hidden w-0 flex-1 lg:flex bg-gradient-to-br from-[#12051f] via-[#1E0A33] to-[#1E0A33] overflow-hidden flex-col items-center justify-center p-12">
                <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-[#4A148C]/40 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                    <img
                        src={onboardImg}
                        alt="Join our community"
                        className="w-full h-auto object-contain max-h-[60vh] drop-shadow-2xl mb-8 animate-in fade-in zoom-in duration-1000"
                    />
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <h2 className="text-4xl font-extrabold text-white tracking-tight">
                            Start the journey.
                        </h2>
                        <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
                            Whether you're a parent tracking progress or a therapist guiding the way, together we can unlock every child's potential.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Register Form */}
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 relative overflow-y-auto bg-slate-50 lg:bg-white w-full lg:w-1/2 min-h-screen custom-scrollbar">
                
                {/* Mobile Decorative Blobs */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 lg:hidden" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 lg:hidden" />

                <div className="w-full max-w-md relative z-10 py-8">
                    <div className="mb-8 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-100 text-purple-600 mb-6 lg:ml-0 mx-auto w-14 h-14 shadow-sm border border-purple-200">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            Create an account
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 font-medium">
                            Join us to manage and track speech therapy progress.
                        </p>
                    </div>

                    <div className="bg-white/60 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 lg:p-0 rounded-3xl lg:rounded-none shadow-xl lg:shadow-none border border-white/40 lg:border-none">
                        <form className="space-y-5" onSubmit={handleRegister}>
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-600 animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            {/* Role Selector */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700">I am a...</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setRole('guardian')}
                                        className={`relative flex flex-col p-4 border rounded-xl shadow-sm transition-all duration-200 text-left ${
                                            role === 'guardian' 
                                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' 
                                                : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Heart className={`w-6 h-6 mb-2 ${role === 'guardian' ? 'text-purple-600' : 'text-slate-400'}`} />
                                        <span className={`font-semibold text-sm ${role === 'guardian' ? 'text-purple-900' : 'text-slate-700'}`}>
                                            Guardian
                                        </span>
                                        <span className="text-xs text-slate-500 mt-1 line-clamp-2">
                                            I want to oversee my child's progress.
                                        </span>
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setRole('therapist')}
                                        className={`relative flex flex-col p-4 border rounded-xl shadow-sm transition-all duration-200 text-left ${
                                            role === 'therapist' 
                                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' 
                                                : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Stethoscope className={`w-6 h-6 mb-2 ${role === 'therapist' ? 'text-purple-600' : 'text-slate-400'}`} />
                                        <span className={`font-semibold text-sm ${role === 'therapist' ? 'text-purple-900' : 'text-slate-700'}`}>
                                            Therapist
                                        </span>
                                        <span className="text-xs text-slate-500 mt-1 line-clamp-2">
                                            I want to manage my patients' therapies.
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                                    Full Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Must be at least 8 characters long.</p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5 mr-2" />
                                            Create Account
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-purple-600 hover:text-purple-500 transition-colors font-semibold">
                                Sign in instead
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
