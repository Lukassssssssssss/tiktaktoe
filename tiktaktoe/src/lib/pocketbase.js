import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');


export function isAuthenticated() {
    return pb.authStore.isValid;
}


export function getCurrentUser() {
    return pb.authStore.model;
}


export async function signUp(email, password, username) {
    try {
        const data = {
            email: email,
            password: password,
            passwordConfirm: password,
            username: username
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