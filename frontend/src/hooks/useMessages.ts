import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import type { Message, User } from "../types";

type MessagesResponse = {
	messages: Message[];
};

async function parseErrorMessage(
	response: Response,
	fallback: string,
): Promise<string> {
	try {
		const json = (await response.json()) as { error?: string };
		if (json.error && json.error.trim() !== "") {
			return json.error;
		}
	} catch {
		// ignore parse error and use fallback
	}
	return fallback;
}

export function useMessages(
	user: User | null,
	setUser: (user: User | null) => void,
) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [messagesError, setMessagesError] = useState("");
	const [scrollRequest, setScrollRequest] = useState<
		"initial" | "post-send" | null
	>(null);
	const timelineRef = useRef<HTMLDivElement | null>(null);
	const latestMessageRef = useRef<HTMLLIElement | null>(null);

	useEffect(() => {
		if (!user) {
			setMessages([]);
			setMessagesError("");
			setIsLoadingMessages(false);
			setScrollRequest(null);
			return;
		}

		const controller = new AbortController();
		setMessagesError("");
		setIsLoadingMessages(true);

		const fetchMessages = async () => {
			try {
				const response = await fetch(`${config.apiBaseUrl}/api/messages`, {
					method: "GET",
					credentials: "include",
					signal: controller.signal,
				});

				if (response.status === 401) {
					setUser(null);
					return;
				}

				if (!response.ok) {
					const message = await parseErrorMessage(
						response,
						"メッセージの取得に失敗しました。",
					);
					setMessagesError(message);
					return;
				}

				const data = (await response.json()) as MessagesResponse;
				setMessages(Array.isArray(data.messages) ? data.messages : []);
				setScrollRequest("initial");
			} catch {
				if (!controller.signal.aborted) {
					setMessagesError("メッセージの取得に失敗しました。");
				}
			} finally {
				if (!controller.signal.aborted) {
					setIsLoadingMessages(false);
				}
			}
		};

		void fetchMessages();

		return () => {
			controller.abort();
		};
	}, [user, setUser]);

	useEffect(() => {
		if (scrollRequest === null) {
			return;
		}

		const latestMessageElement = latestMessageRef.current;
		if (latestMessageElement) {
			latestMessageElement.scrollIntoView({ block: "end" });
		}

		setScrollRequest(null);
	}, [scrollRequest]);

	const appendMessage = (message: Message) => {
		setMessages((currentMessages) => [...currentMessages, message]);
		setScrollRequest("post-send");
	};

	const replaceMessage = (updatedMessage: Message) => {
		setMessages((currentMessages) =>
			currentMessages.map((msg) =>
				msg.id === updatedMessage.id ? updatedMessage : msg,
			),
		);
	};

	return {
		messages,
		isLoadingMessages,
		messagesError,
		timelineRef,
		latestMessageRef,
		appendMessage,
		replaceMessage,
	};
}
