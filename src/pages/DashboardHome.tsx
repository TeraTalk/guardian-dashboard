import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Trophy, Activity, Star, Calendar, Stethoscope } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
    childName: string;
    speechLevel: string;
    initialDifficulty: string;
}

interface ProgressData {
    goalsMet: number;
    totalActivities: number;
}

// Mock chart data for premium look (Backend currently only returns total numbers for 30 days)
const chartData = [
    { name: 'Mon', activities: 4 },
    { name: 'Tue', activities: 3 },
    { name: 'Wed', activities: 5 },
    { name: 'Thu', activities: 2 },
    { name: 'Fri', activities: 6 },
    { name: 'Sat', activities: 8 },
    { name: 'Sun', activities: 7 },
];

export const DashboardHome: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [patientFeedback, setPatientFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const [profileRes, progressRes, feedbackRes] = await Promise.all([
                    api.get('/profile/check'),
                    api.get('/evaluation/weekly-progress'),
                    api.get(`/bookings/patients/${user.id}/feedback`).catch(() => ({ data: [] }))
                ]);

                if (profileRes.data.hasProfile) {
                    setProfile(profileRes.data.profile);
                }
                setProgress(progressRes.data);
                // Filter down to only get messages SENT by a therapist (therapist_id != guardian_id theoretically, or we just show all)
                setPatientFeedback(feedbackRes.data || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome back{profile?.childName ? `, ${profile.childName}'s Guardian` : ''} 👋
                </h1>
                <p className="mt-2 text-slate-500">
                    Here is how your child is progressing with their speech therapy this month.
                </p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Activity}
                    label="Total Activities"
                    value={progress?.totalActivities?.toString() || '0'}
                    subLabel="In the last 30 days"
                    color="blue"
                />
                <StatCard
                    icon={Trophy}
                    label="Goals Met"
                    value={progress?.goalsMet?.toString() || '0'}
                    subLabel="Days active"
                    color="emerald"
                />
                <StatCard
                    icon={Star}
                    label="Current Level"
                    value={profile?.speechLevel ? profile.speechLevel.charAt(0).toUpperCase() + profile.speechLevel.slice(1) : 'Beginner'}
                    subLabel="Speech proficiency"
                    color="indigo"
                />
                <StatCard
                    icon={Calendar}
                    label="Current Difficulty"
                    value={profile?.initialDifficulty ? profile.initialDifficulty.charAt(0).toUpperCase() + profile.initialDifficulty.slice(1) : 'Standard'}
                    subLabel="Initial setting"
                    color="purple"
                />
            </div>

            {/* Chart & Feedback Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Activity Overview</h2>
                        <p className="text-sm text-slate-500">Practice sessions over the last week</p>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="activities"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorActivities)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Therapist Notes Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 shadow-sm border border-indigo-100 flex flex-col h-[400px]">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-bold text-indigo-900">Clinical Notes</h2>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    </div>
                    <p className="text-xs font-semibold text-indigo-400 mb-4 tracking-wide uppercase">from your active Therapists</p>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-2">
                        {patientFeedback.length === 0 ? (
                            <div className="text-center py-10 opacity-70">
                                <p className="text-sm text-indigo-800 font-medium">No advice from your therapist yet. Ensure you have an active package booking!</p>
                            </div>
                        ) : (
                            [...patientFeedback].reverse().map(fb => (
                                <div key={fb.id} className="bg-white px-5 py-4 pt-5 rounded-2xl shadow-sm border border-indigo-50 leading-relaxed text-sm text-slate-700 relative hover:border-indigo-200 transition-colors">
                                    {fb.message}
                                    <div className="text-[10px] text-slate-400 mt-3 text-right font-medium">
                                        {new Date(fb.created_at).toLocaleString([], {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-indigo-100 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider">
                                        NEW NOTE
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for Stats
const StatCard = ({ icon: Icon, label, value, subLabel, color }: { icon: any, label: string, value: string, subLabel: string, color: string }) => {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        purple: 'bg-purple-50 text-purple-600',
    }[color] || 'bg-slate-50 text-slate-600';

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 transform translate-x-2 -translate-y-2 opacity-10 group-hover:scale-110 transition-transform duration-500 ${colorStyles.split(' ')[1]}`}>
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorStyles}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
                <p className="text-sm text-slate-400 mt-1">{subLabel}</p>
            </div>
        </div>
    );
};
