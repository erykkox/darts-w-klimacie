import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center touch-manipulation hover:bg-primary/30 transition-colors">
          <User className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border z-50">
        <div className="px-3 py-2 text-xs text-muted-foreground font-mono truncate max-w-[200px]">
          {user.email}
        </div>
        <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive cursor-pointer">
          <LogOut className="w-4 h-4" />
          Wyloguj się
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
