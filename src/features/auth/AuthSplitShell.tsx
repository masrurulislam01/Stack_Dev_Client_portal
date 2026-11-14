import {Activity, CreditCard, FolderLock} from 'lucide-react';
import type {ReactNode} from 'react';
import {AuthTopBar} from '@/components/layout/AuthTopBar';
import {BrandLogo} from '@/components/layout/BrandLogo';

const HIGHLIGHTS = [
  {
    icon: Activity,
    title: 'Live project updates',
    description: 'Track milestones, sprint progress, and deliverables in real time.',
  },
  {
    icon: FolderLock,
    title: 'Secure file sharing',
    description: 'Access signed build archives, designs, and contracts in one vault.',
  },
  {
    icon: CreditCard,
    title: 'Easy invoice payment',
    description: 'Review itemized BDT invoices and submit bKash, Nagad, or bank proofs.',
  },
] as const;

export function AuthSplitShell({children}: {children: ReactNode}) {
  return (
    <div className="min-h-screen bg-background text-body flex flex-col lg:flex-row">
      <div
        aria-hidden="true"
        className="lg:hidden h-1.5 w-full bg-gradient-brand shrink-0"
      />

      <aside className="hidden lg:flex lg:w-[55%] bg-gradient-brand text-white relative overflow-hidden p-12 xl:p-16 flex-col justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-45"
        />
        <div className="relative z-10">
          <BrandLogo variant="inverted" />
        </div>

        <div className="relative z-10 max-w-xl space-y-10 my-auto py-12">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80">
              Stack Dev Client Portal
            </p>
            <h2 className="font-heading text-[40px] leading-[48px] font-extrabold tracking-[-0.025em] text-white">
              Your projects, files and invoices, in one place.
            </h2>
          </div>

          <div className="space-y-5">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold text-white">{item.title}</p>
                    <p className="text-sm text-white/80 leading-relaxed mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/80">
          <span>Stack Dev · Savar, Dhaka</span>
        </div>
      </aside>

      <div className="flex-1 lg:w-[45%] flex flex-col justify-between px-4 py-6 sm:px-8 lg:px-12">
        <div className="lg:hidden">
          <AuthTopBar showBrand />
        </div>
        <div className="hidden lg:block">
          <AuthTopBar />
        </div>

        <main className="w-full max-w-[400px] mx-auto my-8">
          <div className="bg-surface rounded-3xl border border-border shadow-md p-6 sm:p-8">
            {children}
          </div>
        </main>

        <footer className="w-full max-w-[400px] mx-auto text-center text-xs text-muted">
          <span>Stack Dev</span>
          <span aria-hidden="true"> · </span>
          <span>Savar, Dhaka</span>
        </footer>
      </div>
    </div>
  );
}
