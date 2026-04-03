import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CoachPage } from "./CoachPage";
import type { ConversationMessage } from "../lib/types";

const mockedUseSession = vi.fn();
const mockedSpeakText = vi.fn();

vi.mock("../lib/auth", () => ({
  useSession: () => mockedUseSession(),
}));

vi.mock("../lib/voice", () => ({
  recordAudioOnce: vi.fn(),
  speakText: (...args: unknown[]) => mockedSpeakText(...args),
}));

describe("CoachPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a conversation and sends a grounded follow-up message", async () => {
    const user = userEvent.setup();
    let messages: ConversationMessage[] = [
      {
        message_id: "message-1",
        role: "assistant" as const,
        content: "Start with today's training context.",
        context_used: [],
        timestamp: "2026-04-03T07:00:00Z",
      },
    ];
    const api = {
      getCoachConversations: vi.fn().mockResolvedValue({
        conversations: [
          {
            conversation_id: "conversation-1",
            preview: "Yesterday's fuelling check-in",
            created_at: "2026-04-02T07:00:00Z",
            updated_at: "2026-04-03T07:00:00Z",
          },
        ],
      }),
      getConversation: vi.fn().mockImplementation(async () => ({
        conversation_id: "conversation-1",
        messages,
      })),
      sendCoachMessage: vi.fn().mockImplementation(async () => {
        messages = [
          {
            message_id: "message-1",
            role: "assistant",
            content: "Start with today's training context.",
            context_used: [],
            timestamp: "2026-04-03T07:00:00Z",
          },
          {
            message_id: "message-2",
            role: "user",
            content: "How hard should tomorrow be?",
            context_used: [],
            timestamp: "2026-04-03T07:05:00Z",
          },
          {
            message_id: "message-3",
            role: "assistant",
            content: "Keep tomorrow aerobic and protect recovery.",
            context_used: ["training_load", "nutrition_today"],
            timestamp: "2026-04-03T07:05:01Z",
          },
        ];
        return {
          conversation_id: "conversation-1",
          reply: "Keep tomorrow aerobic and protect recovery.",
          context_used: ["training_load", "nutrition_today"],
          suggested_actions: [],
        };
      }),
      sendCoachVoice: vi.fn(),
      deleteConversation: vi.fn(),
    };
    mockedUseSession.mockReturnValue({ api });

    render(<CoachPage />);

    expect(await screen.findByText("Yesterday's fuelling check-in")).toBeInTheDocument();
    expect(await screen.findByText("Start with today's training context.")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/ask apex about training/i),
      "How hard should tomorrow be?",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(api.sendCoachMessage).toHaveBeenCalledWith({
        message: "How hard should tomorrow be?",
        conversation_id: "conversation-1",
      });
    });
    expect(await screen.findByText("Keep tomorrow aerobic and protect recovery.")).toBeInTheDocument();
    expect(mockedSpeakText).toHaveBeenCalledWith("Keep tomorrow aerobic and protect recovery.");
  });
});
