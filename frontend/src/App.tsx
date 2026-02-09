import "./App.css";
import { AuthHeader } from "./components/AuthHeader";
import { LoginForm } from "./components/LoginForm";
import { MessageComposer } from "./components/MessageComposer";
import { MessageList } from "./components/MessageList";
import { useAuth } from "./hooks/useAuth";
import { useMessages } from "./hooks/useMessages";

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

	const { messages, isLoadingMessages, messagesError, timelineRef } =
		useMessages(user, setUser);

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
				/>
				<MessageComposer />
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
