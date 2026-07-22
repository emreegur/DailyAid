import { ElderlyLayout } from '@/components/layout/ElderlyLayout';

export default function ElderlyRootLayout({ children }: { children: React.ReactNode }) {
  return <ElderlyLayout>{children}</ElderlyLayout>;
}
