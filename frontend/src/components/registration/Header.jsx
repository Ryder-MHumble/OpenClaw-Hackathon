import LobsterLogo from "../LobsterLogo";

export function Header({ navigate }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 md:px-12 py-3 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="size-8 sm:size-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
            <LobsterLogo size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-black tracking-tight">
              北纬·<span className="text-primary">龙虾大赛</span>
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-600 ml-1.5 font-mono">
              第一届
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-600 text-xs">
            <span>截止 3月19日</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <span className="relative flex size-1.5 sm:size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 sm:size-2 bg-primary" />
            </span>
            <span className="text-xs text-primary font-semibold">
              报名进行中
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
