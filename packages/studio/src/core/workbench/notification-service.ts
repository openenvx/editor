import { createServiceId } from '../runtime/create-service-id';
import type { Event } from '../runtime/emitter';
import { Emitter } from '../runtime/emitter';

export interface NotificationDescriptor {
  id: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface NotificationService {
  readonly notifications: readonly NotificationDescriptor[];
  readonly onDidChangeNotifications: Event<readonly NotificationDescriptor[]>;
  show(notification: NotificationDescriptor): void;
  dismiss(id: string): void;
  clear(): void;
}

export class NotificationServiceImpl implements NotificationService {
  private readonly emitter = new Emitter<readonly NotificationDescriptor[]>();
  private _notifications: NotificationDescriptor[] = [];

  readonly onDidChangeNotifications = this.emitter.event;

  get notifications(): readonly NotificationDescriptor[] {
    return this._notifications;
  }

  show(notification: NotificationDescriptor): void {
    this._notifications = [
      notification,
      ...this._notifications.filter((n) => n.id !== notification.id),
    ];
    this.emitter.fire(this._notifications);
  }

  dismiss(id: string): void {
    this._notifications = this._notifications.filter((n) => n.id !== id);
    this.emitter.fire(this._notifications);
  }

  clear(): void {
    if (this._notifications.length === 0) {
      return;
    }
    this._notifications = [];
    this.emitter.fire(this._notifications);
  }
}

export const NotificationServiceId = createServiceId<NotificationService>(
  'notificationService'
);
