import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6">
        DevTask <span className="text-sky-500">Mastery.</span>
      </h1>
      <p className="text-zinc-400 text-xl max-w-2xl mb-10">
        The ultimate project management tool for developers. Organise tasks,
        track progress, and build faster.
      </p>
      <div className="flex gap-4">
        <Link
          to="/register"
          className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105"
        >
          Get Started for Free
        </Link>
        <Link
          to="/login"
          className="border border-zinc-700 hover:bg-zinc-800 text-white px-8 py-4 rounded-full font-bold text-lg transition-all"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Home;
