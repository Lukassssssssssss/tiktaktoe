import PocketBase from 'pocketbase';

// Create PocketBase instance - assumes PocketBase is running on localhost:8090
export const pb = new PocketBase('http://127.0.0.1:8090');

// Simple function to check if user is authenticated
export function isAuthenticated() {
    return pb.authStore.isValid;
}

// Function to get current user
export function getCurrentUser() {
    return pb.authStore.model;
}

// Function to sign up a new user
export async function signUp(email, password, username) {
    try {
        const data = {
            email: email,
            password: password,
            passwordConfirm: password,
            username: username
        };
        
        // Create new user record in the auth collection
        const record = await pb.collection('users').create(data);
        return { success: true, user: record };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
}

// Function to log in existing user
export async function login(email, password) {
    try {
        // Authenticate user with email and password
        const authData = await pb.collection('users').authWithPassword(email, password);
        return { success: true, user: authData.record };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Function to log out user
export function logout() {
    pb.authStore.clear();
} 