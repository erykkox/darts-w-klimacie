import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Hasło musi mieć co najmniej 6 znaków");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Hasło zostało zmienione!");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Target className="w-7 h-7 text-primary mx-auto" />
          <h1 className="text-2xl font-extrabold font-mono tracking-tight">
            Nowe hasło
          </h1>
        </div>
        <form onSubmit={handleReset} className="glass-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono text-muted-foreground">Nowe hasło</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="h-11 bg-secondary border-border"
            />
          </div>
          <Button type="submit" className="w-full h-11 font-mono font-bold" disabled={loading}>
            Zmień hasło
          </Button>
        </form>
      </div>
    </div>
  );
}
