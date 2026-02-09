import type { FormEvent } from "react";

type LoginFormProps = {
	username: string;
	password: string;
	loginError: string;
	isSubmitting: boolean;
	onUsernameChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginForm({
	username,
	password,
	loginError,
	isSubmitting,
	onUsernameChange,
	onPasswordChange,
	onSubmit,
}: LoginFormProps) {
	return (
		<main className="app">
			<section className="card" data-testid="login-screen">
				<h1>Futto Note</h1>
				<p className="subtitle">ログインしてメモを管理</p>
				<form className="login-form" onSubmit={onSubmit}>
					<label htmlFor="username">ユーザー名</label>
					<input
						id="username"
						name="username"
						type="text"
						autoComplete="username"
						value={username}
						onChange={(event) => onUsernameChange(event.target.value)}
						disabled={isSubmitting}
					/>

					<label htmlFor="password">パスワード</label>
					<input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(event) => onPasswordChange(event.target.value)}
						disabled={isSubmitting}
					/>

					<button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "ログイン中..." : "ログイン"}
					</button>
				</form>
				{loginError !== "" && (
					<p className="status status--error" role="alert">
						{loginError}
					</p>
				)}
			</section>
		</main>
	);
}
