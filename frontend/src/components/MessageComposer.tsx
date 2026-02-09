import type { FormEvent, KeyboardEvent } from "react";

type MessageComposerProps = {
	value: string;
	isSubmitting: boolean;
	errorMessage: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
};

export function MessageComposer({
	value,
	isSubmitting,
	errorMessage,
	onChange,
	onSubmit,
}: MessageComposerProps) {
	const isSubmitDisabled = isSubmitting || value === "";

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSubmit();
	};

	const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && event.ctrlKey) {
			event.preventDefault();
			onSubmit();
		}
	};

	return (
		<div className="composer-area">
			<form
				className="composer"
				data-testid="message-input-area"
				onSubmit={handleSubmit}
			>
				<textarea
					id="draft-message"
					name="draft-message"
					aria-label="メッセージ入力"
					placeholder="メッセージを入力"
					value={value}
					disabled={isSubmitting}
					onChange={(event) => onChange(event.target.value)}
					onKeyDown={handleTextareaKeyDown}
				/>
				<button type="submit" disabled={isSubmitDisabled}>
					送信
				</button>
			</form>
			{errorMessage !== "" && (
				<p className="status status--error composer__error" role="alert">
					{errorMessage}
				</p>
			)}
		</div>
	);
}
