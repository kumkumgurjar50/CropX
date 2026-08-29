import { Box } from '@mui/material';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationCenter from '../../components/common/NotificationCenter';
import DashboardLayout from '../../components/common/DashboardLayout';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function CustomerNotifications() {
  usePageTitle('Notifications');
  const notifProps = useNotifications();

  return (
    <DashboardLayout title="Notifications">
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <NotificationCenter {...notifProps} />
      </Box>
    </DashboardLayout>
  );
}
