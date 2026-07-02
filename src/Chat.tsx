import { useCallback, useMemo, useState } from "react";
import {
  AssistantRuntimeProvider, useExternalStoreRuntime,
  type AppendMessage, type ThreadMessageLike,
} from "@assistant-ui/react";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Thread } from "@/components/thread";
import { toThreadMessages } from "./toThread";

export function Chat() {
  const userName = "Kudae Sithu"; // Replace with actual user name later
  const [lcMessages, setLcMessages] = useState<(HumanMessage | AIMessage)[]>(() => [
    new AIMessage(`Hi ${userName}, how can I assist you today?`),
  ]);
  const [conversationId] = useState<string>(() => crypto.randomUUID()); 

  const onNew = useCallback(async (message: AppendMessage) => {
    const text = message.content.filter((c) => c.type === "text").map((c) => c.text).join("");
    setLcMessages((m) => [...m, new HumanMessage(text)]);

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId: conversationId, userName: userName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Request failed");
      }

      const data = await res.json();
      setLcMessages((m) => [...m, new AIMessage(data.reply)]);
    } catch (e) {
      console.error(e);
      setLcMessages((m) => [...m, new AIMessage("Sorry, something went wrong.")]);
    }
  }, [conversationId]);

  const messages = useMemo(() => toThreadMessages(lcMessages), [lcMessages]);

  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messages, onNew, convertMessage: (m) => m,
  });

  return (<AssistantRuntimeProvider runtime={runtime}><Thread /></AssistantRuntimeProvider>);
}