import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  User,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  Building,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  chatId: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  messages: ChatMessage[];
  status: string;
  isActive: boolean;
  expiresAt: string;
  instructions: string;
}

export default function PublicChat() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatSession?.messages.length) {
      scrollToBottom();
    }
  }, [chatSession?.messages]);

  useEffect(() => {
    loadChatSession();
  }, [token]);

  const loadChatSession = async () => {
    if (!token) {
      setError("Invalid chat link. Please check your URL.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/public/chat/${token}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Chat session not found. Please check your link.");
        } else if (response.status === 403) {
          setError(
            "This chat link has expired. Please contact the recruiting team."
          );
        } else {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to load chat session.");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setChatSession(data);
      setError(null);
    } catch (err) {
      setError("Failed to connect to the chat service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !chatSession?.isActive) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    // Optimistically add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setChatSession((prev) => ({
      ...prev!,
      messages: [...prev!.messages, userMessage],
    }));

    try {
      const response = await fetch(`/api/public/chat/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to send message");
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: data.timestamp,
      };

      setChatSession((prev) => ({
        ...prev!,
        messages: [...prev!.messages, aiMessage],
        status: data.status,
        isActive: !data.isCompleted,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");

      // Remove optimistic user message on error
      setChatSession((prev) => ({
        ...prev!,
        messages: prev!.messages.slice(0, -1),
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusInfo = () => {
    if (!chatSession) return null;

    switch (chatSession.status) {
      case "pending_candidate_response":
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "Ready to start",
          color: "bg-blue-500",
        };
      case "in_progress":
        return {
          icon: <MessageSquare className="h-4 w-4" />,
          text: "In progress",
          color: "bg-yellow-500",
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "Completed",
          color: "bg-green-500",
        };
      case "expired":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          text: "Expired",
          color: "bg-red-500",
        };
      default:
        return {
          icon: <MessageSquare className="h-4 w-4" />,
          text: "Active",
          color: "bg-blue-500",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading your chat...</h3>
            <p className="text-muted-foreground text-center">
              Please wait while we prepare your screening session.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-800">
              Unable to Load Chat
            </h3>
            <p className="text-red-600 text-center mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chatSession) return null;

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-gray-900">
                  {chatSession.companyName}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  AI Screening Interview
                </h1>
                <p className="text-sm text-gray-600">{chatSession.jobTitle}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`${statusInfo?.color} text-white border-transparent`}
            >
              {statusInfo?.icon}
              <span className="ml-1">{statusInfo?.text}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      {chatSession.status === "pending_candidate_response" && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="py-6">
              <h2 className="text-xl font-bold mb-2">
                Welcome, {chatSession.candidateName}! 👋
              </h2>
              <p className="text-blue-100 mb-4">{chatSession.instructions}</p>
              <div className="flex items-center space-x-4 text-sm text-blue-100">
                <span>📋 Position: {chatSession.jobTitle}</span>
                <span>⏱️ Duration: ~5-10 minutes</span>
                <span>🤖 AI-Powered</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto px-4 pb-6">
        <Card className="h-[600px] flex flex-col shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <span>Screening Conversation</span>
              <Badge variant="outline" className="ml-auto">
                {chatSession.messages.length} messages
              </Badge>
            </CardTitle>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatSession.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    message.role === "user"
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[85%] ${
                      message.role === "user" ? "text-right" : ""
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      } inline-block shadow-sm`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp
                        ? format(new Date(message.timestamp), "HH:mm")
                        : ""}
                    </p>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 bg-gray-50">
            {chatSession.isActive ? (
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  placeholder="Type your response..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                  className="flex-1 bg-white"
                  maxLength={2000}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  size="icon"
                  className="shadow-sm"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {chatSession.status === "completed"
                      ? "Screening completed! Thank you for your time."
                      : "This chat session is no longer active."}
                  </span>
                </div>
                {chatSession.status === "completed" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Our recruiting team will review your responses and be in
                    touch soon.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-gray-500">
        <p>Powered by {chatSession.companyName} AI Recruiting Platform</p>
        {chatSession.expiresAt && (
          <p className="mt-1">
            Chat expires: {format(new Date(chatSession.expiresAt), "PPpp")}
          </p>
        )}
      </div>
    </div>
  );
}
