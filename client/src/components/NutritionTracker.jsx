import React, { useState, useEffect } from 'react'; // 🚀 Added useEffect to imports
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Utensils, Sparkles, Flame, Apple, Activity, Droplet } from 'lucide-react';

export default function NutritionTracker() {
  const [mealText, setMealText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // 🚀 History tracking states
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 🚀 Fetch past meals from backend GET /meals
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/nutrition/meals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to load nutrition history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 🚀 Trigger fetch when component mounts
  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!mealText.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token'); 

      const response = await axios.post(
        `${API_BASE_URL}/nutrition/analyze`,
        { text_input: mealText },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setResult(response.data);
      setMealText('');
      fetchHistory(); // 🚀 Refresh history feed seamlessly!
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to parse meal log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Utensils className="text-emerald-400 w-5 h-5" /> AI Nutrition Logger
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Describe what you ate in natural language (e.g., "I had two fried eggs and a slice of whole wheat toast for breakfast").
        </p>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <textarea
            value={mealText}
            onChange={(e) => setMealText(e.target.value)}
            placeholder="Type your meal here..."
            rows="3"
            className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !mealText.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-gray-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Analyzing with AI...' : 'Analyze & Log Meal'}
          </button>
        </form>

        {error && <p className="text-red-400 text-sm font-medium mt-4 text-center">{error}</p>}
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl animate-fadeIn">
          <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            Success! Saved to Cloud Log
          </h4>

          {/* Macro Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Calories</p>
                <p className="text-xl font-bold text-white">{result.total_calories} kcal</p>
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg text-red-400">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Protein</p>
                <p className="text-xl font-bold text-white">{result.total_protein}g</p>
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Carbs</p>
                <p className="text-xl font-bold text-white">{result.total_carbs}g</p>
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-400">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Fats</p>
                <p className="text-xl font-bold text-white">{result.total_fat}g</p>
              </div>
            </div>
          </div>

          {/* Upgraded Itemized Breakdown List */}
          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider pl-1">
              AI Identified Items
            </p>
            <div className="space-y-2">
              {result.food_items?.map((item, index) => (
                <div 
                  key={item.id || index} 
                  className="bg-gray-950 border border-gray-800 p-3 rounded-xl flex justify-between items-center text-sm"
                >
                  <div>
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="text-gray-500 text-xs ml-2">({item.serving_size})</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 font-mono">
                    <span className="text-orange-400 font-bold">{item.calories} kcal</span>
                    <span>P: {item.protein}g</span>
                    <span>C: {item.carbs}g</span>
                    <span>F: {item.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORICAL MEALS FEED --- */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="text-emerald-400 w-5 h-5" /> Your Nutrition History
        </h3>

        {historyLoading && <p className="text-gray-500 text-sm italic">Loading your history log...</p>}

        {!historyLoading && history.length === 0 && (
          <p className="text-gray-500 text-sm italic">No meals logged yet today. Describe your first meal above!</p>
        )}

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {history.map((meal) => (
            <div key={meal.id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-white capitalize">
                    {meal.raw_text_input || "Logged Meal"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meal.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3 text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800 font-mono text-gray-400">
                  <span className="text-orange-400 font-bold">{meal.total_calories} kcal</span>
                  <span>P: {meal.total_protein}g</span>
                  <span>C: {meal.total_carbs}g</span>
                  <span>F: {meal.total_fat}g</span>
                </div>
              </div>

              {/* Sub-list of individual items matching the entry */}
              <div className="pl-3 border-l-2 border-gray-800 space-y-1">
                {meal.food_items?.map((item) => (
                  <p key={item.id} className="text-xs text-gray-400">
                    • <span className="text-gray-300 font-medium">{item.name}</span> ({item.serving_size}) — <span className="text-orange-400/80">{item.calories} kcal</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}