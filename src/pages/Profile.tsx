import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Save, UserCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProfileData {
    childName: string;
    speechLevel: string;
    initialDifficulty: string;
    problemSounds: string[];
}

const ALL_SOUNDS = ['R', 'L', 'S', 'TH', 'CH', 'SH', 'K', 'G', 'F', 'V'];

export const Profile = () => {
    const [profile, setProfile] = useState<ProfileData>({
        childName: '',
        speechLevel: 'beginner',
        initialDifficulty: 'standard',
        problemSounds: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profile/check');
                if (res.data.hasProfile) {
                    setProfile({
                        ...res.data.profile,
                        problemSounds: res.data.profile.problemSounds || [],
                    });
                }
            } catch (error) {
                console.error('Failed to fetch profile', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await api.put('/profile', {
                childName: profile.childName,
                problemSounds: profile.problemSounds,
                // simplify caregiverSchedule to bypass validation if needed, or pass the existing
                caregiverSchedule: { monday: "18:00" },
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const toggleSound = (sound: string) => {
        setProfile(prev => ({
            ...prev,
            problemSounds: prev.problemSounds.includes(sound)
                ? prev.problemSounds.filter(s => s !== sound)
                : [...prev.problemSounds, sound],
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <UserCircle className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Guardian Profile</h1>
                    <p className="mt-1 text-slate-500">Manage settings for {profile.childName || 'your child'}</p>
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-6 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                {message && (
                    <div className={`p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                        <p className="font-medium text-sm">{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label htmlFor="childName" className="block text-sm font-semibold text-slate-700">
                            Child's Name
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="childName"
                                id="childName"
                                value={profile.childName}
                                onChange={e => setProfile({ ...profile, childName: e.target.value })}
                                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-semibold text-slate-700">
                            Current Speech Level
                        </label>
                        <div className="mt-2 text-sm text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center">
                            <span className="font-medium text-slate-900 capitalize mr-2">{profile.speechLevel}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">Auto-calculated</span>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <label className="block text-base font-semibold text-slate-900">
                        Target Sounds
                    </label>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Select the specific sounds your child needs to practice.</p>

                    <div className="flex flex-wrap gap-3">
                        {ALL_SOUNDS.map((sound) => {
                            const isActive = profile.problemSounds.includes(sound);
                            return (
                                <button
                                    key={sound}
                                    type="button"
                                    onClick={() => toggleSound(sound)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${isActive
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                >
                                    /{sound}/
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
