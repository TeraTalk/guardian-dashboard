import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { 
    Stethoscope, Users, Calendar, LogOut, Package as PkgIcon, 
    CheckCircle, XCircle, Plus, Activity, Clock, UserCircle, Upload,
    Send, ArrowLeft
} from 'lucide-react';

interface Booking {
    id: string;
    guardian_id: string;
    package_id: string;
    status: string;
    preferred_schedule: any;
    created_at: string;
    therapist_packages?: {
        title: string;
        duration_months: number;
    };
    therapist_profiles?: {
        full_name: string;
    }
}

interface PatientProfile {
    user_id: string;
    child_name: string;
    child_age: number;
    speech_level: string;
}

export const TherapistDashboardHome: React.FC = () => {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'requests' | 'patients' | 'profile'>('overview');
    
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [patients, setPatients] = useState<PatientProfile[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // New Package Form State
    const [creatingPkg, setCreatingPkg] = useState(false);
    const [pkgTitle, setPkgTitle] = useState('');
    const [pkgDuration, setPkgDuration] = useState(3);
    const [pkgPrice, setPkgPrice] = useState(0);

    // Profile State
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        clinicName: '',
        specialty: '',
        bio: '',
        isAcceptingPatients: true,
        avatarBase64: '',
        avatarPreview: ''
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Monitoring State
    const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
    const [patientActivity, setPatientActivity] = useState<any[]>([]);
    const [patientFeedback, setPatientFeedback] = useState<any[]>([]);
    const [newFeedback, setNewFeedback] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);

    useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            try {
                // Fetch basic packages + bookings
                const [bRes, pRes, pkgRes] = await Promise.all([
                    api.get('/bookings'),
                    api.get('/bookings/patients'),
                    api.get(`/therapists/${user.id}/packages`)
                ]);
                setBookings(bRes.data || []);
                setPatients(pRes.data || []);
                setPackages(pkgRes.data || []);

                // Fetch Therapist Profile from the public endpoint using filtering
                const profileRes = await api.get('/therapists'); 
                // Since this is public and returns all active therapists, we can just search it,
                // Or wait, let's hit our DB direct if we need full profile.
                // In a perfect MVP, fetching from user context or writing a fresh GET /profile is better.
                // But we can extract what's available or set defaults. 
                const myProfile = profileRes.data?.find((t: any) => t.user_id === user.id);
                if (myProfile) {
                    setProfileData({
                        fullName: myProfile.full_name || user.fullName || '',
                        clinicName: myProfile.clinic_name || '',
                        specialty: myProfile.specialty || '',
                        bio: myProfile.bio || '',
                        isAcceptingPatients: myProfile.is_accepting_patients ?? true,
                        avatarBase64: '',
                        avatarPreview: myProfile.avatar_url || ''
                    });
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await api.put('/therapists/profile', profileData);
            alert('Profile successfully updated!');
        } catch (error) {
            alert('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setProfileData({ 
                    ...profileData, 
                    avatarBase64: event.target.result as string, 
                    avatarPreview: event.target.result as string 
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCreatePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/therapists/packages', {
                title: pkgTitle,
                durationMonths: pkgDuration,
                price: pkgPrice,
                therapyGoals: ['Initial Goal Assessment', 'Speech Execution Tracking']
            });
            alert('Package Created');
            setCreatingPkg(false);
            const refetch = await api.get(`/therapists/${user?.id}/packages`);
            setPackages(refetch.data || []);
        } catch (err) {
            alert('Failed to create package');
        }
    };

    const handleBookingUpdate = async (bookingId: string, status: string) => {
        try {
            // Give an arbitrary 3 month interval logic for the MVP
            const start = new Date();
            const end = new Date();
            end.setMonth(end.getMonth() + 3);
            
            await api.put(`/bookings/${bookingId}`, {
                status,
                startDate: start.toISOString(),
                endDate: end.toISOString()
            });
            alert(`Booking ${status}`);
            
            // Refetch
            const [bRes, pRes] = await Promise.all([
                api.get('/bookings'),
                api.get('/bookings/patients')
            ]);
            setBookings(bRes.data || []);
            setPatients(pRes.data || []);
        } catch (err) {
            alert('Failed to update booking status');
        }
    };

    const handleViewPatient = async (patient: PatientProfile) => {
        setSelectedPatient(patient);
        try {
            const [actRes, feedRes] = await Promise.all([
                api.get(`/bookings/patients/${patient.user_id}/activity`),
                api.get(`/bookings/patients/${patient.user_id}/feedback`)
            ]);
            setPatientActivity(actRes.data || []);
            setPatientFeedback(feedRes.data || []);
        } catch (err) {
            console.error("Failed to load patient details", err);
        }
    };

    const handleSendFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeedback.trim() || !selectedPatient) return;
        
        const activeBooking = bookings.find(b => b.guardian_id === selectedPatient.user_id && b.status === 'active');
        if (!activeBooking) {
            alert('No active booking found. You can only send feedback via active bookings.');
            return;
        }

        setSendingFeedback(true);
        try {
            const res = await api.post(`/bookings/patients/${selectedPatient.user_id}/feedback`, {
                message: newFeedback,
                bookingId: activeBooking.id
            });
            setPatientFeedback([...patientFeedback, res.data]);
            setNewFeedback('');
        } catch (error) {
            alert('Failed to send feedback');
        } finally {
            setSendingFeedback(false);
        }
    };

    const pendingBookings = bookings.filter(b => b.status === 'pending');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm">
                        <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Therapist Portal</h1>
                        <p className="text-xs text-slate-500 font-medium">Hello, Dr. {user?.fullName || 'Therapist'}</p>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
                {/* Sidebar Nav */}
                <nav className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                    {[
                        { id: 'overview', icon: Activity, label: 'Overview' },
                        { id: 'requests', icon: Clock, label: `Booking Requests (${pendingBookings.length})` },
                        { id: 'patients', icon: Users, label: `Active Patients (${patients.length})` },
                        { id: 'packages', icon: PkgIcon, label: 'My Packages' },
                        { id: 'profile', icon: UserCircle, label: 'My Profile' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                                activeTab === tab.id 
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 font-medium animate-pulse">Loading Workspace...</div>
                    ) : selectedPatient ? (
                        // PATIENT DRILL-DOWN VIEW (50/50 Split)
                        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                            <button 
                                onClick={() => setSelectedPatient(null)}
                                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm w-fit mb-6 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                            </button>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-3xl shadow-inner">
                                    {selectedPatient.child_name?.[0] || '?'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{selectedPatient.child_name}'s Profile & Activity Map</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold border border-slate-200">Patient Data Link Secured</span>
                                        <p className="text-slate-500 font-medium text-sm">Age: {selectedPatient.child_age} • Context level: {selectedPatient.speech_level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                                {/* Left Side: Activity Timeline */}
                                <div className="bg-white border text-left border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[550px]">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-600"/> Application Event Logs</h3>
                                    </div>
                                    <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                                        {patientActivity.length === 0 ? (
                                            <p className="text-slate-500 text-center py-8">No recorded activity attempts found in the database for this child.</p>
                                        ) : (
                                            patientActivity.map(act => (
                                                <div key={act.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm transition-all hover:border-purple-200">
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                                            Gameplay Phonics Engine
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(act.created_at).toLocaleString()}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-bold shrink-0">
                                                        {act.is_pass ? (
                                                            <span className="text-green-700 bg-green-100 px-3 py-1 rounded-lg flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Success</span>
                                                        ) : (
                                                            <span className="text-red-700 bg-red-100 px-3 py-1 rounded-lg flex items-center gap-1"><XCircle className="w-4 h-4"/> Missed</span>
                                                        )}
                                                        {act.severity && <span className="text-slate-500 border border-slate-200 bg-white shadow-sm px-2 py-1 rounded-lg">Sev: {act.severity}</span>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: secure Feedback Threadings */}
                                <div className="bg-white border text-left border-slate-200 rounded-3xl shadow-sm flex flex-col h-[550px] overflow-hidden relative">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50 z-10 flex gap-2 items-center">
                                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Stethoscope className="w-5 h-5 text-indigo-600"/> Clinical Thread </h3>
                                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-200">w/ Guardian</span>
                                    </div>
                                    <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar flex flex-col z-0">
                                        {patientFeedback.length === 0 ? (
                                            <div className="text-center py-10 m-auto">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <UserCircle className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h4 className="font-bold text-slate-900 mb-2">No Thread History</h4>
                                                <p className="text-sm text-slate-500 max-w-xs mx-auto">Open a communication channel with the guardian to set weekly milestones.</p>
                                            </div>
                                        ) : (
                                            patientFeedback.map(fb => (
                                                <div key={fb.id} className={`max-w-[85%] p-4 shadow-sm relative ${fb.therapist_id === user?.id ? 'bg-purple-600 text-white self-end rounded-2xl rounded-tr-sm border border-purple-500' : 'bg-white border border-slate-200 text-slate-800 self-start rounded-2xl rounded-tl-sm'}`}>
                                                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{fb.message}</div>
                                                    <div className={`text-xs mt-3 flex items-center gap-1 font-medium ${fb.therapist_id === user?.id ? 'text-purple-200 justify-end' : 'text-slate-400 justify-start'}`}>
                                                        <Clock className="w-3 h-3"/> {new Date(fb.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <form onSubmit={handleSendFeedback} className="p-4 border-t border-slate-100 bg-slate-50 relative z-10">
                                        <input 
                                            value={newFeedback}
                                            onChange={e => setNewFeedback(e.target.value)}
                                            placeholder="Write your clinical advice..."
                                            className="w-full bg-white border border-slate-200 rounded-full py-4 pl-6 pr-16 outline-none focus:ring-2 focus:ring-purple-500 shadow-sm text-slate-700"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newFeedback.trim() || sendingFeedback}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-md"
                                        >
                                            <Send className="w-4 h-4 ml-[-2px]" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700">Pending Requests</h3><Clock className="text-amber-500 w-5 h-5"/></div>
                                            <p className="text-4xl font-extrabold text-slate-900">{pendingBookings.length}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700">Active Patients</h3><Users className="text-purple-500 w-5 h-5"/></div>
                                            <p className="text-4xl font-extrabold text-slate-900">{patients.length}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700">Active Packages</h3><PkgIcon className="text-indigo-500 w-5 h-5"/></div>
                                            <p className="text-4xl font-extrabold text-slate-900">{packages.length}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* REQUESTS TAB */}
                            {activeTab === 'requests' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Booking Requests</h2>
                                    {pendingBookings.length === 0 ? (
                                        <div className="bg-white border text-center border-slate-200 rounded-2xl p-12 shadow-sm text-slate-500">
                                            No pending booking requests.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingBookings.map(b => (
                                                <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                                            {b.therapist_packages?.title || 'Custom Package'} 
                                                            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Pending</span>
                                                        </h3>
                                                        <p className="text-sm text-slate-600 mt-1">Requested by Guardian ID: <span className="font-mono text-xs">{b.guardian_id.substring(0,8)}...</span></p>
                                                        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100">
                                                            <strong>Guardian Note:</strong> {b.preferred_schedule?.notes || 'No scheduling notes provided.'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button onClick={() => handleBookingUpdate(b.id, 'rejected')} className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                                                            <XCircle className="w-4 h-4"/> Reject
                                                        </button>
                                                        <button onClick={() => handleBookingUpdate(b.id, 'active')} className="px-5 py-2 flex items-center gap-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-sm shadow-green-600/30">
                                                            <CheckCircle className="w-4 h-4"/> Accept & Allocate Module
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PATIENTS TAB */}
                            {activeTab === 'patients' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Active Patients</h2>
                                    {patients.length === 0 ? (
                                        <div className="bg-white border text-center border-slate-200 rounded-2xl p-12 shadow-sm text-slate-500">
                                            You do not have any active patients.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {patients.map(p => (
                                                <div key={p.user_id} className="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-6 shadow-sm transition-all cursor-pointer group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xl group-hover:scale-110 transition-transform">
                                                            {p.child_name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-slate-900">{p.child_name || 'Patient'}</h3>
                                                            <p className="text-sm text-slate-500">Age: {p.child_age} • Level: {p.speech_level}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleViewPatient(p)}
                                                        className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-sm w-full hover:text-purple-700 transition-colors cursor-pointer"
                                                    >
                                                        <span className="text-purple-600 font-semibold flex items-center gap-1">View Activity & Map <ChevronRight className="w-4 h-4" /></span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PACKAGES TAB */}
                            {activeTab === 'packages' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Therapy Packages</h2>
                                        <button onClick={() => setCreatingPkg(!creatingPkg)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors">
                                            <Plus className="w-4 h-4" /> New Package
                                        </button>
                                    </div>

                                    {creatingPkg && (
                                        <form onSubmit={handleCreatePackage} className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
                                            <h3 className="font-bold text-purple-900 mb-4">Define a New Package</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-purple-700 mb-1">Package Title</label>
                                                    <input required value={pkgTitle} onChange={e=>setPkgTitle(e.target.value)} placeholder="e.g. 3-Month Intensive" className="w-full p-2.5 rounded-lg border border-purple-200 outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-purple-700 mb-1">Duration (Months)</label>
                                                    <input required type="number" value={pkgDuration} onChange={e=>setPkgDuration(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-purple-200 outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-purple-700 mb-1">Price ($)</label>
                                                    <input required type="number" value={pkgPrice} onChange={e=>setPkgPrice(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-purple-200 outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => setCreatingPkg(false)} className="px-4 py-2 text-sm font-bold text-purple-600 hover:bg-purple-100 rounded-xl">Cancel</button>
                                                <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm">Publish Package</button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {packages.map(pkg => (
                                            <div key={pkg.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-start relative overflow-hidden">
                                                <div className="absolute top-0 right-0 py-1 px-3 bg-purple-600 text-white font-bold text-xs rounded-bl-lg">
                                                    {pkg.duration_months} Months
                                                </div>
                                                <h3 className="font-bold text-lg text-slate-900 mb-1">{pkg.title}</h3>
                                                <p className="text-2xl font-extrabold text-purple-600 mb-4">${pkg.price}</p>
                                                <div className="text-sm font-bold text-slate-500 mb-2 mt-auto">Therapy Goals defined: {pkg.therapy_goals?.length || 0}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PROFILE TAB */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Public Portfolio</h2>
                                    <p className="text-sm text-slate-500 mb-6">Manage how Guardians see your profile in the directory.</p>
                                    
                                    <form onSubmit={handleSaveProfile} className="bg-white border text-left border-slate-200 rounded-2xl p-6 shadow-sm max-w-3xl space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2 mb-4">
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Profile Picture</label>
                                                <div className="flex items-center gap-4">
                                                    {profileData.avatarPreview ? (
                                                        <img src={profileData.avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm shrink-0" />
                                                    ) : (
                                                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                                                            <UserCircle className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                                        <Upload className="w-4 h-4" />
                                                        Upload Image
                                                        <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                                                <input 
                                                    value={profileData.fullName} 
                                                    onChange={e => setProfileData({...profileData, fullName: e.target.value})} 
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Clinic Name (or Independent)</label>
                                                <input 
                                                    value={profileData.clinicName} 
                                                    onChange={e => setProfileData({...profileData, clinicName: e.target.value})} 
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Specialty</label>
                                                <input 
                                                    value={profileData.specialty} 
                                                    onChange={e => setProfileData({...profileData, specialty: e.target.value})} 
                                                    placeholder="e.g. Speech-Language Pathologist, ABA Therapist"
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Detailed Bio</label>
                                                <textarea 
                                                    rows={5}
                                                    value={profileData.bio} 
                                                    onChange={e => setProfileData({...profileData, bio: e.target.value})} 
                                                    placeholder="Tell guardians about your experience, methods, and passion."
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                                                />
                                            </div>
                                            <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">Accepting New Patients</h4>
                                                    <p className="text-sm text-slate-500">Toggle this off if your schedule is currently full.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={profileData.isAcceptingPatients}
                                                        onChange={e => setProfileData({...profileData, isAcceptingPatients: e.target.checked})}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                                            <button 
                                                type="submit" 
                                                disabled={savingProfile}
                                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                                            >
                                                {savingProfile ? 'Saving...' : 'Save Portfolio'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// Quick stub missing icon fallback
const ChevronRight = ({ className }: { className?: string; }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
);
