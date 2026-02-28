import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Sends data to your Node.js backend
      await API.post('/auth/register', formData);
      alert("Account created successfully!");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2">Join DevTask</h2>
        <p className="text-zinc-500 mb-8">Start managing your projects today.</p>
        
        <div className="space-y-4">
          <input 
            type="text" placeholder="Full Name" 
            className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-white focus:border-sky-500 outline-none transition"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
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

        <button className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl mt-8 transition-colors shadow-lg shadow-sky-900/20">
          Create Account
        </button>
        
        <p className="text-zinc-500 text-center mt-6">
          Already have an account? <Link to="/login" className="text-sky-500 hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;