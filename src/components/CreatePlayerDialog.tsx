import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreatePlayer } from "@/hooks/usePlayers";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onCreated?: (playerId: string) => void;
  trigger?: React.ReactNode;
}

export function CreatePlayerDialog({ onCreated, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createPlayer = useCreatePlayer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const player = await createPlayer.mutateAsync(name.trim());
      toast.success(`Gracz "${player.name}" został dodany!`);
      setName("");
      setOpen(false);
      onCreated?.(player.id);
    } catch {
      toast.error("Nie udało się dodać gracza");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
            <UserPlus className="w-5 h-5" />
            Stwórz nowego gracza
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono">Nowy gracz</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Imię / Nick"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="bg-secondary border-border text-lg h-12"
          />
          <Button
            type="submit"
            className="w-full h-12 text-lg font-mono font-bold"
            disabled={!name.trim() || createPlayer.isPending}
          >
            {createPlayer.isPending ? "Zapisywanie..." : "Zapisz gracza"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
