import { AppShell } from "@/components/AppShell";
import { AppStateProvider } from "@/components/AppStateContext";
import { AppAuthGuard } from "@/components/AppAuthGuard";
import { AppAccessGuard } from "@/components/AppAccessGuard";

export default function AppLayout({ children }) {
  return (
    <AppAuthGuard>
      <AppAccessGuard>
        <AppStateProvider>
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </AppAccessGuard>
    </AppAuthGuard>
  );
}
