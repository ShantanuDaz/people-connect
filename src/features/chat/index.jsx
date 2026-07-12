import { MessageSquare } from "lucide-react";

export function Chat() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background p-4">
      <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center max-w-md w-full gap-4">
        <MessageSquare className="w-12 h-12 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Chat</h2>
        <p className="text-muted-foreground text-center">
          In progress... Check back later.
        </p>
      </div>
    </div>
  );
}
