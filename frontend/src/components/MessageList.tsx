import type { ReactNode, RefObject } from "react";
import type { Message } from "../types";

type MessageListProps = {
	messages: Message[];
	isLoadingMessages: boolean;
	messagesError: string;
	timelineRef: RefObject<HTMLDivElement | null>;
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
					{messages.map((message) => (
						<li className="message-item" key={message.id}>
							<p className="message-body">{renderMessageBody(message.body)}</p>
							<p className="message-meta">
								<time dateTime={message.created_at}>
									{formatMessageTime(message.created_at)}
								</time>
							</p>
						</li>
					))}
				</ol>
			)}
		</div>
	);
}
