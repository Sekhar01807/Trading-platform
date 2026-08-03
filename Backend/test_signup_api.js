
async function signupUser() {
    const url = 'http://localhost:3000/signup';
    const userData = {
        email: `test_user_${Date.now()}@example.com`,
        password: 'password123',
        username: `testuser_${Date.now()}`
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        console.log('Signup Response:', data);
    } catch (error) {
        console.error('Error simulating signup:', error);
    }
}

signupUser();
