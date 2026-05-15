import { Home, Megaphone, Layers, Building2, AtSign, HelpCircle, Settings, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', icon: Home, href: '/home' },
  { label: 'Campaigns', icon: Megaphone, href: '/campaigns', active: true },
  { label: 'Sequences', icon: Layers, href: '/sequences' },
  { label: 'My Company', icon: Building2, href: '/company' },
  { label: 'Senders', icon: AtSign, href: '/senders' },
];

const bottomItems = [
  { label: 'Help', icon: HelpCircle },
  { label: 'Settings', icon: Settings },
  { label: 'Billing', icon: CreditCard },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-sm font-semibold">L</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">Lumif.ai</span>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href="#"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  item.active
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-5 py-3">
        <div className="flex items-center justify-between text-xs text-sidebar-foreground/70">
          <span>Total credits:</span>
          <span className="font-medium text-sidebar-foreground">10,000</span>
        </div>
      </div>

      <div className="border-t border-sidebar-border px-3 py-3">
        <ul className="space-y-0.5">
          {bottomItems.map((item) => (
            <li key={item.label}>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
