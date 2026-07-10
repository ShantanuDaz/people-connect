import { useState, useEffect } from "react";
import ConnectionList from "./ConnectionList";
import WorkspaceArea from "./WorkspaceArea";
import ShareModal from "./ShareModal";
import useUserStore from "../../../store/useUserStore";

export default function ConnectionLayout() {
  const profile = useUserStore((state) => state.profile);
  const [connections, setConnections] = useState({});
  const [dbState, setDbState] = useState({ pending: [], requested: [], connections: [], rejected: [] });
  const [activeConnectionId, setActiveConnectionId] = useState(null);
  const [myPublicKeyHex, setMyPublicKeyHex] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // 1. Setup connection listener (Worker -> UI)
  useEffect(() => {
    // Fetch public key asynchronously to avoid race conditions
    window.connection.getPublicKey().then(key => {
      setMyPublicKeyHex(key)
    })

    const handleMessage = (event) => {
      const { type, topic, from, payload, publicKeyHex, message, connections: incConnections } = event;
      
      if (type === "log") {
        console.log(message);
        return;
      }
      
      console.log("[UI] Received message from Worker:", { type, topic, from, payload, publicKeyHex });

      if (type === "init" || type === "connections_state") {
        setDbState(incConnections);
        setIsChatLoading(true);
        // Load history for accepted connections
        const promises = incConnections.connections.map(async (c) => {
          if (c.pairwiseTopic && !connections[c.pairwiseTopic]) {
            const history = await window.connection.getHistory(c.pairwiseTopic);
            setConnections(prev => ({
              ...prev,
              [c.pairwiseTopic]: { 
                peerName: c.peerInfo?.name || c.peerPubKeyHex.slice(0, 8),
                peerAvatar: c.peerInfo?.name?.slice(0, 2).toUpperCase() || c.peerPubKeyHex.slice(0, 2).toUpperCase(),
                history: history || [] 
              }
            }));
            // Auto-select the chat if nothing is currently selected
            setActiveConnectionId(prevId => prevId || c.pairwiseTopic);
          }
        });
        Promise.all(promises).then(() => setIsChatLoading(false));
      }
      else if (type === "db_changed") {
        // re-fetch state
        window.connection.getConnections();
      }
      else if (type === "payload") {
        setConnections((prev) => {
          const conn = prev[topic];
          if (!conn) return prev;

          return {
            ...prev,
            [topic]: {
              ...conn,
              peerName:
                conn.peerName === "Unknown Peer" && from !== "system"
                  ? from
                  : conn.peerName,
              history: [
                ...conn.history,
                { from, payload, isOwn: false, timestamp: Date.now() },
              ],
            },
          };
        });
      }
    };

    const unsubscribe = window.connection.onMessage(handleMessage);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Initial fetch
    window.connection.getConnections();
  }, []);

  const userInfo = profile ? { name: profile.name, avatar: profile.avatar } : null;

  useEffect(() => {
    if (userInfo) {
      window.connection.updateProfile(userInfo);
    }
  }, [profile?.name, profile?.avatar]);

  const handleCreateInvite = () => {
    setIsShareModalOpen(true);
  };

  const handleJoinInvite = async (inviteString) => {
    const targetPubKey = inviteString.replace("peer:", "").trim();
    if (!targetPubKey) return;
    
    console.log("[UI] User clicked Join! Sending requestJoin to worker for:", targetPubKey);
    await window.connection.requestJoin(targetPubKey, userInfo);
  };
  
  const handleAccept = async (peerPubKeyHex) => {
    await window.connection.acceptRequest(peerPubKeyHex, userInfo);
  };
  
  const handleReject = async (peerPubKeyHex) => {
    await window.connection.rejectRequest(peerPubKeyHex);
  };

  const handleSendPayload = (content, type = "text") => {
    if (!activeConnectionId) return;

    const payload = { type, content, timestamp: Date.now() };

    // Display locally instantly
    setConnections((prev) => ({
      ...prev,
      [activeConnectionId]: {
        ...prev[activeConnectionId],
        history: [
          ...prev[activeConnectionId].history,
          {
            from: profile?.name || "You",
            payload,
            isOwn: true,
            timestamp: Date.now(),
          },
        ],
      },
    }));

    // Send to worker to persist in Hyperbee
    window.connection.sendTo({ topic: activeConnectionId, payload });
  };

  return (
    <div className="flex h-full font-sans text-zinc-100 bg-zinc-950 antialiased overflow-hidden w-full relative">
      <ConnectionList
        connections={connections}
        dbState={dbState}
        activeConnectionId={activeConnectionId}
        onSelectConnection={setActiveConnectionId}
        onCreateInvite={handleCreateInvite}
        onJoinInvite={handleJoinInvite}
        onAccept={handleAccept}
        onReject={handleReject}
      />
      <WorkspaceArea
        profile={profile}
        activeConnectionId={activeConnectionId}
        connection={activeConnectionId ? connections[activeConnectionId] : null}
        onSendPayload={handleSendPayload}
        isChatLoading={isChatLoading}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        publicKeyHex={myPublicKeyHex}
      />
    </div>
  );
}
