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
	const timelineRef = useRef<HTMLDivElement | null>(null);
	const hasAutoScrolledRef = useRef(false);

	useEffect(() => {
		if (!user) {
			setMessages([]);
			setMessagesError("");
			setIsLoadingMessages(false);
			hasAutoScrolledRef.current = false;
			return;
		}

		const controller = new AbortController();
		setMessagesError("");
		setIsLoadingMessages(true);
		hasAutoScrolledRef.current = false;

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
		if (!user || isLoadingMessages || messagesError !== "") {
			return;
		}
		if (hasAutoScrolledRef.current) {
			return;
		}
		if (messages.length === 0) {
			hasAutoScrolledRef.current = true;
			return;
		}

		const timelineElement = timelineRef.current;
		if (!timelineElement) {
			return;
		}

		timelineElement.scrollTop = timelineElement.scrollHeight;
		hasAutoScrolledRef.current = true;
	}, [user, isLoadingMessages, messages.length, messagesError]);

	const appendMessage = (message: Message) => {
		setMessages((currentMessages) => [...currentMessages, message]);
	};

	const scrollToBottom = () => {
		const timelineElement = timelineRef.current;
		if (!timelineElement) {
			return;
		}
		timelineElement.scrollTop = timelineElement.scrollHeight;
	};

	return {
		messages,
		isLoadingMessages,
		messagesError,
		timelineRef,
		appendMessage,
		scrollToBottom,
	};
}
