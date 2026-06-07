import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIScreeningChatProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
}

export function AIScreeningChat({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  jobTitle,
}: AIScreeningChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !chatId) {
      initializeChat();
    }
  }, [isOpen, chatId]);

  const initializeChat = async () => {
    try {
      setIsInitializing(true);
      const response = await api.candidates.startScreening(candidateId);

      setChatId(response.chatId);
      setMessages([
        {
          role: "assistant",
          content: response.firstMessage,
          timestamp: new Date().toISOString(),
        },
      ]);

      const candidateLink = response.candidateLink
        ? `${window.location.origin}${response.candidateLink}`
        : null;

      toast({
        title: "AI Screening Started",
        description: candidateLink ? (
          <div className="space-y-2">
            <p>Screening conversation initiated for {candidateName}</p>
            <div className="bg-blue-50 p-2 rounded text-xs">
              <p className="font-medium text-blue-800">
                Candidate Link Generated:
              </p>
              <p className="text-blue-600 break-all">{candidateLink}</p>
              <button
                onClick={() => navigator.clipboard.writeText(candidateLink)}
                className="text-blue-700 underline mt-1"
              >
                Copy Link
              </button>
            </div>
          </div>
        ) : (
          `Screening conversation initiated for ${candidateName}`
        ),
        duration: candidateLink ? 10000 : 4000,
      });

      if (candidateLink && navigator.clipboard) {
        navigator.clipboard.writeText(candidateLink);
      }
    } catch (error) {
      console.error("Error starting screening:", error);
      toast({
        title: "Error",
        description: "Failed to start AI screening conversation",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      const response = await api.chat.sendMessage(chatId, {
        message: newMessage,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    setMessages([]);
    setChatId(null);
    setNewMessage("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Screening Chat
          </DialogTitle>
          <DialogDescription>
            Candidate: <strong>{candidateName}</strong> | Position:{" "}
            <strong>{jobTitle}</strong>
            <Badge variant="outline" className="ml-2">
              AI Powered
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          <ScrollArea className="flex-1 border rounded-lg p-4">
            {isInitializing ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Initializing AI screening...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
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
                      className={`flex-1 max-w-[80%] ${
                        message.role === "user" ? "text-right" : ""
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        } inline-block`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isInitializing || !chatId}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={
                !newMessage.trim() || isLoading || isInitializing || !chatId
              }
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
