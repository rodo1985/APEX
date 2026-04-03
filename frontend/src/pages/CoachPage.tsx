import { useEffect, useState } from "react";

import { Icon } from "../components/Brand";
import { useSession } from "../lib/auth";
import { recordAudioOnce, speakText } from "../lib/voice";
import type { ConversationMessage, ConversationPreview } from "../lib/types";

export function CoachPage() {
  const { api } = useSession();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);

  async function loadConversations() {
    const response = await api.getCoachConversations();
    setConversations(response.conversations);

    if (!selectedConversationId && response.conversations[0]) {
      setSelectedConversationId(response.conversations[0].conversation_id);
    }
  }

  useEffect(() => {
    void loadConversations().catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : "Unable to load conversations.");
    });
  }, []);

  useEffect(() => {
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

  async function sendMessage(message: string) {
    if (!message.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await api.sendCoachMessage({
        message,
        conversation_id: selectedConversationId,
      });
      const conversationId = response.conversation_id;
      setSelectedConversationId(conversationId);
      const detail = await api.getConversation(conversationId);
      setMessages(detail.messages);
      setDraft("");
      speakText(response.reply);
      await loadConversations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send the coach message.");
    } finally {
      setSending(false);
    }
  }

  async function sendVoiceMessage() {
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
      await loadConversations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send the voice note.");
    } finally {
      setRecording(false);
    }
  }

  async function deleteConversation(conversationId: string) {
    try {
      await api.deleteConversation(conversationId);
      if (conversationId === selectedConversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete the conversation.");
    }
  }

  return (
    <div className="page-grid">
      <div className="section-copy">
        <p className="eyebrow">Coach</p>
        <h2>Context-aware conversations with your training data in view.</h2>
        <p>
          Every reply is generated against fresh APEX context. Push-to-talk is supported in the browser and
          replies can be read back with speech synthesis.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="coach-layout">
        <aside className="settings-card">
          <div className="list-header" style={{ marginBottom: "1rem" }}>
            <div>
              <p className="eyebrow">Saved threads</p>
              <h3 style={{ margin: 0 }}>Conversations</h3>
            </div>
            <button className="button-secondary" type="button" onClick={() => setSelectedConversationId(null)}>
              New
            </button>
          </div>
          <div className="conversation-list">
            {conversations.map((conversation) => (
              <div
                key={conversation.conversation_id}
                className="conversation-item"
                style={{
                  borderColor: selectedConversationId === conversation.conversation_id ? "var(--teal-border)" : "var(--border)",
                }}
              >
                <div className="list-header">
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.conversation_id)}
                    style={{ padding: 0, textAlign: "left", fontWeight: 700 }}
                  >
                    {conversation.preview || "Untitled conversation"}
                  </button>
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void deleteConversation(conversation.conversation_id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {conversations.length === 0 ? <div className="notice-banner">Your first coach thread starts here.</div> : null}
          </div>
        </aside>

        <section className="coach-thread">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="notice-banner">
                Ask about today&apos;s fuelling, recent training load, or how your current goal is progressing.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.message_id} className={`chat-bubble ${message.role === "assistant" ? "assistant" : "user"}`}>
                  {message.content}
                </div>
              ))
            )}
          </div>

          <div className="chat-composer">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask APEX about training, fuelling, recovery, or tomorrow's plan..."
            />
            <div className="inline-actions">
              <button className="button-primary" type="button" onClick={() => void sendMessage(draft)} disabled={sending}>
                {sending ? "Sending..." : "Send message"}
              </button>
              <button className="button-secondary" type="button" onClick={() => void sendVoiceMessage()} disabled={recording}>
                <Icon name="mic" />
                {recording ? "Recording..." : "Push-to-talk"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
