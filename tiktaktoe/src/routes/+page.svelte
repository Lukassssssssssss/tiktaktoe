<script>
	import { signUp, login, logout, isAuthenticated, getCurrentUser } from '$lib/pocketbase.js';

	// State variables for authentication
	let showSignUp = false;
	let showLogin = false;
	let isLoggedIn = isAuthenticated();
	let currentUser = getCurrentUser();

	// Game state
	let showGame = false;
	let board = Array(9).fill(''); // 3x3 grid
	let currentPlayer = 'X';
	let winner = null;
	let isDraw = false;

	// Track player moves for the 3-symbol limit
	let playerMoves = {
		X: [], // Array of positions where X has placed symbols
		O: [] // Array of positions where O has placed symbols
	};

	// Form data for sign up
	let signUpEmail = '';
	let signUpPassword = '';
	let signUpUsername = '';

	// Form data for login
	let loginEmail = '';
	let loginPassword = '';

	// Status messages
	let message = '';
	let isError = false;

	// Function to handle sign up
	async function handleSignUp() {
		if (!signUpEmail || !signUpPassword || !signUpUsername) {
			showMessage('Please fill in all fields', true);
			return;
		}

		const result = await signUp(signUpEmail, signUpPassword, signUpUsername);

		if (result.success) {
			showMessage('Account created successfully! Please log in.', false);
			// Clear form and hide sign up
			signUpEmail = '';
			signUpPassword = '';
			signUpUsername = '';
			showSignUp = false;
		} else {
			showMessage('Error: ' + result.error, true);
		}
	}

	// Function to handle login
	async function handleLogin() {
		if (!loginEmail || !loginPassword) {
			showMessage('Please fill in all fields', true);
			return;
		}

		const result = await login(loginEmail, loginPassword);

		if (result.success) {
			showMessage('Logged in successfully!', false);
			isLoggedIn = true;
			currentUser = result.user;
			// Clear form and hide login
			loginEmail = '';
			loginPassword = '';
			showLogin = false;
		} else {
			showMessage('Error: ' + result.error, true);
		}
	}

	// Function to handle logout
	function handleLogout() {
		logout();
		isLoggedIn = false;
		currentUser = null;
		showMessage('Logged out successfully!', false);
	}

	// Helper function to show messages
	function showMessage(text, error = false) {
		message = text;
		isError = error;
		// Clear message after 3 seconds
		setTimeout(() => {
			message = '';
		}, 3000);
	}

	// Game Functions

	// Function to make a move
	function makeMove(position) {
		// Can't place on occupied cell or if game is over
		if (board[position] !== '' || winner || isDraw) return;

		// If current player already has 3 symbols, remove the oldest one first
		if (playerMoves[currentPlayer].length >= 3) {
			const oldestPosition = playerMoves[currentPlayer][0]; // Get the oldest position
			board[oldestPosition] = ''; // Remove the symbol from board
			playerMoves[currentPlayer].shift(); // Remove from tracking array
		}

		// Place new symbol on the board
		board[position] = currentPlayer;

		// Add this position to the player's move tracking
		playerMoves[currentPlayer].push(position);

		// Check for winner after placing the symbol
		winner = checkWinner();

		// Check for draw if no winner
		if (!winner) {
			isDraw = checkDraw();
		}

		// Switch to the other player if game continues
		if (!winner && !isDraw) {
			currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
		}
	}

	// Function to check for winner
	function checkWinner() {
		// All possible winning combinations
		const winPatterns = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8], // Rows
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8], // Columns
			[0, 4, 8],
			[2, 4, 6] // Diagonals
		];

		for (const pattern of winPatterns) {
			const [a, b, c] = pattern;
			if (board[a] && board[a] === board[b] && board[a] === board[c]) {
				return board[a]; // Return the winning player
			}
		}

		return null; // No winner
	}

	// Function to check for draw
	function checkDraw() {
		// In this variant, a draw is rare since symbols get removed
		// We'll consider it a draw if the board is full and no winner
		// (which shouldn't happen often with the 3-symbol limit)
		const filledCells = board.filter((cell) => cell !== '').length;
		return filledCells === 9 && !winner;
	}

	// Function to reset the game
	function resetGame() {
		board = Array(9).fill('');
		currentPlayer = 'X';
		winner = null;
		isDraw = false;
		playerMoves = {
			X: [],
			O: []
		};
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
	<div class="w-full max-w-md space-y-8">
		<!-- Welcome heading -->
		<div class="text-center">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Welcome to TikTakToe</h1>
			<p class="text-gray-600">Sign up or log in to continue</p>
		</div>

		<!-- Status message -->
		{#if message}
			<div
				class="rounded-md p-3 text-center {isError
					? 'bg-red-100 text-red-700'
					: 'bg-green-100 text-green-700'}"
			>
				{message}
			</div>
		{/if}

		<!-- Main buttons for non-authenticated users -->
		{#if !isLoggedIn}
			<div class="space-y-4">
				<!-- Sign Up and Login buttons -->
				{#if !showSignUp && !showLogin}
					<div class="space-y-3">
						<button
							on:click={() => {
								showSignUp = true;
								showLogin = false;
							}}
							class="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition duration-200 hover:bg-blue-700"
						>
							Sign Up
						</button>

						<button
							on:click={() => {
								showLogin = true;
								showSignUp = false;
							}}
							class="w-full rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white transition duration-200 hover:bg-gray-700"
						>
							Login
						</button>
					</div>
				{/if}

				<!-- Sign Up Form -->
				{#if showSignUp}
					<div class="rounded-lg bg-white p-6 shadow-md">
						<h2 class="mb-4 text-center text-xl font-semibold">Create Account</h2>

						<form on:submit|preventDefault={handleSignUp} class="space-y-4">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Username</label>
								<input
									type="text"
									bind:value={signUpUsername}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
								<input
									type="email"
									bind:value={signUpEmail}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Password</label>
								<input
									type="password"
									bind:value={signUpPassword}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							</div>

							<div class="space-y-2">
								<button
									type="submit"
									class="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-blue-700"
								>
									Create Account
								</button>

								<button
									type="button"
									on:click={() => {
										showSignUp = false;
									}}
									class="w-full rounded-md bg-gray-300 px-4 py-2 font-semibold text-gray-700 transition duration-200 hover:bg-gray-400"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				{/if}

				<!-- Login Form -->
				{#if showLogin}
					<div class="rounded-lg bg-white p-6 shadow-md">
						<h2 class="mb-4 text-center text-xl font-semibold">Login</h2>

						<form on:submit|preventDefault={handleLogin} class="space-y-4">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
								<input
									type="email"
									bind:value={loginEmail}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Password</label>
								<input
									type="password"
									bind:value={loginPassword}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							</div>

							<div class="space-y-2">
								<button
									type="submit"
									class="w-full rounded-md bg-gray-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-gray-700"
								>
									Login
								</button>

								<button
									type="button"
									on:click={() => {
										showLogin = false;
									}}
									class="w-full rounded-md bg-gray-300 px-4 py-2 font-semibold text-gray-700 transition duration-200 hover:bg-gray-400"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Welcome message for authenticated users (only show when not in game) -->
		{#if isLoggedIn && currentUser && !showGame}
			<div class="rounded-lg bg-white p-6 text-center shadow-md">
				<h2 class="mb-2 text-2xl font-semibold text-green-600">Welcome back!</h2>
				<p class="mb-4 text-gray-700">Hello, {currentUser.username}!</p>
				<p class="mb-6 text-sm text-gray-500">Email: {currentUser.email}</p>

				<div class="space-y-3">
					<button
						on:click={() => (showGame = true)}
						class="w-full rounded-md bg-green-600 px-4 py-3 font-semibold text-white transition duration-200 hover:bg-green-700"
					>
						Create Game
					</button>

					<button
						on:click={handleLogout}
						class="w-full rounded-md bg-red-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-red-700"
					>
						Logout
					</button>
				</div>
			</div>
		{/if}

		<!-- Tic Tac Toe Game -->
		{#if showGame && isLoggedIn}
			<div class="rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-center text-2xl font-semibold">Tic Tac Toe</h2>
					<button
						on:click={() => (showGame = false)}
						class="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
					>
						Back
					</button>
				</div>

				<!-- Game Info -->
				<div class="mb-4 text-center">
					<p class="text-lg">
						Current Player: <span
							class="font-bold text-{currentPlayer === 'X' ? 'blue' : 'red'}-600"
							>{currentPlayer}</span
						>
					</p>
					<p class="text-sm text-gray-600">Each player can only have 3 symbols on the board!</p>
					{#if winner}
						<p class="mt-2 text-xl font-bold text-green-600">🎉 Player {winner} Wins! 🎉</p>
					{:else if isDraw}
						<p class="mt-2 text-xl font-bold text-yellow-600">It's a Draw!</p>
					{/if}
				</div>

				<!-- Game Board -->
				<div class="mx-auto mb-4 grid max-w-xs grid-cols-3 gap-2">
					{#each board as cell, index}
						<button
							on:click={() => makeMove(index)}
							disabled={winner || isDraw}
							class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-gray-300
                                   bg-gray-100 text-3xl font-bold transition duration-200 hover:bg-gray-200
                                   {cell === 'X'
								? 'text-blue-600'
								: cell === 'O'
									? 'text-red-600'
									: ''}"
						>
							{cell}
						</button>
					{/each}
				</div>

				<!-- Reset Game Button -->
				<div class="text-center">
					<button
						on:click={resetGame}
						class="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-blue-700"
					>
						New Game
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
