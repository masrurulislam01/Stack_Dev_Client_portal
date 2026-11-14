import {CalendarClock, CheckCircle2, MessageSquare, Receipt} from 'lucide-react';
import type {NotificationType} from '@/config/constants';

export function NotificationIcon({type}: {type: NotificationType}) {
  switch (type) {
    case 'message':
      return (
        <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
        </div>
      );
    case 'milestone':
      return (
        <div className="w-9 h-9 rounded-xl bg-warning-soft text-warning-text flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
        </div>
      );
    case 'invoice':
      return (
        <div className="w-9 h-9 rounded-xl bg-success-soft text-success-text flex items-center justify-center shrink-0">
          <Receipt className="w-4 h-4" aria-hidden="true" />
        </div>
      );
    case 'update':
    default:
      return (
        <div className="w-9 h-9 rounded-xl bg-info-soft text-info-text flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4" aria-hidden="true" />
        </div>
      );
  }
}
