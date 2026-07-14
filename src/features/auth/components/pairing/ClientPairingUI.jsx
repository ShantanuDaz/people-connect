import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { Shield } from "lucide-react";

export const ClientPairingUI = ({ onPairSuccess, onCancel }) => {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [clientStatus, setClientStatus] = useState("idle");
  
  const onPairSuccessRef = useRef(onPairSuccess);
  useEffect(() => {
    onPairSuccessRef.current = onPairSuccess;
  }, [onPairSuccess]);

  useEffect(() => {
    let active = true;

    window.api.pairing.onWorkerEvent((message) => {
      if (!active) return;
      if (message.status === "connected") {
        setClientStatus("connected");
      } else if (message.status === "pairing_success") {
        setClientStatus("approved");
        if (onPairSuccessRef.current) onPairSuccessRef.current(message);
      }
    });

    return () => {
      active = false;
      window.api.pairing.cleanup();
    };
  }, []);

  const handleClientConnect = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!roomCode.trim()) {
      setError("Please enter a valid room code.");
      return;
    }

    setLoading(true);
    setClientStatus("connecting");
    try {
      const result = await window.api.pairing.client(roomCode);
      if (result && result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || "Failed to connect to host.");
      setClientStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCopy = async () => {
    setError("");
    setClientStatus("requesting");
    try {
      const result = await window.api.pairing.requestCopy();
      if (result && result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || "Failed to request copy.");
      setClientStatus("connected");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm font-semibold p-3 rounded-lg border border-destructive/20 text-center">
          {error}
        </div>
      )}

      {clientStatus === "idle" || clientStatus === "connecting" ? (
        <form onSubmit={handleClientConnect} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter Room Code</label>
            <input 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="PC-XXXXXX"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={clientStatus === "connecting"}
            />
          </div>
          <Button type="submit" disabled={loading || clientStatus === "connecting"}>
            {clientStatus === "connecting" ? "Connecting..." : "Connect"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          
          {clientStatus === "connected" && (
            <>
              <p className="text-sm text-foreground font-medium">Connected to Host Device!</p>
              <Button onClick={handleRequestCopy}>
                Copy credentials from main device
              </Button>
            </>
          )}

          {clientStatus === "requesting" && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Waiting for host approval...
            </p>
          )}

          {clientStatus === "approved" && (
            <p className="text-sm text-green-500 font-medium">
              Approved! Automatically signing in...
            </p>
          )}
        </div>
      )}

      {onCancel && clientStatus !== "requesting" && clientStatus !== "approved" && (
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      )}
    </div>
  );
};
