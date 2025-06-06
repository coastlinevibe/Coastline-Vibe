import { NotificationProvider } from '@/context/NotificationContext';

export const metadata = {
  title: 'Notifications | Coastline',
  description: 'View your notifications',
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
} 