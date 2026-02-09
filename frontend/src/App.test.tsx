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
			new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
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
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ error: "unauthorized" }), {
					status: 401,
				}),
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ user: sampleUser }), { status: 200 }),
			);

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
		expect(screen.getByText("alice としてログイン中")).toBeInTheDocument();
	});

	it("ログイン失敗時にエラーメッセージを表示する", async () => {
		fetchMock
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ error: "unauthorized" }), {
					status: 401,
				}),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ error: "invalid username or password" }),
					{ status: 401 },
				),
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
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ user: sampleUser }), { status: 200 }),
		);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});
		expect(screen.getByText("alice としてログイン中")).toBeInTheDocument();
	});

	it("ログアウト成功時にログイン画面へ戻る", async () => {
		fetchMock
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ user: sampleUser }), { status: 200 }),
			)
			.mockResolvedValueOnce(new Response(null, { status: 204 }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("main-screen")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: "ログアウト" }));

		await waitFor(() => {
			expect(screen.getByTestId("login-screen")).toBeInTheDocument();
		});
	});
});
