"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { callPandasAgent } from "./query"; // Assuming this path is correct
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, BrainCircuit, Send } from "lucide-react"; // Import icons

// Define a type for messages for better type safety
type Message = {
  id: number; // Add unique ID for React key prop
  sender: "user" | "assistant";
  text: string;
  thoughts?: string[];
  isError?: boolean; // Flag for error messages
};

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

  const exampleQueries = [
    "How much did we spend in Bleu de Chanel?",
    "What was the total spending on TV campaigns?",
    "Which campaigns had the highest spending?",
    "How much did we spend on digital ads for Coco Mademoiselle?",
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const newUserMessage: Message = {
      id: Date.now(), // Simple unique ID
      sender: "user",
      text: trimmedInput,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput(""); // Clear input immediately
    setLoading(true);

    try {
      const response = await callPandasAgent(trimmedInput);

      const newAssistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: response.output, // Assuming response.output is the main text
        thoughts: response.intermediate_steps,
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error("Error calling agent:", error); // Log error for debugging
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Re-focus input after sending/error
      inputRef.current?.focus();
    }
  };

  const handleExampleQuery = (query: string) => {
    setInput(query);
    // Focus the input field after setting the example query
    inputRef.current?.focus();
  };

  // Handle Enter key press in input
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      // Allow Shift+Enter for new lines if needed in future
      event.preventDefault(); // Prevent default form submission/newline
      handleSendMessage();
    }
  };

  return (
    <div className="flex justify-center p-4 md:p-6 bg-gray-50 min-h-screen">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-center text-xl font-semibold text-gray-800">
            Campaign Spending Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {/* Example Queries Section */}
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-medium mb-2 text-gray-600">
              Try asking:
            </h3>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm" // Smaller buttons
                  onClick={() => handleExampleQuery(query)}
                  className="text-xs md:text-sm" // Responsive text size
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <ScrollArea
            className="h-[50vh] md:h-[60vh] w-full p-4 bg-white rounded-lg border mb-4"
            ref={scrollAreaRef}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[75%] md:max-w-[70%] shadow-sm ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : message.isError
                      ? "bg-red-100 text-red-800 border border-red-200" // Error style
                      : "bg-gray-100 text-gray-800" // Assistant style
                  }`}
                >
                  {/* Basic Markdown support could be added here if needed */}
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {message.text}
                  </p>

                  {/* Thoughts Dropdown for Assistant messages */}
                  {message.sender === "assistant" &&
                    !message.isError &&
                    message.thoughts &&
                    message.thoughts.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost" // Less intrusive button
                            size="sm"
                            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                          >
                            <BrainCircuit className="h-4 w-4 mr-1" />
                            View Thoughts
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 md:w-80 max-h-60 overflow-y-auto">
                          <DropdownMenuLabel>Agent Thoughts</DropdownMenuLabel>
                          {message.thoughts.map((thought, idx) => (
                            <DropdownMenuItem
                              key={idx}
                              className="text-xs break-words whitespace-pre-wrap" // Allow wrapping
                            >
                              {/* Render thought potentially differently if it's structured */}
                              {typeof thought === "string"
                                ? thought
                                : JSON.stringify(thought)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>
              </div>
            ))}
            {/* Invisible div to mark the end for scrolling */}
            <div ref={messageEndRef} />
          </ScrollArea>

          {/* Input Section */}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown} // Add keydown listener
              placeholder="Ask about campaign spending..."
              className="flex-1"
              disabled={loading} // Disable input when loading
              aria-label="Chat input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()} // Disable if loading or input is empty
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" /> // Loading spinner
              ) : (
                <Send className="h-4 w-4" /> // Send icon
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
