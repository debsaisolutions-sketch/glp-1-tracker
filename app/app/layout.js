import { AppShell } from "@/components/AppShell";
import { AppStateProvider } from "@/components/AppStateContext";

export default function AppLayout({ children }) {
  return (
    <AppStateProvider>
      <AppShell>{children}</AppShell>
    </AppStateProvider>
  );
}
