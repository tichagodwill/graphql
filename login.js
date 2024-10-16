
function login() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const credentials = btoa(`${username}:${password}`); 
    try {
        const response = await fetch(`https://learn.reboot01.com/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (response.ok || response.status === 204) {
            const data = await response.json();
            localStorage.setItem('token', data); 
            window.location.href = 'profile.html';
        } else {
            document.getElementById('error-message').innerText = 'Invalid Credentials';
        }
    } catch (error) {
        console.error('Login failed:', error);
    }
});
}
login();