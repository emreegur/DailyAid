import { CaregiverLayout } from '@/components/layout/CaregiverLayout';

export default function CaregiverRootLayout({ children }: { children: React.ReactNode }) {
  return <CaregiverLayout>{children}</CaregiverLayout>;
}
