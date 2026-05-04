import { useRouter } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';

import { PlaceholderScreen } from '../../src/components/ui/PlaceholderScreen';

export default function PlanTab() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Training Plans"
      body="Your personalized training blocks and objective progress will appear here once your baseline is established."
      eyebrow="Athlete plan"
      accent="#1D9E75"
      icon={ClipboardList}
      actionLabel="Open Plan Builder"
      onAction={() => router.push('/athlete-plans')}
    />
  );
}
