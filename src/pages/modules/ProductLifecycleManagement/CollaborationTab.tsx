import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MessageSquare,
  Send,
  Paperclip,
  User,
  Clock,
  Trash2Icon,
} from "lucide-react";

import socket from "@/utils/socket";
import {
  fetchMessages,
  sendMessage,
  messageReceived,
  clearLocal,
  clearChat,
} from "@/redux/slices/production/chatSlice";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RootState {
  auth: {
    userProfile: {
      _id: string;
      fullname: string;
      role: string;
    };
  };
  chat: {
    messages: any[];
    loading: boolean;
  };
}

interface CollaborationTabProps {
  teamId: string;
}

const CollaborationTab = ({ teamId }: CollaborationTabProps) => {
  const dispatch = useDispatch<any>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isClearOpen, setIsClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);



  const user = useSelector((state: RootState) => state.auth?.userProfile);
  const { messages, loading } = useSelector((state: RootState) => state.chat);

  const [message, setMessage] = useState("");

  /* ================= FETCH + JOIN ROOM ================= */

  useEffect(() => {
    if (teamId) {
      dispatch(fetchMessages(teamId));
      socket.emit("joinTeam", teamId);
    }

    return () => {
      socket.off("receiveMessage");
    };
  }, [teamId]);

  /* ================= LISTEN FOR REAL-TIME ================= */

  useEffect(() => {
    const handleReceive = (newMessage: any) => {
      dispatch(messageReceived(newMessage));
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    socket.on("chatCleared", () => {
      dispatch(clearLocal());
    });

    return () => {
      socket.off("chatCleared");
    };
  }, []);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */

  const handleSend = () => {
    if (!message.trim()) return;

    dispatch(sendMessage({ teamId, message }));
    setMessage("");
  };

  const canSend = user?.role !== "user";
  useEffect(() => {
    socket.on("userTyping", (name) => {
      setTypingUser(name);
    });

    socket.on("userStopTyping", () => {
      setTypingUser(null);
    });

    return () => {
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT PANEL */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <Clock className="h-4 w-4" />
          <h3 className="font-semibold">Activity Feed</h3>
        </div>

        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400">No recent activity</p>
          )}

          {messages.map((m) => (
            <div key={m._id} className="flex gap-3 items-start">
              <div className="bg-blue-100 p-2 rounded-full">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>

              <div className="text-sm">
                <p className="font-medium text-gray-800">
                  {m.sender?.fullname}
                </p>
                <p className="text-gray-600 truncate max-w-[180px]">
                  {m.message}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* CHAT */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between gap-2">
          <div className="flex justify-center items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Team Discussion</h3>
          </div>

          <button
            onClick={() => setIsClearOpen(true)}
            className="text-sm text-red-600 hover:underline"
            title="Clear Messages"
          >
            Clear Chat
          </button>


        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto">


          {loading && (
            <p className="text-sm text-gray-400">Loading messages...</p>
          )}

          {!loading && messages.length === 0 && (
            <p className="text-sm text-gray-400">
              No messages yet. Start the discussion.
            </p>
          )}

          {messages.map((m) => {
            const isOwn = m.sender?._id === user?._id;

            return (
              <div
                key={m._id}
                className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"
                  }`}
              >
                {!isOwn && (
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${isOwn
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1">
                      {m.sender?.fullname}
                    </p>
                  )}
                  <p>{m.message}</p>
                  <p className="text-[10px] opacity-70 mt-1 text-right">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}

                  </p>
                </div>
              </div>
            );
          })}
          {typingUser && typingUser !== user?.fullname && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">
                {typingUser} is typing
              </span>

              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 flex items-center gap-3">
          <button className="p-2 border rounded-lg">
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);

              socket.emit("typing", {
                teamId,
                user: user?.fullname,
              });

              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }

              typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stopTyping", { teamId });
              }, 1500);
            }}
            placeholder={
              canSend
                ? "Type a message..."
                : "You have read-only access"
            }
            disabled={!canSend}
            className="flex-1 border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />


          <button
            onClick={handleSend}
            disabled={!canSend}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              ⚠ Clear Chat
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-sm text-gray-600">
            Are you sure you want to permanently delete all messages in this team?
            <br />
            <span className="text-red-500 font-medium">
              This action cannot be undone.
            </span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClearOpen(false)}
              disabled={clearing}
            >
              Cancel
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={clearing}
              onClick={async () => {
                try {
                  setClearing(true);
                  await dispatch(clearChat(teamId));
                  setIsClearOpen(false);
                } finally {
                  setClearing(false);
                }
              }}
            >
              {clearing ? "Clearing..." : "Yes, Clear Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default CollaborationTab;
