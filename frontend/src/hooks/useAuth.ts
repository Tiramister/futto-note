import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { User } from "../types";

type MeResponse = {
	user: User;
};

type LoginPayload = {
	username: string;
	password: string;
};

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

export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [logoutError, setLogoutError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

	useEffect(() => {
		if (!user) {
			setIsUserMenuOpen(false);
		}
	}, [user]);

	useEffect(() => {
		const controller = new AbortController();

		const checkSession = async () => {
			try {
				const response = await fetch("/api/me", {
					method: "GET",
					credentials: "same-origin",
					signal: controller.signal,
				});
				if (response.ok) {
					const data = (await response.json()) as MeResponse;
					setUser(data.user);
				} else if (response.status === 401) {
					setUser(null);
				} else {
					setUser(null);
				}
			} catch {
				if (!controller.signal.aborted) {
					setUser(null);
				}
			} finally {
				if (!controller.signal.aborted) {
					setIsCheckingAuth(false);
				}
			}
		};

		void checkSession();

		return () => {
			controller.abort();
		};
	}, []);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const normalizedUsername = username.trim();
		if (normalizedUsername === "" || password.trim() === "") {
			setLoginError("ユーザー名とパスワードを入力してください。");
			return;
		}

		setLoginError("");
		setIsSubmitting(true);
		try {
			const payload: LoginPayload = {
				username: normalizedUsername,
				password,
			};
			const response = await fetch("/api/login", {
				method: "POST",
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const message = await parseErrorMessage(
					response,
					"ログインに失敗しました。",
				);
				setLoginError(message);
				return;
			}

			const data = (await response.json()) as MeResponse;
			setUser(data.user);
			setUsername("");
			setPassword("");
			setLoginError("");
		} catch {
			setLoginError("ログインに失敗しました。");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLogout = async () => {
		setLogoutError("");
		setIsLoggingOut(true);
		try {
			const response = await fetch("/api/logout", {
				method: "POST",
				credentials: "same-origin",
			});
			if (!response.ok && response.status !== 204) {
				const message = await parseErrorMessage(
					response,
					"ログアウトに失敗しました。",
				);
				setLogoutError(message);
				return;
			}

			setUser(null);
		} catch {
			setLogoutError("ログアウトに失敗しました。");
		} finally {
			setIsLoggingOut(false);
		}
	};

	const toggleUserMenu = () => setIsUserMenuOpen((open) => !open);

	return {
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
	};
}
