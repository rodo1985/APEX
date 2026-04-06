import { useEffect, useRef, useState } from "react";

import { ApexLockup, Icon } from "./Brand";
import { useSession } from "../lib/auth";
import { recordAudioOnce, speakText } from "../lib/voice";
import type { ConversationMessage, ConversationPreview } from "../lib/types";

type CoachDockMode = "page" | "rail";

interface CoachDockProps {
  mode: CoachDockMode;
}

export function CoachDock({ mode }: CoachDockProps) {
  const { api } = useSession();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    async function loadConversations() {
      const response = await api.getCoachConversations();
      setConversations(response.conversations);

      if (!selectedConversationId && response.conversations[0]) {
        setSelectedConversationId(response.conversations[0].conversation_id);
      }
    }

    void loadConversations().catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : "Unable to load conversations.");
    });
  }, [api, selectedConversationId]);

  useEffect(() => {
    if (!api) {
      return;
    }

    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    void api
      .getConversation(selectedConversationId)
      .then((response) => setMessages(response.messages))
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Unable to load the conversation.");
      });
  }, [api, selectedConversationId]);

  useEffect(() => {
    if (typeof scrollAnchorRef.current?.scrollIntoView === "function") {
      scrollAnchorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function reloadConversations(nextConversationId?: string | null) {
    if (!api) {
      return;
    }

    const response = await api.getCoachConversations();
    setConversations(response.conversations);

    if (nextConversationId !== undefined) {
      setSelectedConversationId(nextConversationId);
      return;
    }

    if (!selectedConversationId && response.conversations[0]) {
      setSelectedConversationId(response.conversations[0].conversation_id);
    }
  }

  async function sendMessage(message: string) {
    if (!api || !message.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await api.sendCoachMessage({
        message,
        conversation_id: selectedConversationId,
      });
      const detail = await api.getConversation(response.conversation_id);
      setSelectedConversationId(response.conversation_id);
      setMessages(detail.messages);
      setDraft("");
      speakText(response.reply);
      await reloadConversations(response.conversation_id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send the coach message.");
    } finally {
      setSending(false);
    }
  }

  async function sendVoiceMessage() {
    if (!api) {
      return;
    }

    setRecording(true);
    setError(null);

    try {
      const audioBlob = await recordAudioOnce();
      const formData = new FormData();
      formData.append("audio", audioBlob, "coach-note.webm");
      if (selectedConversationId) {
        formData.append("conversation_id", selectedConversationId);
      }

      const response = await api.sendCoachVoice(formData);
      const detail = await api.getConversation(response.conversation_id);
      setSelectedConversationId(response.conversation_id);
      setMessages(detail.messages);
      speakText(response.reply);
      await reloadConversations(response.conversation_id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send the voice note.");
    } finally {
      setRecording(false);
    }
  }

  const currentConversationPreview =
    conversations.find((conversation) => conversation.conversation_id === selectedConversationId)?.preview ??
    conversations[0]?.preview ??
    "New coach thread";

  return (
    <section className={mode === "rail" ? "coach-dock coach-dock-rail" : "coach-dock coach-dock-page"}>
      <div className="coach-dock-header">
        {mode === "page" ? (
          <div className="coach-dock-lockup">
            <ApexLockup size={32} wordmarkSize={20} mode="naked" />
            <div className="coach-dock-live">
              <span className="coach-dock-live-dot" />
              Full context loaded
            </div>
          </div>
        ) : (
          <div className="coach-dock-rail-title">
            <strong>APEX Coach</strong>
            <div className="coach-dock-live">
              <span className="coach-dock-live-dot" />
              Live
            </div>
          </div>
        )}
        <div className="coach-dock-context">Nutrition · Training · Recovery · Calendar</div>
        <div className="coach-dock-preview-row">
          <span className="coach-dock-preview">{currentConversationPreview}</span>
          <button
            type="button"
            className="coach-dock-new"
            onClick={() => {
              setSelectedConversationId(null);
              setMessages([]);
            }}
          >
            New
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="coach-dock-messages">
        {messages.length === 0 ? (
          <div className="coach-empty">
            Ask about today&apos;s fuelling, recent training load, or what tomorrow should look like.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.message_id}
              className={`coach-message ${message.role === "assistant" ? "assistant" : "user"}`}
            >
              <div className="coach-message-author">{message.role === "assistant" ? "Apex" : "You"}</div>
              <div className="coach-message-bubble">{message.content}</div>
            </div>
          ))
        )}
        <div ref={scrollAnchorRef} />
      </div>

      <div className="coach-dock-composer">
        <div className="coach-composer-shell">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              mode === "page"
                ? "Ask APEX about training, fuelling, recovery, or tomorrow's plan..."
                : "Ask APEX anything..."
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(draft);
              }
            }}
          />
          <div className="coach-composer-actions">
            <button
              type="button"
              className="coach-composer-button coach-composer-ghost"
              aria-label="Push-to-talk"
              onClick={() => void sendVoiceMessage()}
              disabled={recording}
            >
              <Icon name="mic" size={18} />
            </button>
            <button
              type="button"
              className="coach-composer-button coach-composer-send"
              aria-label="Send message"
              onClick={() => void sendMessage(draft)}
              disabled={sending || !draft.trim()}
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
