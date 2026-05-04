import { useRouter } from 'expo-router';
import { BarChart3 } from 'lucide-react-native';

import { PlaceholderScreen } from '../../src/components/ui/PlaceholderScreen';

export default function ProgressTab() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Performance Progress"
      body="Deep-dive analytics will open from real weekly reviews, objective tests, and monthly reports instead of placeholder charts."
      eyebrow="Athlete progress"
      accent="#1D9E75"
      icon={BarChart3}
      actionLabel="Open Weekly Review"
      onAction={() => router.push('/athlete-review')}
    />
  );
}
