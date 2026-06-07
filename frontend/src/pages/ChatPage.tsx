import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Download,
  FileText,
} from "lucide-react";

interface Message {
  _id: string;
  sender: "ai" | "candidate" | "recruiter";
  content: string;
  timestamp: string;
  type?: "text" | "question" | "answer" | "summary";
}

interface ChatSession {
  _id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  status: "active" | "completed" | "abandoned";
  messages: Message[];
  startedAt: string;
  completedAt?: string;
  score?: number;
  summary?: string;
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      fetchChatSession();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatSession = async () => {
    if (!chatId) return;

    setLoading(true);
    setError("");

    try {
      const { api } = await import("@/lib/api");
      const chatData = await api.chat.getChatMessages(chatId);

      let candidateName = "";
      let candidateEmail = "";
      let jobTitle = "";

      if (chatData.candidate_id) {
        try {
          const candidate = await api.candidates.getCandidate(chatData.candidate_id);
          candidateName = candidate.name || "";
          candidateEmail = candidate.email || "";
          if (chatData.job_posting_id) {
            const job = await api.jobs.getJob(chatData.job_posting_id);
            jobTitle = job.title || "";
          }
        } catch {
          // Non-fatal: chat can still render without candidate metadata
        }
      }

      const transformedSession: ChatSession = {
        _id: chatId,
        candidateId: chatData.candidate_id || "",
        candidateName,
        candidateEmail,
        jobId: chatData.job_posting_id || "",
        jobTitle,
        status: (chatData.status === "completed"
          ? "completed"
          : chatData.status === "expired"
          ? "abandoned"
          : "active") as ChatSession["status"],
        messages: (chatData.messages || []).map(
          (msg: { role?: string; content?: string; timestamp?: string }, index: number) => ({
            _id: `${chatId}-${index}`,
            sender: (msg.role === "assistant"
              ? "ai"
              : msg.role === "user"
              ? "recruiter"
              : "candidate") as Message["sender"],
            content: msg.content || "",
            timestamp: msg.timestamp || new Date().toISOString(),
            type: "text" as const,
          })
        ),
        startedAt: chatData.created_at || new Date().toISOString(),
        summary: chatData.summary,
      };

      setChatSession(transformedSession);
    } catch (error) {
      console.error("Error fetching chat session:", error);
      setError("An error occurred while loading the chat");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatSession || !chatId || sending) return;

    const messageText = newMessage.trim();
    setSending(true);
    setNewMessage("");

    try {
      const { api } = await import("@/lib/api");
      const userMessage: Message = {
        _id: `${Date.now()}-user`,
        sender: "recruiter",
        content: messageText,
        timestamp: new Date().toISOString(),
        type: "text",
      };

      setChatSession((prev) =>
        prev ? { ...prev, messages: [...prev.messages, userMessage] } : prev
      );

      const response = await api.chat.sendMessage(chatId, { message: messageText });
      const aiMessage: Message = {
        _id: `${Date.now()}-ai`,
        sender: "ai",
        content: response.reply,
        timestamp: new Date().toISOString(),
        type: "text",
      };

      setChatSession((prev) =>
        prev ? { ...prev, messages: [...prev.messages, aiMessage] } : prev
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const completeSession = async () => {
    if (!chatSession || !chatId) return;

    try {
      const { api } = await import("@/lib/api");
      const response = await api.chat.endChat(chatId);
      setChatSession({
        ...chatSession,
        status: "completed",
        completedAt: new Date().toISOString(),
        summary: response.summary,
      });
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  const exportChat = () => {
    if (!chatSession) return;

    const chatData = {
      candidate: chatSession.candidateName,
      job: chatSession.jobTitle,
      startedAt: chatSession.startedAt,
      completedAt: chatSession.completedAt,
      status: chatSession.status,
      score: chatSession.score,
      messages: chatSession.messages,
      summary: chatSession.summary,
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_${chatSession.candidateName}_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "abandoned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case "ai":
        return <Bot className="h-4 w-4" />;
      case "candidate":
        return <User className="h-4 w-4" />;
      case "recruiter":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading chat session...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !chatSession) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Unable to Load Chat</h2>
          <p className="text-muted-foreground mb-4">
            {error || "The chat session you're looking for doesn't exist."}
          </p>
          <Button onClick={() => navigate("/candidates")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {/* Back to Candidates */}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/candidates/${chatSession.candidateId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {/* Back to Candidate */}
            </Button>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI Screening Chat</h1>
                <p className="text-muted-foreground">
                  {chatSession.candidateName} • {chatSession.jobTitle}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(chatSession.status)}>
              {chatSession.status}
            </Badge>
            {chatSession.score && (
              <Badge variant="outline">
                Score: {Math.round(chatSession.score * 100)}%
              </Badge>
            )}
            <Button variant="outline" onClick={exportChat}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {chatSession.status === "active" &&
              (user?.role === "admin" || user?.role === "recruiter") && (
                <Button onClick={completeSession}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Session
                </Button>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Messages */}
          <div className="lg:col-span-3">
            <Card className="glass-card h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Conversation</span>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Started {new Date(chatSession.startedAt).toLocaleString()}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatSession.messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.sender === "candidate"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "candidate"
                            ? "bg-primary text-primary-foreground"
                            : message.sender === "ai"
                            ? "bg-muted"
                            : "bg-secondary"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {getSenderIcon(message.sender)}
                          <span className="text-xs font-medium capitalize">
                            {message.sender === "ai"
                              ? "AuraHR AI"
                              : message.sender}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        {message.type && message.type !== "text" && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {message.type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {chatSession.status === "active" && (
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {chatSession.status !== "active" && (
                  <div className="border-t p-4 text-center text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2">
                      {chatSession.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>
                        Chat session {chatSession.status}
                        {chatSession.completedAt && (
                          <span className="ml-1">
                            on{" "}
                            {new Date(chatSession.completedAt).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Candidate
                  </p>
                  <p className="font-medium">{chatSession.candidateName}</p>
                  <p className="text-sm text-muted-foreground">
                    {chatSession.candidateEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Position</p>
                  <p className="font-medium">{chatSession.jobTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm">
                    {chatSession.completedAt
                      ? `${Math.round(
                          (new Date(chatSession.completedAt).getTime() -
                            new Date(chatSession.startedAt).getTime()) /
                            (1000 * 60)
                        )} minutes`
                      : "Ongoing"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Messages</p>
                  <p className="text-sm">{chatSession.messages.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            {chatSession.score && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Performance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {Math.round(chatSession.score * 100)}%
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${chatSession.score * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on AI analysis of responses
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Summary */}
            {chatSession.summary && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <span>AI Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {chatSession.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    navigate(`/candidates/${chatSession.candidateId}`)
                  }
                >
                  <User className="h-4 w-4 mr-2" />
                  View Candidate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/jobs/${chatSession.jobId}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Job
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={exportChat}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
