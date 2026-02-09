type MessageComposerProps = {
	disabled?: boolean;
};

export function MessageComposer({ disabled = true }: MessageComposerProps) {
	return (
		<form className="composer" data-testid="message-input-area">
			<textarea
				id="draft-message"
				name="draft-message"
				placeholder="Step 5 で投稿できるようになります。"
				disabled={disabled}
			/>
			<button type="button" disabled={disabled}>
				送信
			</button>
		</form>
	);
}
