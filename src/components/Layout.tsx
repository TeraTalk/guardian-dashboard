import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, UserCircle, LogOut, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { label: 'Overview', path: '/', icon: Home },
        { label: 'Profile', path: '/profile', icon: UserCircle },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <Heart className="w-6 h-6 text-indigo-500 fill-indigo-100 mr-3" />
                    <span className="text-lg font-bold text-slate-800 tracking-tight">Guardian</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )
                            }
                        >
                            <item.icon className={cn("flex-shrink-0 w-5 h-5 mr-3 transition-colors duration-200")} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="ml-3 truncate">
                            <p className="text-sm font-medium text-slate-700 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 sticky top-0 z-10 md:hidden">
                    <Heart className="w-6 h-6 text-indigo-500 fill-indigo-100 mr-3" />
                    <span className="text-lg font-bold text-slate-800 tracking-tight">Guardian</span>
                </header>
                <div className="max-w-6xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
