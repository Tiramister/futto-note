import { useEffect, useState } from "react";

type HealthStatus = "loading" | "success" | "error";

function App() {
	const [status, setStatus] = useState<HealthStatus>("loading");

	useEffect(() => {
		const controller = new AbortController();

		const checkHealth = async () => {
			try {
				const response = await fetch("/api/health", {
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error(`health check failed: ${response.status}`);
				}
				setStatus("success");
			} catch {
				if (!controller.signal.aborted) {
					setStatus("error");
				}
			}
		};

		void checkHealth();

		return () => {
			controller.abort();
		};
	}, []);

	return (
		<main className="app">
			<h1>Futto Note Health Check</h1>
			<p className={`status status--${status}`} data-testid="health-status">
				{status === "loading" && "接続確認中..."}
				{status === "success" && "接続成功"}
				{status === "error" && "接続失敗"}
			</p>
		</main>
	);
}

export default App;
