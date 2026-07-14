import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      if (isRegistering) {
        await axios.post(`${API_BASE_URL}/auth/register`, { username, password });
        setMessage('Registration successful! Please log in.');
        setIsRegistering(false);
        setPassword('');
      } else {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await axios.post(`${API_BASE_URL}/auth/login`, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        onLoginSuccess();
      }
    } catch (err) {
      console.log("THE ACTUAL FRONTEND ERROR:", err);
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  // --- NEW: HANDLES GUEST LOGIN STRATEGY ---
  const handleGuestLogin = async () => {
    setMessage('');
    setError('');
    setIsLoadingGuest(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/guest-login`);
      const { access_token } = response.data;
      
      // Save the generated ephemeral guest token
      localStorage.setItem('token', access_token);
      onLoginSuccess();
    } catch (err) {
      console.log("THE ACTUAL FRONTEND GUEST ERROR:", err);
      setError(err.response?.data?.detail || 'Guest entry failed. Please try again.');
    } finally {
      setIsLoadingGuest(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-extrabold text-center text-emerald-400 mb-2">FitTrack AI</h2>
        <p className="text-gray-400 text-center text-sm mb-8">
          {isRegistering ? 'Create your fitness account' : 'Sign in to track your metrics'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
              placeholder="••••••••"
            />
          </div>

          {message && <p className="text-emerald-400 text-sm font-medium text-center">{message}</p>}
          {error && <p className="text-red-400 text-sm font-medium text-center">{error}</p>}

          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20">
            {isRegistering ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {/* --- NEW: VISUAL SEPARATOR & GUEST BUTTON --- */}
        {!isRegistering && (
          <>
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoadingGuest}
              className="w-full bg-gray-800 hover:bg-gray-750 text-emerald-400 border border-gray-700 hover:border-emerald-500/30 font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {isLoadingGuest ? 'Creating Profile...' : 'Explore as Guest'}
            </button>
          </>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setMessage(''); }}
            className="text-sm text-emerald-400 hover:underline focus:outline-none"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}