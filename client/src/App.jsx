import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import NutritionTracker from './components/NutritionTracker';
import WorkoutTracker from './components/WorkoutTracker';
import AICoach from './components/AICoach';
import { Utensils, Dumbbell, MessageSquareShare, LogOut, ShieldCheck } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('nutrition');

  // Check login state immediately on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  // Guard Clause: If not logged in, force Login screen layout
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation Panel */}
      <aside className="w-full md:w-64 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 p-6 flex flex-col justify-between gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <h1 className="text-2xl font-black tracking-wider text-emerald-400">FitTrack AI</h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">v1.0</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition focus:outline-none ${
                activeTab === 'nutrition'
                  ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/10'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Nutrition Tracker
            </button>

            <button
              onClick={() => setActiveTab('workout')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition focus:outline-none ${
                activeTab === 'workout'
                  ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/10'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Workout Tracker
            </button>

            <button
              onClick={() => setActiveTab('coach')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition focus:outline-none ${
                activeTab === 'coach'
                  ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/10'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
              }`}
            >
              <MessageSquareShare className="w-4 h-4" />
              AI Fitness Coach
            </button>
          </nav>
        </div>

        {/* User Account Controls */}
        <div className="pt-4 border-t border-gray-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 px-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
            Session Secured (JWT)
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-950/20 rounded-xl transition focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Interactive Screen Segment */}
      <main className="flex-grow p-6 md:p-10 bg-gray-950 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'nutrition' && <NutritionTracker />}
          {activeTab === 'workout' && <WorkoutTracker />}
          {activeTab === 'coach' && <AICoach />}
        </div>
      </main>

    </div>
  );
}