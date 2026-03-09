import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { AlertCircle, History, TrendingDown } from 'lucide-react';

interface AttemptData {
    id: number;
    created_at: string;
    is_pass: boolean;
    severity: number | null;
    speech_level: string;
    is_kid_attempt?: boolean;
    expected_word?: string | null;
    expected_sound?: string | null;
    transcribed_word?: string | null;
    error_type?: string | null;
    confidence?: number | null;
    game_type?: string | null;
    word_id?: string | null;
    attempt_number?: number | null;
    game_level?: number | null;
    analysis_model?: string | null;
}

export const Analytics: React.FC = () => {
    const [attempts, setAttempts] = useState<AttemptData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // We will hit a new backend endpoint for getting the raw attempts.
                // For now, if it doesn't exist, we will gracefully handle the 404 and show mock data to demonstrate the UI.
                const res = await api.get('/evaluation/history').catch(() => {
                    console.warn("Backend /evaluation/history not ready, using mock data for UI visualization.");
                    return { data: generateMockData() };
                });
                setAttempts(res.data || []);
            } catch (err) {
                setError('Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center border border-red-100">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // 1. Process data for Severity Trend (Line Chart) over time
    // Group by day and average the severity
    const severityByDay = attempts.reduce((acc, curr) => {
        if (curr.severity === null) return acc;
        const date = new Date(curr.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!acc[date]) {
            acc[date] = { date, totalSeverity: 0, count: 0 };
        }
        acc[date].totalSeverity += curr.severity;
        acc[date].count += 1;
        return acc;
    }, {} as Record<string, { date: string, totalSeverity: number, count: number }>);

    const trendData = Object.values(severityByDay).map(day => ({
        date: day.date,
        averageSeverity: Number((day.totalSeverity / day.count).toFixed(2))
    })).reverse(); // Assuming descending order from API, reverse for chronological chart

    // 2. Process data for Pass/Fail by Level (Bar Chart)
    const byLevel = attempts.reduce((acc, curr) => {
        const level = curr.speech_level;
        if (!acc[level]) {
            acc[level] = { level, passed: 0, failed: 0 };
        }
        if (curr.is_pass) acc[level].passed += 1;
        else acc[level].failed += 1;
        return acc;
    }, {} as Record<string, { level: string, passed: number, failed: number }>);

    const levelData = Object.values(byLevel);

    return (
        <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                    <TrendingDown className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Speech Analytics</h1>
                    <p className="mt-1 text-slate-500">Deep dive into pronunciation accuracy and historical progress</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Chart 1: Severity Trend */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Pronunciation Severity Trend</h2>
                        <p className="text-sm text-slate-500">Lower is better. Tracking average error severity per day.</p>
                    </div>
                    <div className="h-[300px] w-full">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 1]} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="averageSeverity" name="Avg. Severity" stroke="#8b5cf6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">Not enough data yet</div>
                        )}
                    </div>
                </div>

                {/* Chart 2: Pass/Fail by Level */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Success Rate by Difficulty</h2>
                        <p className="text-sm text-slate-500">Comparing successful vs failed attempts per speech level.</p>
                    </div>
                    <div className="h-[300px] w-full">
                        {levelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={levelData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '10px' }} />
                                    <Bar dataKey="passed" name="Success" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="failed" name="Needs Practice" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">Not enough data yet</div>
                        )}
                    </div>
                </div>

            </div>

            {/* History Log */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Recent Attempt History</h2>
                        <p className="text-sm text-slate-500">A detailed log of the last 20 practice attempts.</p>
                    </div>
                    <History className="w-6 h-6 text-slate-400" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-medium rounded-tl-xl rounded-bl-xl">Date & Time</th>
                                <th className="px-6 py-4 font-medium">Target</th>
                                <th className="px-6 py-4 font-medium">Game</th>
                                <th className="px-6 py-4 font-medium">Result</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium rounded-tr-xl rounded-br-xl">Severity Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.slice(0, 20).map((attempt, index) => (
                                <tr key={attempt.id || index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                        {new Date(attempt.created_at).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        {attempt.expected_word || attempt.expected_sound ? (
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800">{attempt.expected_word || attempt.expected_sound}</span>
                                                {attempt.transcribed_word && attempt.transcribed_word !== attempt.expected_word && (
                                                    <span className="text-xs text-slate-400">Heard: {attempt.transcribed_word}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Unknown</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 capitalize text-slate-700 font-medium text-sm">
                                        {attempt.game_type ? attempt.game_type.replace(/_/g, ' ') : attempt.speech_level}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${attempt.is_pass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {attempt.is_pass ? 'Passed' : 'Needs Practice'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            {attempt.error_type ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 capitalize">
                                                    {attempt.error_type}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                            {attempt.confidence !== null && attempt.confidence !== undefined && (
                                                <span className="text-[10px] text-slate-400" title="Audio Confidence Score">
                                                    Conf: {Math.round(attempt.confidence * 100)}%
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {attempt.severity !== null ? (
                                            <div className="flex items-center space-x-2 w-32">
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${attempt.severity > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(100, attempt.severity * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500 w-8 text-right">
                                                    {attempt.severity.toFixed(2)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {attempts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 bg-slate-50/50 rounded-xl mt-2 block">
                                        No attempts recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Mock Data Generator for UI Testing ---
function generateMockData(): AttemptData[] {
    const data: AttemptData[] = [];
    const now = new Date();

    const words = ['Rabbit', 'Snake', 'Train', 'Blue', 'Car'];
    const sounds = ['R', 'S', 'TR', 'BL', 'K'];
    const games = ['pancake_maker', 'flashcards', 'story_time'];
    const errors = ['substitution', 'omission', 'distortion', 'addition'];

    // Generate 30 mock attempts over the last 14 days
    for (let i = 0; i < 30; i++) {
        const d = new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000);
        const level = Math.random() > 0.6 ? 'intermediate' : 'beginner';
        // Beginners pass more often, intermediates fail more often in this mock
        const isPass = level === 'beginner' ? Math.random() > 0.3 : Math.random() > 0.6;
        // Severity is higher on fails
        const severity = isPass ? (Math.random() * 0.4) : (0.5 + Math.random() * 0.5);

        // 30% chance to be "old data" without the new fields
        const isOldData = Math.random() > 0.7;
        const targetWord = words[Math.floor(Math.random() * words.length)];

        data.push({
            id: i,
            created_at: d.toISOString(),
            is_pass: isPass,
            severity,
            speech_level: level,
            expected_word: isOldData ? null : targetWord,
            expected_sound: isOldData ? null : sounds[Math.floor(Math.random() * sounds.length)],
            transcribed_word: isOldData ? null : (isPass ? targetWord : 'Wabbit'),
            error_type: isOldData || isPass ? null : errors[Math.floor(Math.random() * errors.length)],
            confidence: isOldData ? null : 0.6 + (Math.random() * 0.35),
            game_type: isOldData ? null : games[Math.floor(Math.random() * games.length)],
        });
    }
    // Sort descending by date
    return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
