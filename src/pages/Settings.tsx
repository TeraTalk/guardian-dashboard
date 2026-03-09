import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bell, Save, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';

interface NotificationPreferences {
    enabled: boolean;
    notification_times: string[];
}

export const Settings: React.FC = () => {
    const [prefs, setPrefs] = useState<NotificationPreferences>({ enabled: true, notification_times: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await api.get('/notification_preferences').catch(() => null);
                if (res?.data) {
                    setPrefs({
                        enabled: res.data.enabled ?? true,
                        notification_times: res.data.notification_times || [],
                    });
                }
            } catch (err) {
                console.error('Failed to load notification preferences', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrefs();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // The backend uses a PUT endpoint for updates
            await api.put('/notification_preferences', prefs);
            setMessage({ type: 'success', text: 'Notification preferences updated!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    const addTime = () => {
        setPrefs(p => ({ ...p, notification_times: [...p.notification_times, "12:00"] }));
    };

    const updateTime = (index: number, val: string) => {
        const copy = [...prefs.notification_times];
        copy[index] = val;
        setPrefs({ ...prefs, notification_times: copy });
    };

    const removeTime = (index: number) => {
        const copy = [...prefs.notification_times];
        copy.splice(index, 1);
        setPrefs({ ...prefs, notification_times: copy });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Bell className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
                    <p className="mt-1 text-slate-500">Manage when you are reminded for practice sessions</p>
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-6 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                {message && (
                    <div className={`p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                        <p className="font-medium text-sm">{message.text}</p>
                    </div>
                )}

                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Push Notifications</h3>
                        <p className="text-sm text-slate-500">Receive reminders on your devices</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={prefs.enabled}
                            onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className={`pt-4 transition-opacity duration-300 ${prefs.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-base font-semibold text-slate-900">
                            Daily Schedule
                        </label>
                        <button
                            type="button"
                            onClick={addTime}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Time
                        </button>
                    </div>

                    {prefs.notification_times.length === 0 ? (
                        <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-500">
                            No active schedule. Add a time to receive daily reminders.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {prefs.notification_times.map((time, index) => (
                                <div key={index} className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => updateTime(index, e.target.value)}
                                        className="bg-transparent border-none text-slate-700 font-medium focus:ring-0 flex-1 outline-none appearance-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeTime(index)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
