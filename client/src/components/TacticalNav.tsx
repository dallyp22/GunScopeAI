import { Link, useLocation } from 'wouter';

export function TacticalNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="h-14 border-b border-[#00ff4133] bg-[#1a1f1d] scanlines flex items-center justify-between px-6">
      {/* Logo/Title */}
      <div className="flex items-center gap-3">
        <div className="text-2xl">🔫</div>
        <div>
          <h1 className="hud-text-bright text-lg font-bold uppercase tracking-wider">
            GunScope AI
          </h1>
          <div className="text-[10px] text-[#00ff4166] font-mono uppercase tracking-wider">
            Firearms Intelligence Platform
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <a className={`
            px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all
            ${isActive('/') 
              ? 'bg-[#252a28] text-[#00ff41] border border-[#00ff4166] shadow-[0_0_10px_rgba(0,255,65,0.3)]' 
              : 'text-[#00ff4166] hover:text-[#00ff41] hover:bg-[#252a28]'}
          `}>
            Dashboard
          </a>
        </Link>

        <Link href="/map">
          <a className={`
            px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all
            ${isActive('/map') 
              ? 'bg-[#252a28] text-[#00ff41] border border-[#00ff4166] shadow-[0_0_10px_rgba(0,255,65,0.3)]' 
              : 'text-[#00ff4166] hover:text-[#00ff41] hover:bg-[#252a28]'}
          `}>
            Map
          </a>
        </Link>

        <Link href="/list">
          <a className={`
            px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all
            ${isActive('/list') 
              ? 'bg-[#252a28] text-[#00ff41] border border-[#00ff4166] shadow-[0_0_10px_rgba(0,255,65,0.3)]' 
              : 'text-[#00ff4166] hover:text-[#00ff41] hover:bg-[#252a28]'}
          `}>
            List
          </a>
        </Link>

        <Link href="/sources">
          <a className={`
            px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all
            ${isActive('/sources') 
              ? 'bg-[#252a28] text-[#00ff41] border border-[#00ff4166] shadow-[0_0_10px_rgba(0,255,65,0.3)]' 
              : 'text-[#00ff4166] hover:text-[#00ff41] hover:bg-[#252a28]'}
          `}>
            Sources
          </a>
        </Link>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
        <span className="text-xs text-[#00ff41] font-mono">OPERATIONAL</span>
      </div>
    </div>
  );
}

