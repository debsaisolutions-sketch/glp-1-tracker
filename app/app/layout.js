import { AppShell } from "@/components/AppShell";
import { AppStateProvider } from "@/components/AppStateContext";
import { AppAuthGuard } from "@/components/AppAuthGuard";

export default function AppLayout({ children }) {
  return (
    <AppAuthGuard>
      <AppStateProvider>
        <AppShell>{children}</AppShell>
      </AppStateProvider>
    </AppAuthGuard>
  );
}
