import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Message } from "../types";
import { MessageList } from "./MessageList";

function renderMessageList(messages: Message[]) {
	render(
		<MessageList
			messages={messages}
			isLoadingMessages={false}
			messagesError=""
			timelineRef={createRef<HTMLDivElement>()}
			latestMessageRef={createRef<HTMLLIElement>()}
			editState={null}
			onStartEdit={vi.fn()}
			onEditBodyChange={vi.fn()}
			onSaveEdit={vi.fn()}
			onCancelEdit={vi.fn()}
			onDelete={vi.fn()}
		/>,
	);
}

function getSeparatorLabels(): string[] {
	return screen
		.getAllByTestId("message-date-separator")
		.map((element) => (element.textContent ?? "").trim());
}

function addDays(label: string, days: number): string {
	const [year, month, day] = label
		.split("/")
		.map((value) => Number.parseInt(value, 10));
	const date = new Date(Date.UTC(year, month - 1, day));
	date.setUTCDate(date.getUTCDate() + days);

	const resultYear = date.getUTCFullYear();
	const resultMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
	const resultDay = String(date.getUTCDate()).padStart(2, "0");
	return `${resultYear}/${resultMonth}/${resultDay}`;
}

describe("MessageList", () => {
	afterEach(() => {
		cleanup();
	});

	it("日付境界のメッセージでのみセパレーターを表示する", () => {
		renderMessageList([
			{ id: 1, body: "day1", created_at: "2025-01-16T12:00:00Z" },
			{ id: 2, body: "day2", created_at: "2025-01-17T12:00:00Z" },
		]);

		const labels = getSeparatorLabels();
		expect(labels).toHaveLength(2);
		expect(labels[0]).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
		expect(labels[1]).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
		expect(new Set(labels).size).toBe(2);
	});

	it("同一日付の連続メッセージではセパレーターを重複表示しない", () => {
		renderMessageList([
			{ id: 1, body: "m1", created_at: "2025-01-16T12:00:00Z" },
			{ id: 2, body: "m2", created_at: "2025-01-16T13:00:00Z" },
			{ id: 3, body: "m3", created_at: "2025-01-16T14:00:00Z" },
		]);

		expect(screen.getAllByTestId("message-date-separator")).toHaveLength(1);
	});

	it("メッセージのない日付のセパレーターを補間表示しない", () => {
		renderMessageList([
			{ id: 1, body: "day1", created_at: "2025-01-16T12:00:00Z" },
			{ id: 2, body: "day3", created_at: "2025-01-18T12:00:00Z" },
		]);

		const labels = getSeparatorLabels();
		expect(labels).toHaveLength(2);

		const interpolatedLabel = addDays(labels[0], 1);
		expect(labels).not.toContain(interpolatedLabel);
	});

	it("ロケール依存形式ではなく yyyy/MM/dd 固定で表示する", () => {
		const createdAt = "2025-01-06T12:00:00Z";
		renderMessageList([{ id: 1, body: "single", created_at: createdAt }]);

		const label = getSeparatorLabels()[0];
		const date = new Date(createdAt);
		const jaLocaleText = new Intl.DateTimeFormat("ja-JP", {
			dateStyle: "long",
		}).format(date);
		const enLocaleText = new Intl.DateTimeFormat("en-US", {
			dateStyle: "short",
		}).format(date);

		expect(label).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
		expect(label).not.toBe(jaLocaleText);
		expect(label).not.toBe(enLocaleText);
	});
});
