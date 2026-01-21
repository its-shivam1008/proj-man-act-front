import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MessageSquare,
  Send,
  Paperclip,
  User,
  Clock,
} from "lucide-react";

import { fetchMessages, sendMessage } from "@/redux/slices/production/chatSlice";

/* ================= TYPES ================= */

interface RootState {
  auth: {
    user: {
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

/* ================= MAIN COMPONENT ================= */

const CollaborationTab = ({ teamId }: CollaborationTabProps) => {
  const dispatch = useDispatch<any>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = useSelector((state: any) => state.auth?.userProfile ?? null);
  const { messages, loading } = useSelector((state: RootState) => state.chat);

  const [message, setMessage] = useState("");

  /* ================= FETCH MESSAGES ================= */

  useEffect(() => {
    if (teamId) {
      dispatch(fetchMessages(teamId));
    }
  }, [teamId, dispatch]);

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

  const canSend = user.role !== "user";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ================= ACTIVITY FEED (OPTIONAL STATIC) ================= */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <Clock className="h-4 w-4" />
          <h3 className="font-semibold">Activity Feed</h3>
        </div>

        <div className="p-4 text-sm text-gray-500">
          Activity integration can be added later
        </div>
      </div>

      {/* ================= CHAT ================= */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow flex flex-col">

        {/* HEADER */}
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Team Discussion</h3>
        </div>

        {/* MESSAGES */}
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
            const isOwn = m.sender?._id === user._id;

            return (
              <div
                key={m._id}
                className={`flex gap-3 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                {!isOwn && (
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
                    isOwn
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
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="border-t p-4 flex items-center gap-3">
          <button className="p-2 border rounded-lg">
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
    </div>
  );
};

export default CollaborationTab;
