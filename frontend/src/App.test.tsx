import "@testing-library/jest-dom/vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const fetchMock = vi.fn<typeof fetch>();

const sampleUser = {
	id: "user-1",
	username: "alice",
};

const sampleMessages = [
	{
		id: 1,
		body: "最初のメッセージ",
		created_at: "2026-02-09T10:00:00Z",
	},
	{
		id: 2,
		body: "リンク付き https://example.com",
		created_at: "2026-02-09T10:05:00Z",
	},
];

function jsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), { status });
}

function getPostMessageCalls() {
	return fetchMock.mock.calls.filter(([url, options]) => {
		if (url !== "/api/messages") {
			return false;
		}
		const requestInit = options as RequestInit | undefined;
		return requestInit?.method === "POST";
	});
}

function getPutMessageCalls() {
	return fetchMock.mock.calls.filter(([url, options]) => {
		if (typeof url !== "string" || !url.startsWith("/api/messages/")) {
			return false;
		}
		const requestInit = options as RequestInit | undefined;
		return requestInit?.method === "PUT";
	});
}

function getDeleteMessageCalls() {
	return fetchMock.mock.calls.filter(([url, options]) => {
		if (typeof url !== "string" || !url.startsWith("/api/messages/")) {
			return false;
		}
		const requestInit = options as RequestInit | undefined;
		return requestInit?.method === "DELETE";
	});
}

describe("App", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it("起動時に未認証ならログインフォームを表示する", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ error: "unauthorized" }, 401),
		);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("login-screen")).toBeInTheDocument();
		});

		expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
		expect(screen.getByLabelText("パスワード")).toHaveAttribute(
			"type",
			"password",
		);
		expect(
			screen.getByRole("button", { name: "ログイン" }),
		).toBeInTheDocument();
	});

	it("ログイン成功時にメイン画面へ切り替わる", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("login-screen")).toBeInTheDocument();
		});

		fireEvent.change(screen.getByLabelText("ユーザー名"), {
			target: { value: "alice" },
		});
		fireEvent.change(screen.getByLabelText("パスワード"), {
			target: { value: "password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		expect(screen.getByRole("button", { name: "alice" })).toBeInTheDocument();
		expect(screen.getByTestId("message-input-area")).toBeInTheDocument();
		expect(await screen.findByText("最初のメッセージ")).toBeInTheDocument();

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/messages",
				expect.objectContaining({
					method: "GET",
					credentials: "include",
				}),
			);
		});
	});

	it("ログイン失敗時にエラーメッセージを表示する", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
			.mockResolvedValueOnce(
				jsonResponse({ error: "invalid username or password" }, 401),
			);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("login-screen")).toBeInTheDocument();
		});

		fireEvent.change(screen.getByLabelText("ユーザー名"), {
			target: { value: "alice" },
		});
		fireEvent.change(screen.getByLabelText("パスワード"), {
			target: { value: "wrong-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent(
				"invalid username or password",
			);
		});
	});

	it("起動時に認証済みならメイン画面を表示する", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		expect(screen.getByRole("button", { name: "alice" })).toBeInTheDocument();
		expect(await screen.findByText("最初のメッセージ")).toBeInTheDocument();
	});

	it("初回表示時に最新メッセージへ scrollIntoView を呼び出す", async () => {
		const scrollIntoViewMock = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoViewMock;

		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		await waitFor(() => {
			expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: "end" });
		});
	});

	it("URL を含む本文をリンクとして表示し、通常テキストはそのまま表示する", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});

		const link = await screen.findByRole("link", {
			name: "https://example.com",
		});
		expect(link).toHaveAttribute("href", "https://example.com");
		expect(screen.getByText("最初のメッセージ")).toBeInTheDocument();
	});

	it("空入力ではメッセージ送信 API を呼ばない", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: "送信" }));
		expect(getPostMessageCalls()).toHaveLength(0);
	});

	it("送信成功時に入力をクリアし、タイムラインに追加して最新メッセージへスクロールする", async () => {
		const scrollIntoViewMock = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoViewMock;

		const createdMessage = {
			id: 3,
			body: "送信成功メッセージ",
			created_at: "2026-02-09T10:10:00Z",
		};
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }))
			.mockResolvedValueOnce(jsonResponse(createdMessage, 201));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});

		// 初回スクロール呼び出しをリセット
		await screen.findByText("最初のメッセージ");
		await waitFor(() => {
			expect(scrollIntoViewMock).toHaveBeenCalled();
		});
		scrollIntoViewMock.mockClear();

		const input = screen.getByLabelText("メッセージ入力");
		fireEvent.change(input, { target: { value: createdMessage.body } });
		fireEvent.click(screen.getByRole("button", { name: "送信" }));

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/messages",
				expect.objectContaining({
					method: "POST",
					credentials: "include",
					body: JSON.stringify({ body: createdMessage.body }),
				}),
			);
		});

		await waitFor(() => {
			expect(input).toHaveValue("");
		});
		expect(await screen.findByText(createdMessage.body)).toBeInTheDocument();

		await waitFor(() => {
			expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: "end" });
		});
	});

	it("Ctrl+Enter で送信し、Enter 単体では送信しない", async () => {
		const createdMessage = {
			id: 3,
			body: "Ctrl+Enter 送信",
			created_at: "2026-02-09T10:10:00Z",
		};
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }))
			.mockResolvedValueOnce(jsonResponse(createdMessage, 201));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});

		const input = screen.getByLabelText("メッセージ入力");
		fireEvent.change(input, { target: { value: createdMessage.body } });

		fireEvent.keyDown(input, {
			key: "Enter",
			code: "Enter",
		});
		expect(getPostMessageCalls()).toHaveLength(0);

		fireEvent.keyDown(input, {
			key: "Enter",
			code: "Enter",
			ctrlKey: true,
		});

		await waitFor(() => {
			expect(getPostMessageCalls()).toHaveLength(1);
		});
	});

	it("送信失敗時は入力内容を保持してエラーを表示する", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }))
			.mockResolvedValueOnce(
				jsonResponse({ error: "メッセージ作成に失敗しました。" }, 500),
			);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});

		const input = screen.getByLabelText("メッセージ入力");
		fireEvent.change(input, { target: { value: "失敗ケース" } });
		fireEvent.click(screen.getByRole("button", { name: "送信" }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent(
				"メッセージ作成に失敗しました。",
			);
		});
		expect(input).toHaveValue("失敗ケース");
	});

	it("ログアウト成功時にログイン画面へ戻る", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: [] }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: "alice" }));
		fireEvent.click(screen.getByRole("button", { name: "ログアウト" }));

		await waitFor(() => {
			expect(screen.getByTestId("login-screen")).toBeInTheDocument();
		});
	});

	it("編集開始時にテキストエリアに現在の本文が表示される", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const editButton = await screen.findByTestId("message-edit-button");
		fireEvent.click(editButton);

		const textarea = screen.getByTestId("edit-textarea");
		expect(textarea).toHaveValue("最初のメッセージ");
		expect(screen.getByTestId("edit-save-button")).toBeInTheDocument();
		expect(screen.getByTestId("edit-cancel-button")).toBeInTheDocument();
	});

	it("編集保存成功時に本文が更新される", async () => {
		const updatedMessage = {
			id: 1,
			body: "更新されたメッセージ",
			created_at: "2026-02-09T10:00:00Z",
		};
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }))
			.mockResolvedValueOnce(jsonResponse(updatedMessage));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const editButton = await screen.findByTestId("message-edit-button");
		fireEvent.click(editButton);

		const textarea = screen.getByTestId("edit-textarea");
		fireEvent.change(textarea, { target: { value: "更新されたメッセージ" } });
		fireEvent.click(screen.getByTestId("edit-save-button"));

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/messages/1",
				expect.objectContaining({
					method: "PUT",
					credentials: "include",
					body: JSON.stringify({ body: "更新されたメッセージ" }),
				}),
			);
		});

		await waitFor(() => {
			expect(screen.getByText("更新されたメッセージ")).toBeInTheDocument();
		});
		expect(screen.queryByTestId("edit-textarea")).not.toBeInTheDocument();
	});

	it("編集キャンセル時は PUT API を呼ばずに表示モードへ戻る", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const editButton = await screen.findByTestId("message-edit-button");
		fireEvent.click(editButton);

		const textarea = screen.getByTestId("edit-textarea");
		fireEvent.change(textarea, { target: { value: "変更後の本文" } });
		fireEvent.click(screen.getByTestId("edit-cancel-button"));

		expect(getPutMessageCalls()).toHaveLength(0);
		expect(screen.queryByTestId("edit-textarea")).not.toBeInTheDocument();
		expect(screen.getByText("最初のメッセージ")).toBeInTheDocument();
	});

	it("編集保存失敗時は入力内容を保持してエラー表示し、再保存できる", async () => {
		const updatedMessage = {
			id: 1,
			body: "再試行で成功",
			created_at: "2026-02-09T10:00:00Z",
		};
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }))
			.mockResolvedValueOnce(
				jsonResponse({ error: "メッセージの更新に失敗しました。" }, 500),
			)
			.mockResolvedValueOnce(jsonResponse(updatedMessage));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const editButton = await screen.findByTestId("message-edit-button");
		fireEvent.click(editButton);

		const textarea = screen.getByTestId("edit-textarea");
		fireEvent.change(textarea, { target: { value: "失敗ケース" } });
		fireEvent.click(screen.getByTestId("edit-save-button"));

		// エラー表示を確認
		await waitFor(() => {
			expect(screen.getByTestId("edit-error")).toHaveTextContent(
				"メッセージの更新に失敗しました。",
			);
		});

		// 入力内容が保持されている
		expect(screen.getByTestId("edit-textarea")).toHaveValue("失敗ケース");

		// 再試行で成功
		fireEvent.change(screen.getByTestId("edit-textarea"), {
			target: { value: "再試行で成功" },
		});
		fireEvent.click(screen.getByTestId("edit-save-button"));

		await waitFor(() => {
			expect(screen.getByText("再試行で成功")).toBeInTheDocument();
		});
		expect(screen.queryByTestId("edit-textarea")).not.toBeInTheDocument();
	});

	it("削除ボタン押下時に確認ダイアログを表示し、OKで削除APIを呼び出す", async () => {
		const confirmMock = vi.fn(() => true);
		vi.stubGlobal("confirm", confirmMock);

		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const deleteButton = await screen.findByTestId("message-delete-button");
		fireEvent.click(deleteButton);

		expect(confirmMock).toHaveBeenCalledWith("このメッセージを削除しますか？");

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/messages/1",
				expect.objectContaining({
					method: "DELETE",
					credentials: "include",
				}),
			);
		});

		await waitFor(() => {
			expect(screen.queryByText("最初のメッセージ")).not.toBeInTheDocument();
		});
	});

	it("削除確認ダイアログでキャンセル時はAPIを呼び出さない", async () => {
		const confirmMock = vi.fn(() => false);
		vi.stubGlobal("confirm", confirmMock);

		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const deleteButton = await screen.findByTestId("message-delete-button");
		fireEvent.click(deleteButton);

		expect(confirmMock).toHaveBeenCalledWith("このメッセージを削除しますか？");
		expect(getDeleteMessageCalls()).toHaveLength(0);
		expect(screen.getByText("最初のメッセージ")).toBeInTheDocument();
	});

	it("削除失敗時はメッセージを残してエラー表示し、再試行可能", async () => {
		const confirmMock = vi.fn(() => true);
		vi.stubGlobal("confirm", confirmMock);

		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }))
			.mockResolvedValueOnce(
				jsonResponse({ error: "メッセージの削除に失敗しました。" }, 500),
			)
			.mockResolvedValueOnce(new Response(null, { status: 204 }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const deleteButton = await screen.findByTestId("message-delete-button");
		fireEvent.click(deleteButton);

		await waitFor(() => {
			expect(screen.getByTestId("delete-error")).toHaveTextContent(
				"メッセージの削除に失敗しました。",
			);
		});
		expect(screen.getByText("最初のメッセージ")).toBeInTheDocument();

		// 再試行
		fireEvent.click(menuTriggers[0]);
		const deleteButtonRetry = await screen.findByTestId(
			"message-delete-button",
		);
		fireEvent.click(deleteButtonRetry);

		await waitFor(() => {
			expect(screen.queryByText("最初のメッセージ")).not.toBeInTheDocument();
		});
	});

	it("コピー成功時にクリップボードAPIを呼び出しフィードバック表示する", async () => {
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", {
			clipboard: { writeText: writeTextMock },
		});

		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const copyButton = await screen.findByTestId("message-copy-button");
		fireEvent.click(copyButton);

		await waitFor(() => {
			expect(writeTextMock).toHaveBeenCalledWith("最初のメッセージ");
		});

		// メニューを再度開いて「コピー済」表示を確認
		fireEvent.click(menuTriggers[0]);
		await waitFor(() => {
			expect(screen.getByTestId("message-copy-button")).toHaveTextContent(
				"コピー済",
			);
		});
	});

	it("コピー失敗時にエラー表示する", async () => {
		const writeTextMock = vi.fn().mockRejectedValue(new Error("Permission denied"));
		vi.stubGlobal("navigator", {
			clipboard: { writeText: writeTextMock },
		});

		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);

		const copyButton = await screen.findByTestId("message-copy-button");
		fireEvent.click(copyButton);

		await waitFor(() => {
			expect(screen.getByTestId("copy-error")).toHaveTextContent(
				"コピーに失敗しました。",
			);
		});
	});

	it("コピー操作後も編集・削除フローが正常に動作する", async () => {
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", {
			clipboard: { writeText: writeTextMock },
		});

		const confirmMock = vi.fn(() => true);
		vi.stubGlobal("confirm", confirmMock);

		const updatedMessage = {
			id: 1,
			body: "編集後メッセージ",
			created_at: "2026-02-09T10:00:00Z",
		};

		fetchMock
			.mockResolvedValueOnce(jsonResponse({ user: sampleUser }))
			.mockResolvedValueOnce(jsonResponse({ messages: sampleMessages }))
			.mockResolvedValueOnce(jsonResponse(updatedMessage))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		await screen.findByText("最初のメッセージ");

		// コピー操作
		const menuTriggers = screen.getAllByTestId("message-menu-trigger");
		fireEvent.click(menuTriggers[0]);
		fireEvent.click(await screen.findByTestId("message-copy-button"));

		await waitFor(() => {
			expect(writeTextMock).toHaveBeenCalled();
		});

		// 編集操作
		fireEvent.click(menuTriggers[0]);
		fireEvent.click(await screen.findByTestId("message-edit-button"));

		const textarea = screen.getByTestId("edit-textarea");
		fireEvent.change(textarea, { target: { value: "編集後メッセージ" } });
		fireEvent.click(screen.getByTestId("edit-save-button"));

		await waitFor(() => {
			expect(screen.getByText("編集後メッセージ")).toBeInTheDocument();
		});

		// 削除操作
		fireEvent.click(menuTriggers[1]);
		fireEvent.click(await screen.findByTestId("message-delete-button"));

		await waitFor(() => {
			expect(
				screen.queryByText("リンク付き https://example.com"),
			).not.toBeInTheDocument();
		});
	});
});
