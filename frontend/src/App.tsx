import { useEffect, useState } from "react";
import "./App.css";
import { AuthHeader } from "./components/AuthHeader";
import { LoginForm } from "./components/LoginForm";
import { MessageComposer } from "./components/MessageComposer";
import { MessageList } from "./components/MessageList";
import { config } from "./config";
import { useAuth } from "./hooks/useAuth";
import { useMessages } from "./hooks/useMessages";
import type { Message } from "./types";

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

function App() {
	const {
		user,
		setUser,
		isCheckingAuth,
		username,
		setUsername,
		password,
		setPassword,
		loginError,
		logoutError,
		isSubmitting,
		isLoggingOut,
		isUserMenuOpen,
		handleLogin,
		handleLogout,
		toggleUserMenu,
	} = useAuth();

	const {
		messages,
		isLoadingMessages,
		messagesError,
		timelineRef,
		latestMessageRef,
		appendMessage,
		replaceMessage,
		removeMessage,
	} = useMessages(user, setUser);
	const [draftMessage, setDraftMessage] = useState("");
	const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
	const [submitMessageError, setSubmitMessageError] = useState("");

	const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
	const [editBody, setEditBody] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateError, setUpdateError] = useState("");
	const [deleteError, setDeleteError] = useState("");
	const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
	const [copyError, setCopyError] = useState("");

	useEffect(() => {
		if (user) {
			return;
		}
		setDraftMessage("");
		setSubmitMessageError("");
		setIsSubmittingMessage(false);
		setEditingMessageId(null);
		setEditBody("");
		setIsUpdating(false);
		setUpdateError("");
		setDeleteError("");
		setCopiedMessageId(null);
		setCopyError("");
	}, [user]);

	const handleDraftMessageChange = (nextValue: string) => {
		setDraftMessage(nextValue);
		if (submitMessageError !== "") {
			setSubmitMessageError("");
		}
	};

	const handleCreateMessage = async () => {
		if (draftMessage === "" || isSubmittingMessage) {
			return;
		}

		setSubmitMessageError("");
		setIsSubmittingMessage(true);
		try {
			const response = await fetch(`${config.apiBaseUrl}/api/messages`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ body: draftMessage }),
			});

			if (response.status === 401) {
				setUser(null);
				return;
			}

			if (!response.ok) {
				const message = await parseErrorMessage(
					response,
					"メッセージの送信に失敗しました。",
				);
				setSubmitMessageError(message);
				return;
			}

			const createdMessage = (await response.json()) as Message;
			appendMessage(createdMessage);
			setDraftMessage("");
		} catch {
			setSubmitMessageError("メッセージの送信に失敗しました。");
		} finally {
			setIsSubmittingMessage(false);
		}
	};

	const handleStartEdit = (message: Message) => {
		setEditingMessageId(message.id);
		setEditBody(message.body);
		setUpdateError("");
	};

	const handleEditBodyChange = (value: string) => {
		setEditBody(value);
		if (updateError !== "") {
			setUpdateError("");
		}
	};

	const handleCancelEdit = () => {
		setEditingMessageId(null);
		setEditBody("");
		setUpdateError("");
	};

	const handleSaveEdit = async () => {
		if (editingMessageId === null || editBody === "" || isUpdating) {
			return;
		}

		setUpdateError("");
		setIsUpdating(true);
		try {
			const response = await fetch(
				`${config.apiBaseUrl}/api/messages/${editingMessageId}`,
				{
					method: "PUT",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ body: editBody }),
				},
			);

			if (response.status === 401) {
				setUser(null);
				return;
			}

			if (!response.ok) {
				const message = await parseErrorMessage(
					response,
					"メッセージの更新に失敗しました。",
				);
				setUpdateError(message);
				return;
			}

			const updatedMessage = (await response.json()) as Message;
			replaceMessage(updatedMessage);
			setEditingMessageId(null);
			setEditBody("");
		} catch {
			setUpdateError("メッセージの更新に失敗しました。");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleCopyMessage = async (message: Message) => {
		setCopyError("");
		try {
			await navigator.clipboard.writeText(message.body);
			setCopiedMessageId(message.id);
			setTimeout(() => {
				setCopiedMessageId((current) =>
					current === message.id ? null : current,
				);
			}, 2000);
		} catch {
			setCopyError("コピーに失敗しました。");
		}
	};

	const handleDeleteMessage = async (messageId: number) => {
		setDeleteError("");
		try {
			const response = await fetch(
				`${config.apiBaseUrl}/api/messages/${messageId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (response.status === 401) {
				setUser(null);
				return;
			}

			if (!response.ok) {
				const message = await parseErrorMessage(
					response,
					"メッセージの削除に失敗しました。",
				);
				setDeleteError(message);
				return;
			}

			removeMessage(messageId);
			if (editingMessageId === messageId) {
				setEditingMessageId(null);
				setEditBody("");
				setUpdateError("");
			}
		} catch {
			setDeleteError("メッセージの削除に失敗しました。");
		}
	};

	const editState =
		editingMessageId !== null
			? {
					messageId: editingMessageId,
					editBody,
					isUpdating,
					updateError,
				}
			: null;

	if (isCheckingAuth) {
		return (
			<main className="app">
				<p className="status" data-testid="auth-loading">
					認証状態を確認中...
				</p>
			</main>
		);
	}

	if (!user) {
		return (
			<LoginForm
				username={username}
				password={password}
				loginError={loginError}
				isSubmitting={isSubmitting}
				onUsernameChange={setUsername}
				onPasswordChange={setPassword}
				onSubmit={handleLogin}
			/>
		);
	}

	return (
		<main className="app app--timeline">
			<section className="timeline" data-testid="main-screen">
				<AuthHeader
					username={user.username}
					isUserMenuOpen={isUserMenuOpen}
					isLoggingOut={isLoggingOut}
					onToggleUserMenu={toggleUserMenu}
					onLogout={handleLogout}
				/>
				<MessageList
					messages={messages}
					isLoadingMessages={isLoadingMessages}
					messagesError={messagesError}
					timelineRef={timelineRef}
					latestMessageRef={latestMessageRef}
					editState={editState}
					copiedMessageId={copiedMessageId}
					onStartEdit={handleStartEdit}
					onEditBodyChange={handleEditBodyChange}
					onSaveEdit={handleSaveEdit}
					onCancelEdit={handleCancelEdit}
					onDelete={handleDeleteMessage}
					onCopy={handleCopyMessage}
				/>
				{deleteError !== "" && (
					<p
						className="status status--error"
						role="alert"
						data-testid="delete-error"
					>
						{deleteError}
					</p>
				)}
				{copyError !== "" && (
					<p
						className="status status--error"
						role="alert"
						data-testid="copy-error"
					>
						{copyError}
					</p>
				)}
				<MessageComposer
					value={draftMessage}
					isSubmitting={isSubmittingMessage}
					errorMessage={submitMessageError}
					onChange={handleDraftMessageChange}
					onSubmit={handleCreateMessage}
				/>
				{logoutError !== "" && (
					<p className="status status--error" role="alert">
						{logoutError}
					</p>
				)}
			</section>
		</main>
	);
}

export default App;
