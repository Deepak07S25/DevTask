import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { Mail, Lock, ArrowRight, Loader2, Zap } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data.token, res.data.user);
      setSuccess('Login successful! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6 py-12 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-sky-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 mb-6 shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform">
            <Zap size={32} className="text-white fill-current" />
          </Link>
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">Welcome Back</h2>
          <p className="text-zinc-400 text-lg">Sign in to DevTask to manage your projects.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-8 md:p-10 rounded-3xl shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-3 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              <Zap size={18} />
              {success}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 pl-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="w-full pl-11 pr-4 py-4 bg-zinc-950/50 rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all duration-300"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 pl-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-sky-400 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-4 py-4 bg-zinc-950/50 rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all duration-300"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <button 
            disabled={isLoading || success}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl mt-8 transition-all hover:-translate-y-0.5 shadow-lg shadow-sky-500/25 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading && !success ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Signing In...
              </>
            ) : success ? (
              <>
                Success!
                <ArrowRight size={20} />
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-zinc-500 text-center mt-8 text-sm">
          New to DevTask? <Link to="/register" className="text-sky-400 font-semibold hover:text-sky-300 hover:underline transition-colors">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;