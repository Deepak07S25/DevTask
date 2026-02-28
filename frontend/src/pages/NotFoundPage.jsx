import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      {/* Glowing 404 */}
      <div className="relative mb-6 inline-block">
        <span className="text-[120px] font-black text-zinc-800 leading-none select-none">404</span>
        <span className="absolute inset-0 text-[120px] font-black text-sky-500/20 leading-none blur-2xl select-none">404</span>
      </div>

      <h1 className="text-3xl font-black text-white mb-3">Page Not Found</h1>
      <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 px-5 py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-lg transition text-sm font-medium">
          <ArrowLeft size={16} /> Go Back
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition text-sm font-bold">
          <Home size={16} /> Dashboard
        </Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
