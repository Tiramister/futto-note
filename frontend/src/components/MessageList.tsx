import type { ReactNode, RefObject } from "react";
import type { Message } from "../types";

type MessageListProps = {
	messages: Message[];
	isLoadingMessages: boolean;
	messagesError: string;
	timelineRef: RefObject<HTMLDivElement | null>;
};

type TimelineItem =
	| {
			type: "separator";
			key: string;
			label: string;
	  }
	| {
			type: "message";
			key: string;
			message: Message;
	  };

const urlPattern = /(https?:\/\/[^\s]+)/g;
const exactURLPattern = /^https?:\/\/[^\s]+$/;

function formatMessageTime(createdAt: string): string {
	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) {
		return createdAt;
	}

	return new Intl.DateTimeFormat("ja-JP", {
		dateStyle: "short",
		timeStyle: "short",
	}).format(date);
}

function formatTimelineDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}/${month}/${day}`;
}

function getMessageDateKey(createdAt: string): string {
	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) {
		return `invalid:${createdAt}`;
	}
	return formatTimelineDate(date);
}

function formatSeparatorDate(createdAt: string): string {
	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) {
		return createdAt;
	}
	return formatTimelineDate(date);
}

function buildTimelineItems(messages: Message[]): TimelineItem[] {
	const items: TimelineItem[] = [];
	let previousDateKey: string | null = null;

	for (const message of messages) {
		const currentDateKey = getMessageDateKey(message.created_at);
		if (previousDateKey !== currentDateKey) {
			items.push({
				type: "separator",
				key: `separator-${message.id}-${currentDateKey}`,
				label: formatSeparatorDate(message.created_at),
			});
			previousDateKey = currentDateKey;
		}

		items.push({
			type: "message",
			key: `message-${message.id}`,
			message,
		});
	}

	return items;
}

function renderMessageBody(body: string): ReactNode[] {
	let offset = 0;
	return body.split(urlPattern).map((part) => {
		const keySuffix = `${offset}-${part}`;
		offset += part.length;

		if (exactURLPattern.test(part)) {
			return (
				<a
					key={`link-${keySuffix}`}
					className="message-body__link"
					href={part}
					target="_blank"
					rel="noreferrer"
				>
					{part}
				</a>
			);
		}

		return <span key={`text-${keySuffix}`}>{part}</span>;
	});
}

export function MessageList({
	messages,
	isLoadingMessages,
	messagesError,
	timelineRef,
}: MessageListProps) {
	const timelineItems = buildTimelineItems(messages);

	return (
		<div
			className="timeline-messages"
			data-testid="message-list"
			ref={timelineRef}
		>
			{isLoadingMessages && (
				<p className="status" data-testid="messages-loading">
					メッセージを読み込み中...
				</p>
			)}
			{!isLoadingMessages && messagesError !== "" && (
				<p className="status status--error" role="alert">
					{messagesError}
				</p>
			)}
			{!isLoadingMessages && messagesError === "" && messages.length === 0 && (
				<p className="status" data-testid="messages-empty">
					メッセージはまだありません。
				</p>
			)}
			{!isLoadingMessages && messagesError === "" && messages.length > 0 && (
				<ol className="message-list">
					{timelineItems.map((item) => {
						if (item.type === "separator") {
							return (
								<li
									className="message-separator"
									data-testid="message-date-separator"
									key={item.key}
								>
									<span
										aria-hidden="true"
										className="message-separator__line"
									/>
									<span className="message-separator__label">{item.label}</span>
									<span
										aria-hidden="true"
										className="message-separator__line"
									/>
								</li>
							);
						}

						return (
							<li className="message-item" key={item.key}>
								<p className="message-body">
									{renderMessageBody(item.message.body)}
								</p>
								<p className="message-meta">
									<time dateTime={item.message.created_at}>
										{formatMessageTime(item.message.created_at)}
									</time>
								</p>
							</li>
						);
					})}
				</ol>
			)}
		</div>
	);
}
