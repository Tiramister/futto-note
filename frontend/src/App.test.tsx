import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const fetchMock = vi.fn<typeof fetch>();

describe("App", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it("ヘルスチェック成功時に接続成功を表示する", async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("health-status")).toHaveTextContent("接続成功");
		});
	});

	it("ヘルスチェック失敗時に接続失敗を表示する", async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("health-status")).toHaveTextContent("接続失敗");
		});
	});
});
