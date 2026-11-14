import {CalendarClock, CheckCircle2, MessageSquare, Receipt} from 'lucide-react';
import type {NotificationType} from '@/types/portal';

export function NotificationIcon({type}: {type: NotificationType}) {
  switch (type) {
    case 'message':
      return (
        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
        </div>
      );
    case 'milestone':
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
        </div>
      );
    case 'invoice':
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Receipt className="w-4 h-4" aria-hidden="true" />
        </div>
      );
    case 'update':
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4" aria-hidden="true" />
        </div>
      );
  }
}
