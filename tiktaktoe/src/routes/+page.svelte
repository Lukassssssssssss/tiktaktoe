<script>
	import {
		login,
		signUp,
		logout,
		isAuthenticated,
		getCurrentUser,
		createGame,
		joinGame,
		subscribeToGame,
		updateBoard
	} from '$lib/pocketbase.js';

	let isLoggedIn = isAuthenticated();
	let currentUser = getCurrentUser();
	let showSignUp = false;
	let showLogin = false;
	let showLobby = false;
	let showGame = false;
	let board = Array(9).fill('');
	let currentPlayer = 'X';
	let winner = null;
	let isDraw = false;
	let game = null;
	let lobbyCode = '';
	let message = '';
	let isError = false;

	let signUpEmail = '',
		signUpPassword = '',
		signUpUsername = '';
	let loginEmail = '',
		loginPassword = '';

	function showMessage(text, error = false) {
		message = text;
		isError = error;
		setTimeout(() => (message = ''), 3000);
	}

	async function handleSignUp() {
		if (!signUpEmail || !signUpPassword || !signUpUsername) {
			return showMessage('Please fill in all fields', true);
		}
		const result = await signUp(signUpEmail, signUpPassword, signUpUsername);
		if (result.success) {
			showMessage('Account created! Please log in.', false);
			signUpEmail = signUpPassword = signUpUsername = '';
			showSignUp = false;
		} else showMessage('Error: ' + result.error, true);
	}

	async function handleLogin() {
		if (!loginEmail || !loginPassword) {
			return showMessage('Please fill in all fields', true);
		}
		const result = await login(loginEmail, loginPassword);
		if (result.success) {
			showMessage('Logged in successfully!', false);
			isLoggedIn = true;
			currentUser = result.user;
			loginEmail = loginPassword = '';
			showLogin = false;
		} else showMessage('Error: ' + result.error, true);
	}

	function handleLogout() {
		logout();
		isLoggedIn = false;
		currentUser = null;
		showLobby = showGame = false;
		showMessage('Logged out.', false);
	}

	async function handleCreateGame() {
		const rec = await createGame(currentUser.id, currentUser.username);
		game = rec;
		lobbyCode = rec.code;
		showLobby = true;
		showGame = false;
		await subscribeToGame(game.id, syncGame);
	}

	async function handleJoinGame() {
		try {
			const rec = await joinGame(lobbyCode, currentUser.id, currentUser.username);
			game = rec;
			showGame = true;
			showLobby = false;
			await subscribeToGame(game.id, syncGame);
		} catch (e) {
			showMessage(e.message, true);
		}
	}

	function syncGame(g) {
		game = g;
		board = g.board.split(',');
		currentPlayer = g.current_turn;
		winner = g.winner || null;
		isDraw = g.status === 'finished' && !winner;
		showGame = g.status !== 'waiting';
		showLobby = !showGame && g.status === 'waiting';
	}

	function makeMove(i) {
		if (!game || board[i] || winner || isDraw) return;
		const mySymbol = game.player1 === currentUser.id ? 'X' : 'O';
		if (mySymbol !== currentPlayer) return;
		board[i] = currentPlayer;
		const w = checkWinner();
		const draw = !w && board.every((c) => c);
		const next = currentPlayer === 'X' ? 'O' : 'X';
		updateBoard(game.id, board, next, w);
	}

	function checkWinner() {
		const lines = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6]
		];
		for (const [a, b, c] of lines)
			if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
		return null;
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
	<div class="w-full max-w-md space-y-8">
		<h1 class="text-center text-3xl font-bold">TikTakToe Multiplayer</h1>

		{#if message}
			<div
				class="rounded-md p-3 text-center {isError
					? 'bg-red-100 text-red-700'
					: 'bg-green-100 text-green-700'}"
			>
				{message}
			</div>
		{/if}

		{#if !isLoggedIn}
			<div class="space-y-4">
				{#if !showSignUp && !showLogin}
					<button
						on:click={() => {
							showLogin = true;
							showSignUp = false;
						}}
						class="w-full rounded-lg bg-gray-600 py-3 text-white">Login</button
					>
					<button
						on:click={() => {
							showSignUp = true;
							showLogin = false;
						}}
						class="w-full rounded-lg bg-blue-600 py-3 text-white">Sign Up</button
					>
				{/if}

				{#if showLogin}
					<div class="rounded-lg bg-white p-6 shadow">
						<h2 class="mb-4 text-center text-xl">Login</h2>
						<input
							type="email"
							placeholder="Email"
							bind:value={loginEmail}
							class="mb-2 w-full rounded border p-2"
						/>
						<input
							type="password"
							placeholder="Password"
							bind:value={loginPassword}
							class="mb-4 w-full rounded border p-2"
						/>
						<button on:click={handleLogin} class="w-full rounded bg-gray-600 py-2 text-white"
							>Login</button
						>
						<button
							on:click={() => (showLogin = false)}
							class="mt-2 w-full rounded bg-gray-300 py-2 text-gray-700">Cancel</button
						>
					</div>
				{/if}

				{#if showSignUp}
					<div class="rounded-lg bg-white p-6 shadow">
						<h2 class="mb-4 text-center text-xl">Sign Up</h2>
						<input
							placeholder="Username"
							bind:value={signUpUsername}
							class="mb-2 w-full rounded border p-2"
						/>
						<input
							placeholder="Email"
							bind:value={signUpEmail}
							class="mb-2 w-full rounded border p-2"
						/>
						<input
							type="password"
							placeholder="Password"
							bind:value={signUpPassword}
							class="mb-4 w-full rounded border p-2"
						/>
						<button on:click={handleSignUp} class="w-full rounded bg-blue-600 py-2 text-white"
							>Register</button
						>
						<button
							on:click={() => (showSignUp = false)}
							class="mt-2 w-full rounded bg-gray-300 py-2 text-gray-700">Cancel</button
						>
					</div>
				{/if}
			</div>
		{/if}

		{#if isLoggedIn && !showLobby && !showGame}
			<div class="rounded-lg bg-white p-6 text-center shadow">
				<h2 class="mb-4 text-2xl">Welcome, {currentUser.username}</h2>
				<button
					on:click={handleCreateGame}
					class="mb-3 w-full rounded-lg bg-green-600 py-3 text-white">Create Lobby</button
				>
				<div class="mb-3">
					<input
						placeholder="Enter Lobby Code"
						bind:value={lobbyCode}
						class="w-full rounded border p-2"
					/>
				</div>
				<button on:click={handleJoinGame} class="mb-3 w-full rounded-lg bg-blue-600 py-2 text-white"
					>Join Game</button
				>
				<button on:click={handleLogout} class="w-full rounded-lg bg-red-600 py-2 text-white"
					>Logout</button
				>
			</div>
		{/if}

		{#if showLobby}
			<div class="rounded-lg bg-white p-6 text-center shadow">
				<p class="mb-4">Waiting for opponent...</p>
				<p class="mb-4 text-xl font-semibold">Lobby Code: {lobbyCode}</p>
				<button on:click={handleLogout} class="w-full rounded-lg bg-red-600 py-2 text-white"
					>Cancel / Logout</button
				>
			</div>
		{/if}

		{#if showGame}
			<div class="rounded-lg bg-white p-6 text-center shadow">
				<h2 class="mb-4 text-2xl">Tic Tac Toe</h2>
				<p class="mb-4">
					Current Player: <strong class="text-{currentPlayer === 'X' ? 'blue' : 'red'}-600"
						>{currentPlayer}</strong
					>
				</p>
				<div class="mb-4 grid grid-cols-3 gap-2">
					{#each board as cell, i}
						<button
							on:click={() => makeMove(i)}
							class="h-20 w-20 rounded-lg border text-3xl font-bold {cell === 'X'
								? 'text-blue-600'
								: cell === 'O'
									? 'text-red-600'
									: 'text-gray-700'}"
						>
							{cell}
						</button>
					{/each}
				</div>
				{#if winner}
					<p class="mb-2 text-xl text-green-600">🎉 Player {winner} wins!</p>
				{:else if isDraw}
					<p class="mb-2 text-xl text-yellow-600">It's a draw!</p>
				{/if}
				<button on:click={handleLogout} class="w-full rounded-lg bg-red-600 py-2 text-white"
					>Logout / Exit</button
				>
			</div>
		{/if}
	</div>
</div>
