import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { Copy, Check } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export const HostPairingUI = ({ onCancel }) => {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const { copy, isCopied } = useCopyToClipboard();
  
  const [hostStatus, setHostStatus] = useState("Waiting for client...");
  const [pendingRequest, setPendingRequest] = useState(null);
  const [loadingCode, setLoadingCode] = useState(true);

  const user = useUserStore((state) => state.user);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let active = true;

    window.api.pairing.onWorkerEvent((message) => {
      if (!active) return;
      if (message.status === "client_connected") {
        setHostStatus("Client connected, waiting for request...");
      } else if (message.status === "request_received") {
        setHostStatus("Incoming request!");
        setPendingRequest({
          deviceKeyHex: message.deviceKeyHex,
          inputCoreKeyHex: message.inputCoreKeyHex,
        });
      }
    });

    const currentUser = userRef.current;
    if (currentUser?.publicKeyHex) {
      setLoadingCode(true);
      window.api.pairing.host(currentUser.publicKeyHex).then((res) => {
        if (!active) return;
        setLoadingCode(false);
        if (res && res.success) {
          setRoomCode(res.roomCode);
        } else if (res && res.error) {
          setError(res.error);
        }
      }).catch(err => {
        if (active) {
          setLoadingCode(false);
          setError(err.message);
        }
      });
    } else {
      setLoadingCode(false);
      setError("Missing public key for hosting.");
    }

    return () => {
      active = false;
      window.api.pairing.cleanup();
    };
  }, []);

  const handleCopy = () => {
    if (roomCode) copy(roomCode);
  };

  const handleHostApprove = async () => {
    if (!pendingRequest) return;
    setError("");
    try {
      const result = await window.api.pairing.approve(pendingRequest.deviceKeyHex, pendingRequest.inputCoreKeyHex);
      if (result && result.error) {
        throw new Error(result.error);
      }
      setHostStatus("Approved! You can close this window.");
      setPendingRequest(null);
    } catch (err) {
      setError(err.message || "Failed to approve request.");
    }
  };

  const handleHostReject = () => {
    window.api.pairing.cleanup();
    if (onCancel) onCancel();
  };

  return (
    <div className="flex flex-col gap-4 text-center">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm font-semibold p-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <p className="text-sm text-muted-foreground">Share this code with your new device to grant it access.</p>
      <div className="flex items-center gap-2 p-4 bg-muted/50 border border-border rounded-xl justify-center min-h-[80px]">
        {loadingCode ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-r-transparent animate-spin"></div>
            <span className="font-medium text-sm">Generating secure code...</span>
          </div>
        ) : (
          <>
            <span className="text-3xl font-mono tracking-widest font-bold">{roomCode}</span>
            <Button size="icon" variant="ghost" onClick={handleCopy} disabled={!roomCode} className="ml-2">
              {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </Button>
          </>
        )}
      </div>
      
      <div className="mt-4 p-4 border border-border rounded-lg bg-card">
        <p className="text-sm font-medium mb-3">{hostStatus}</p>
        
        {pendingRequest && (
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" onClick={handleHostReject} className="flex-1">
              Reject
            </Button>
            <Button onClick={handleHostApprove} className="flex-1">
              Approve
            </Button>
          </div>
        )}
      </div>

      {onCancel && (
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
};
