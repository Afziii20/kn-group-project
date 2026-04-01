import { useState } from 'react';
import { loginAdmin } from './api'; // Must match api.js exactly

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // 1. Here is the function we are defining:
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await loginAdmin(email, password);

            // Save it exactly as 'admin_token'
            localStorage.setItem('admin_token', data.access_token);

            // Send them to the dashboard
            window.location.href = '/admin';
        } catch (err) {
            setError("Login failed! Check your email and password.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-black text-center mb-8 text-gray-900">Admin Access</h2>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center mb-6 animate-pulse">
            {error}
            </div>
        )}

        {/* 2. Here is where we call it (must match the name above exactly!) */}
        <form onSubmit={handleSubmit} className="space-y-6">
        <div>
        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
        <input
        type="email"
        required
        className="w-full p-4 mt-1 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
        placeholder="admin@kngroup.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        />
        </div>

        <div>
        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Password</label>
        <input
        type="password"
        required
        className="w-full p-4 mt-1 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        />
        </div>

        <button
        type="submit"
        className="w-full bg-gray-900 text-white p-4 rounded-2xl font-bold hover:bg-orange-600 transition-colors shadow-lg"
        >
        Secure Login
        </button>
        </form>
        </div>
        </div>
    );
}
