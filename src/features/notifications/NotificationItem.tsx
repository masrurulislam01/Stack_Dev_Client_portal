import {NotificationIcon} from '@/features/notifications/NotificationIcon';
import type {NotificationRecord} from '@/types/portal';
import {formatDateTime} from '@/utils/format';

export function NotificationItem({
  item,
  onSelect,
}: {
  item: NotificationRecord;
  onSelect: (item: NotificationRecord) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring ${
          item.read
            ? 'bg-surface hover:bg-surface-muted/70'
            : 'bg-primary-50/55 hover:bg-primary-50'
        }`}
      >
        <NotificationIcon type={item.type} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {item.title || 'Notification'}
            </p>
            {!item.read && (
              <span
                aria-label="Unread"
                className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-1.5"
              />
            )}
          </div>
          {item.body && <p className="text-xs text-body line-clamp-2">{item.body}</p>}
          <p className="text-[11px] text-muted num pt-0.5">
            {item.actorName ? `${item.actorName} · ` : ''}
            {formatDateTime(item.createdAt)}
          </p>
        </div>
      </button>
    </li>
  );
}
