import { Plus } from 'lucide-react';
import { Button } from '../../design-system';

const GREET = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const DashboardHero = ({ name, onNewProject }) => (
  <div className="flex items-center justify-between mb-7">
    <div>
      <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mb-0.5">
        {GREET()}{name ? `, ${name.split(' ')[0]}` : ''}.
      </h1>
      <p className="text-sm text-[var(--text-muted)]">
        Here's what needs your attention today.
      </p>
    </div>
    <Button
      variant="primary"
      size="md"
      icon={<Plus size={15} />}
      onClick={onNewProject}
    >
      New Project
    </Button>
  </div>
);

export default DashboardHero;
