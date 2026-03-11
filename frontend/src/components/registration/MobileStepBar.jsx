import { STEPS } from "../../constants/registration";

export function MobileStepBar({ currentStep }) {
  return (
    <div className="lg:hidden flex items-center justify-center py-3 px-4">
      {STEPS.map((step, i) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 rounded-full font-medium transition-all duration-300
              ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30 px-3 py-1.5"
                  : done
                    ? "bg-green-500/10 text-green-400 border border-green-500/20 size-7 justify-center"
                    : "bg-white/[0.04] text-slate-600 border border-white/[0.06] size-7 justify-center"
              }`}
            >
              <span className="text-xs font-bold leading-none">
                {done ? "✓" : step.id}
              </span>
              {active && (
                <span className="text-xs font-semibold whitespace-nowrap">
                  {step.label}
                </span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-5 h-px mx-1 flex-shrink-0 transition-colors duration-300 ${done ? "bg-green-500/50" : "bg-white/[0.08]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
