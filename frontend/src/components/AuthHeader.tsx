type AuthHeaderProps = {
	username: string;
	isUserMenuOpen: boolean;
	isLoggingOut: boolean;
	onToggleUserMenu: () => void;
	onLogout: () => void;
};

export function AuthHeader({
	username,
	isUserMenuOpen,
	isLoggingOut,
	onToggleUserMenu,
	onLogout,
}: AuthHeaderProps) {
	return (
		<header className="timeline-header">
			<h1 className="timeline-title">Futto Note</h1>
			<div className="account-menu">
				<button
					type="button"
					className="account-menu__trigger"
					aria-expanded={isUserMenuOpen}
					aria-haspopup="menu"
					onClick={onToggleUserMenu}
				>
					{username}
				</button>
				{isUserMenuOpen && (
					<div className="account-menu__panel" role="menu">
						<button
							type="button"
							className="account-menu__logout"
							onClick={onLogout}
							disabled={isLoggingOut}
						>
							{isLoggingOut ? "ログアウト中..." : "ログアウト"}
						</button>
					</div>
				)}
			</div>
		</header>
	);
}
