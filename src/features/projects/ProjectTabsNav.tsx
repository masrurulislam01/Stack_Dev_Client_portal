import {
  CalendarClock,
  FileText,
  FolderOpen,
  LayoutList,
  MessageSquare,
} from 'lucide-react';

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
    <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      <nav aria-label="Project sections" className="flex items-center gap-1 min-w-max">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
              {tab.id === 'messages' && unreadMessages > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tabular-nums">
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
