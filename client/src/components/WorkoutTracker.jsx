import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Activity, Plus, Trash2, Dumbbell, Calendar, Clipboard } from 'lucide-react';

export default function WorkoutTracker() {
  const [workoutName, setWorkoutName] = useState('');
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState([{ exercise_name: '', weight: '', reps: '' }]);
  
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- FETCH PAST WORKOUTS ---
  const fetchWorkoutHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      // 🚀 Pointing directly to your configured backend history route
      const response = await axios.get(`${API_BASE_URL}/workout/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to load workout logs:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  // --- DYNAMIC SET MANAGEMENT ---
  const handleAddSet = () => {
    setSets([...sets, { exercise_name: '', weight: '', reps: '' }]);
  };

  const handleRemoveSet = (index) => {
    const updatedSets = sets.filter((_, i) => i !== index);
    setSets(updatedSets);
  };

  const handleSetChange = (index, field, value) => {
    const updatedSets = [...sets];
    updatedSets[index][field] = value;
    setSets(updatedSets);
  };

  // --- SUBMIT LOG TO CLOUD ---
  const handleLogWorkout = async (e) => {
    e.preventDefault();
    if (!workoutName.trim() || loading) return;

    // Validate sets have text/numbers
    const formattedSets = sets.map(s => ({
      exercise_name: s.exercise_name,
      weight: parseFloat(s.weight) || 0,
      reps: parseInt(s.reps) || 0
    })).filter(s => s.exercise_name.trim() !== '');

    if (formattedSets.length === 0) {
      setError('Please add at least one valid exercise set.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      // 🚀 Pointing directly to your configured backend logging route
      await axios.post(
        `${API_BASE_URL}/workout/log`,
        { name: workoutName, notes: notes || null, sets: formattedSets },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setWorkoutName('');
      setNotes('');
      setSets([{ exercise_name: '', weight: '', reps: '' }]);
      fetchWorkoutHistory(); // Live reload timeline!
    } catch (err) {
      // 🚀 ADD This console.log to see the exact URL and failure reason:
      console.log("❌ EXACT REQUEST URL:", err.config?.url);
      console.log("❌ ERROR STATUS CODE:", err.response?.status);
      console.log("❌ FULL ERROR OBJECT:", err);

      setError(err.response?.data?.detail || 'Failed to log your workout session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Logger input container */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Dumbbell className="text-emerald-400 w-5 h-5" /> Log Workout Routine
        </h3>
        <p className="text-gray-400 text-sm mb-6">Track your exercises, sets, weights, and reps below.</p>

        <form onSubmit={handleLogWorkout} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Workout Routine Name (e.g., Push Day)"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              required
            />
            <input
              type="text"
              placeholder="Session Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Dynamic Inputs Array */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Exercise Sets</p>
            {sets.map((set, index) => (
              <div key={index} className="flex gap-2 items-center bg-gray-950 border border-gray-800 p-3 rounded-xl">
                <input
                  type="text"
                  placeholder="Exercise Name"
                  value={set.exercise_name}
                  onChange={(e) => handleSetChange(index, 'exercise_name', e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="number"
                  placeholder="lbs/kgs"
                  value={set.weight}
                  onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                  className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm text-center"
                  required
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={set.reps}
                  onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                  className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm text-center"
                  required
                />
                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(index)}
                    className="text-red-400 hover:text-red-300 p-2 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddSet}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium pt-1 pl-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Set
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !workoutName.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-gray-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? 'Saving Workout Routine...' : 'Save Workout Session'}
          </button>
        </form>

        {success && <p className="text-emerald-400 text-sm font-medium mt-4 text-center">🎉 Workout logged successfully!</p>}
        {error && <p className="text-red-400 text-sm font-medium mt-4 text-center">{error}</p>}
      </div>

      {/* --- WORKOUT TIMELINE FEED --- */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="text-emerald-400 w-5 h-5" /> Training Logs History
        </h3>

        {historyLoading && <p className="text-gray-500 text-sm italic">Loading history records...</p>}
        {!historyLoading && history.length === 0 && (
          <p className="text-gray-500 text-sm italic">No workout routines logged yet. Record your first session above!</p>
        )}

        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
          {history.map((workout) => (
            <div key={workout.id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-wide">{workout.name}</p>
                  {workout.notes && <p className="text-xs text-gray-400 italic mt-0.5">"{workout.notes}"</p>}
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(workout.timestamp).toLocaleDateString()} at {new Date(workout.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Individual mapped performance rows inside the routine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-900">
                {workout.exercise_sets?.map((set) => (
                  <div key={set.id} className="bg-gray-900/60 border border-gray-800/40 p-2.5 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium flex items-center gap-1.5">
                      <Clipboard className="w-3.5 h-3.5 text-emerald-500/70" /> {set.exercise_name}
                    </span>
                    <span className="text-gray-400 font-mono">
                      Set {set.set_number}: <strong className="text-white">{set.weight}</strong> lbs × <strong className="text-emerald-400">{set.reps}</strong> reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}