import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Stethoscope, Users, Calendar, LogOut } from 'lucide-react';

export const TherapistDashboardHome: React.FC = () => {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-xl">
                        <Stethoscope className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Therapist Portal</h1>
                        <p className="text-xs text-slate-500 font-medium">Welcome, {user?.fullName || 'Therapist'}</p>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
                    <p className="text-slate-500">Here is your daily summary and tasks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Sample Metric Cards */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-700">Active Patients</h3>
                            <Users className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">0</p>
                        <p className="text-sm text-slate-500 mt-2">Awaiting new assignments</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-700">Upcoming Sessions</h3>
                            <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">0</p>
                        <p className="text-sm text-slate-500 mt-2">No sessions scheduled today</p>
                    </div>
                </div>

                <div className="mt-8 bg-purple-50 rounded-2xl p-8 border border-purple-100 text-center">
                    <Stethoscope className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-purple-900 mb-2">Workspace Coming Soon</h3>
                    <p className="text-purple-700 max-w-md mx-auto">
                        This is a sample layout for the Therapist Dashboard. In the future, you will be able to view patient progress, review voice attempts, and update treatment plans here.
                    </p>
                </div>
            </main>
        </div>
    );
};
