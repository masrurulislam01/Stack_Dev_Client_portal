import {CalendarClock, FileText, FolderOpen, LayoutList, MessageSquare} from 'lucide-react';

export type ProjectDetailTab = 'overview' | 'timeline' | 'files' | 'messages' | 'invoices';

const TABS: {id: ProjectDetailTab; label: string; icon: typeof LayoutList}[] = [
  {id: 'overview', label: 'Overview', icon: LayoutList},
  {id: 'timeline', label: 'Timeline', icon: CalendarClock},
  {id: 'files', label: 'Files', icon: FolderOpen},
  {id: 'messages', label: 'Messages', icon: MessageSquare},
  {id: 'invoices', label: 'Invoices', icon: FileText},
];

interface ProjectTabsNavProps {
  activeTab: ProjectDetailTab;
  unreadMessages: number;
  onSelectTab: (tab: ProjectDetailTab) => void;
}

export function ProjectTabsNav({
  activeTab,
  unreadMessages,
  onSelectTab,
}: ProjectTabsNavProps) {
  return (
    <div className="border-b border-border overflow-x-auto">
      <nav aria-label="Project sections" className="flex items-center gap-1 min-w-max">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-muted hover:text-foreground hover:border-border-strong'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
              {tab.id === 'messages' && unreadMessages > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary-600 text-white text-[10px] font-semibold num">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
