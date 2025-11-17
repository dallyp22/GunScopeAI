import { Link, useLocation } from 'wouter';

export function TacticalNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="h-12 border-b border-[#2a3040] bg-[#1a1d23] flex items-center justify-between px-6">
      {/* Logo/Title */}
      <div className="flex items-center gap-3">
        <img 
          src="/gunscope-logo.png" 
          alt="GunScope AI" 
          className="h-8 w-8 object-contain"
        />
        <div>
          <h1 className="text-base font-semibold text-white">
            GunScope AI
          </h1>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <a className={`pill-tab ${isActive('/') ? 'pill-tab-active' : ''}`}>
            Dashboard
          </a>
        </Link>

        <Link href="/map">
          <a className={`pill-tab ${isActive('/map') ? 'pill-tab-active' : ''}`}>
            Map
          </a>
        </Link>

        <Link href="/list">
          <a className={`pill-tab ${isActive('/list') ? 'pill-tab-active' : ''}`}>
            List
          </a>
        </Link>

        <Link href="/sources">
          <a className={`pill-tab ${isActive('/sources') ? 'pill-tab-active' : ''}`}>
            Sources
          </a>
        </Link>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[#10B981] rounded-full subtle-pulse" />
        <span className="text-xs text-[#10B981] font-medium">Live</span>
      </div>
    </div>
  );
}
