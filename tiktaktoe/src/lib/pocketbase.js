import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://10.20.0.203:8090');

export function isAuthenticated() {
	return pb.authStore.isValid;
}

export function getCurrentUser() {
	return pb.authStore.model;
}

export async function signUp(email, password, username) {
	try {
		const data = {
			email,
			password,
			passwordConfirm: password,
			username
		};
		const record = await pb.collection('users').create(data);
		return { success: true, user: record };
	} catch (error) {
		console.error('Sign up error:', error);
		return { success: false, error: error.message };
	}
}

export async function login(email, password) {
	try {
		const authData = await pb.collection('users').authWithPassword(email, password);
		return { success: true, user: authData.record };
	} catch (error) {
		console.error('Login error:', error);
		return { success: false, error: error.message };
	}
}

export function logout() {
	pb.authStore.clear();
}

export async function joinGame(code, playerId, playerName) {
	const games = await pb.collection('games').getFullList({
		filter: `code = "${code}" && status = "waiting"`
	});

	if (games.length === 0) throw new Error('Lobby not found or already full');

	const game = games[0];

	const updated = await pb.collection('games').update(game.id, {
		player2: playerId,
		player2_name: playerName,
		status: 'active'
	});
	return updated;
}

export async function subscribeToGame(gameId, callback) {
	await pb.collection('games').subscribe(gameId, (e) => {
		callback(e.record);
	});
}

export async function updateBoard(gameId, board, currentTurn, winner) {
	await pb.collection('games').update(gameId, {
		board: board.join(','),
		current_turn: currentTurn,
		status: winner ? 'finished' : 'active',
		winner: winner || ''
	});
}
export async function createGame(playerId, playerName) {
	const code = Math.random().toString(36).substring(2, 8).toUpperCase();
	const record = await pb.collection('games').create({
		player1: playerId,
		player1_name: playerName,
		code,
		board: ',,,,,,,,',
		current_turn: 'X',
		status: 'waiting'
	});
	return record;
}
