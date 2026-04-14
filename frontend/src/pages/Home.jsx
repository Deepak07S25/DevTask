import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle2, 
  KanbanSquare, 
  BarChart3, 
  FileText, 
  Zap, 
  LayoutDashboard,
  Users
} from "lucide-react";

const FeatureCard = ({ icon, title, description }) => {
  const IconComponent = icon;
  return (
    <div className="group relative p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-800/50 hover:border-sky-500/30 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
      <div className="h-12 w-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500/20 transition-all duration-300">
        <IconComponent size={24} strokeWidth={2} />
      </div>
      <h3 className="text-xl font-bold text-zinc-100 mb-3 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
        {description}
      </p>
    </div>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-sky-500/30 font-sans overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}></div>
      </div>

      {/* Navbar Placeholder */}
      <nav className="relative z-10 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-white fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">DevTask</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors">Log In</Link>
            <Link to="/register" className="text-sm font-bold bg-white text-zinc-950 px-5 py-2.5 rounded-full hover:bg-zinc-200 hover:scale-105 transition-all">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm font-medium text-sky-400 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
            The ultimate project management tool
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 tracking-tighter mb-8 leading-[1.1]">
            Build Software <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-500">Faster Together.</span>
          </h1>
          
          <p className="text-zinc-400 text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed">
            Organize tasks, track progress across sprints, and ship incredible products with our intuitive, lightning-fast agile workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all hover:-translate-y-1"
            >
              Start Building for Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center text-white px-8 py-4 rounded-full font-bold text-lg border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-md transition-all hover:-translate-y-1"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 px-6 bg-zinc-950/50 border-y border-zinc-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Everything you need to ship.</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Powerful features designed to keep your development team aligned, focused, and moving at top speed.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={KanbanSquare}
              title="Intuitive Kanban Boards"
              description="Visualize workflows and move tasks instantly with drag-and-drop boards designed for rapid organization."
            />
            <FeatureCard 
              icon={LayoutDashboard}
              title="Agile Sprints"
              description="Plan, execute, and track focused iterations of work. Manage your backlog effectively to optimize scope."
            />
            <FeatureCard 
              icon={FileText}
              title="Rich Task Details"
              description="Write comprehensive tickets using full Markdown support, capturing technical details seamlessly."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Real-time Analytics"
              description="Gain instant insights with beautiful dashboards showing task distribution, completion rates, and sprint health."
            />
            <FeatureCard 
              icon={Users}
              title="Team Collaboration"
              description="Assign tasks, leave context-rich comments, and keep every stakeholder aligned on project goals."
            />
            <FeatureCard 
              icon={CheckCircle2}
              title="Developer Focused"
              description="No clutter. Built with a sleek dark-mode native interface that developers actually want to use."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 p-12 md:p-20 rounded-[3rem] border border-zinc-700/50 backdrop-blur-md overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10">Ready to transform your workflow?</h2>
          <p className="text-xl text-zinc-400 mb-10 relative z-10 max-w-2xl mx-auto">
            Join thousands of developers turning chaos into order with DevTask Mastery.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center bg-white text-zinc-950 px-10 py-4 rounded-full font-bold text-xl hover:bg-zinc-200 hover:scale-105 transition-all shadow-xl shadow-white/10 relative z-10"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 py-12 px-6 bg-zinc-950 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6 opacity-80">
            <Zap size={20} className="text-sky-500 fill-sky-500" />
            <span className="text-xl font-bold tracking-tight">DevTask</span>
          </div>
          <p className="text-zinc-500 text-sm mb-6">
            &copy; {new Date().getFullYear()} DevTask Mastery. All rights reserved.
          </p>
          <div className="flex gap-6 text-zinc-500">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

