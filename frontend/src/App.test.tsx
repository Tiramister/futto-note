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
					credentials: "same-origin",
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
});
