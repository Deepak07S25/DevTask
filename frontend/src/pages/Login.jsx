import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useContext(AuthContext); // Get the login function from context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data.token, res.data.user); // Save token + user info
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || "Invalid Credentials");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-zinc-500 mb-8">Enter your credentials to access your tasks.</p>
        
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email Address" 
            className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-white focus:border-sky-500 outline-none transition"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" placeholder="Password" 
            className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-white focus:border-sky-500 outline-none transition"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        <button className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl mt-8 transition-all shadow-lg shadow-sky-900/20">
          Sign In
        </button>
        
        <p className="text-zinc-500 text-center mt-6">
          New here? <Link to="/register" className="text-sky-500 hover:underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;