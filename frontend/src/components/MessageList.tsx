import { type ReactNode, type Ref, type RefObject, useState } from "react";
import type { Message } from "../types";

type EditState = {
	messageId: number;
	editBody: string;
	isUpdating: boolean;
	updateError: string;
};

type MessageListProps = {
	messages: Message[];
	isLoadingMessages: boolean;
	messagesError: string;
	timelineRef: RefObject<HTMLDivElement | null>;
	latestMessageRef: Ref<HTMLLIElement>;
	editState: EditState | null;
	onStartEdit: (message: Message) => void;
	onEditBodyChange: (value: string) => void;
	onSaveEdit: () => void;
	onCancelEdit: () => void;
	onDelete: (messageId: number) => void;
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

type MessageItemProps = {
	message: Message;
	isLatest: boolean;
	latestMessageRef: Ref<HTMLLIElement>;
	isEditing: boolean;
	editState: EditState | null;
	onStartEdit: (message: Message) => void;
	onEditBodyChange: (value: string) => void;
	onSaveEdit: () => void;
	onCancelEdit: () => void;
	onDelete: (messageId: number) => void;
};

function MessageItem({
	message,
	isLatest,
	latestMessageRef,
	isEditing,
	editState,
	onStartEdit,
	onEditBodyChange,
	onSaveEdit,
	onCancelEdit,
	onDelete,
}: MessageItemProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleMenuToggle = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const handleEditClick = () => {
		setIsMenuOpen(false);
		onStartEdit(message);
	};

	const handleDeleteClick = () => {
		setIsMenuOpen(false);
		if (window.confirm("このメッセージを削除しますか？")) {
			onDelete(message.id);
		}
	};

	if (isEditing && editState) {
		return (
			<li
				className="message-item message-item--editing"
				ref={isLatest ? latestMessageRef : undefined}
			>
				<textarea
					className="message-edit-textarea"
					value={editState.editBody}
					onChange={(e) => onEditBodyChange(e.target.value)}
					disabled={editState.isUpdating}
					data-testid="edit-textarea"
				/>
				<div className="message-edit-actions">
					<button
						type="button"
						className="message-edit-save"
						onClick={onSaveEdit}
						disabled={editState.isUpdating || editState.editBody === ""}
						data-testid="edit-save-button"
					>
						{editState.isUpdating ? "保存中..." : "保存"}
					</button>
					<button
						type="button"
						className="message-edit-cancel"
						onClick={onCancelEdit}
						disabled={editState.isUpdating}
						data-testid="edit-cancel-button"
					>
						キャンセル
					</button>
				</div>
				{editState.updateError && (
					<p
						className="message-edit-error status--error"
						role="alert"
						data-testid="edit-error"
					>
						{editState.updateError}
					</p>
				)}
			</li>
		);
	}

	return (
		<li className="message-item" ref={isLatest ? latestMessageRef : undefined}>
			<div className="message-menu">
				<button
					type="button"
					className="message-menu-trigger"
					onClick={handleMenuToggle}
					aria-label="メッセージ操作メニュー"
					data-testid="message-menu-trigger"
				>
					...
				</button>
				{isMenuOpen && (
					<div
						className="message-menu-panel"
						data-testid="message-menu-panel"
					>
						<button
							type="button"
							className="message-menu-item"
							onClick={handleEditClick}
							data-testid="message-edit-button"
						>
							編集
						</button>
						<button
							type="button"
							className="message-menu-item"
							onClick={handleDeleteClick}
							data-testid="message-delete-button"
						>
							削除
						</button>
					</div>
				)}
			</div>
			<p className="message-body">{renderMessageBody(message.body)}</p>
			<p className="message-meta">
				<time dateTime={message.created_at}>
					{formatMessageTime(message.created_at)}
				</time>
			</p>
		</li>
	);
}

export function MessageList({
	messages,
	isLoadingMessages,
	messagesError,
	timelineRef,
	latestMessageRef,
	editState,
	onStartEdit,
	onEditBodyChange,
	onSaveEdit,
	onCancelEdit,
	onDelete,
}: MessageListProps) {
	const timelineItems = buildTimelineItems(messages);
	const lastMessageIndex = timelineItems.findLastIndex(
		(item) => item.type === "message",
	);

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

						const isLatest = timelineItems.indexOf(item) === lastMessageIndex;
						const isEditing = editState?.messageId === item.message.id;
						return (
							<MessageItem
								key={item.key}
								message={item.message}
								isLatest={isLatest}
								latestMessageRef={latestMessageRef}
								isEditing={isEditing}
								editState={editState}
								onStartEdit={onStartEdit}
								onEditBodyChange={onEditBodyChange}
								onSaveEdit={onSaveEdit}
								onCancelEdit={onCancelEdit}
								onDelete={onDelete}
							/>
						);
					})}
				</ol>
			)}
		</div>
	);
}
