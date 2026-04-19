import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [liquidCash, setLiquidCash] = useState('100000');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp
        ? { email, password, name, initialCash: parseFloat(liquidCash) }
        : { email, password };

      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');

      login(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] p-8 shadow-sm border border-[#e5e7eb] flex flex-col items-center">
        
        {/* Logo */}
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-md">
          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#111] mb-2 tracking-tight">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-[#666] text-sm mb-8 font-medium text-center">
          {isSignUp ? "Start building long-term wealth" : "Sign in to your portfolio"}
        </p>

        {error && (
          <div className="w-full bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          {isSignUp && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#333] mb-2 pl-1">Full Name</label>
              <input 
                type="text" required value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name" 
                className="w-full bg-white border border-[#e5e7eb] rounded-xl py-3 px-4 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#333] mb-2 pl-1">Email</label>
            <input 
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com" 
              className="w-full bg-white border border-[#e5e7eb] rounded-xl py-3 px-4 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#333] mb-2 pl-1">Password</label>
            <input 
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-white border border-[#e5e7eb] rounded-xl py-3 px-4 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all"
            />
          </div>

          {isSignUp && (
            <div className="mb-8">
              <label className="block text-sm font-semibold text-[#333] mb-2 pl-1">Starting Capital ($)</label>
              <input 
                type="number" value={liquidCash}
                onChange={e => setLiquidCash(e.target.value)}
                className="w-full bg-white border border-[#e5e7eb] rounded-xl py-3 px-4 text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all"
              />
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-[#111] text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-8 text-sm text-[#666] font-medium">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-[#111] font-bold hover:underline"
          >
            {isSignUp ? "Sign in" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
