import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    } else {
      if (!displayName.trim()) {
        toast.error("Podaj nazwę wyświetlaną");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName.trim());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Sprawdź email, aby potwierdzić konto!");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-primary">
            <Target className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold font-mono tracking-tight">
            Dart<span className="text-primary">Score</span>
          </h1>
          <p className="text-muted-foreground text-xs">
            {isLogin ? "Zaloguj się, aby kontynuować" : "Utwórz nowe konto"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">Nazwa wyświetlana</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Twoja nazwa"
                className="h-11 bg-secondary border-border"
                maxLength={50}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-mono text-muted-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="h-11 bg-secondary border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-mono text-muted-foreground">Hasło</Label>
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

          <Button type="submit" className="w-full h-11 font-mono font-bold gap-2" disabled={loading}>
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isLogin ? "Zaloguj się" : "Zarejestruj się"}
          </Button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-xs text-primary hover:underline w-full text-center touch-manipulation py-2"
        >
          {isLogin ? "Nie masz konta? Zarejestruj się" : "Masz już konto? Zaloguj się"}
        </button>
      </div>
    </div>
  );
}
