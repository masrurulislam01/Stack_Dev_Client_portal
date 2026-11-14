import {NotificationIcon} from '@/features/notifications/NotificationIcon';
import type {NotificationRecord} from '@/types/portal';
import {formatDateTime} from '@/utils/format';

export interface NotificationItemProps {
  item: NotificationRecord;
  onSelect: (item: NotificationRecord) => void;
}

export function NotificationItem({item, onSelect}: NotificationItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 ${
          item.read
            ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            : 'bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
        }`}
      >
        <NotificationIcon type={item.type} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
              {item.title}
            </p>
            {!item.read && (
              <span
                aria-label="Unread"
                className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1.5"
              />
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
            {item.body}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums pt-0.5">
            {item.actorName ? `${item.actorName} · ` : ''}
            {formatDateTime(item.createdAt)}
          </p>
        </div>
      </button>
    </li>
  );
}
