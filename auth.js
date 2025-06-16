// Check if user is logged in
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
    }
    return user;
}

// Login function
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('http://localhost:3000/users');
        const users = await response.json();
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Show success toast
            const toast = new bootstrap.Toast(document.createElement('div'));
            toast._element.classList.add('toast', 'align-items-center', 'text-white', 'bg-success');
            toast._element.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">Login successful!</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            document.body.appendChild(toast._element);
            toast.show();
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            alert('Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Register function
document.getElementById('registerLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
});

document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newUser = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value,
        cnic: document.getElementById('regCnic').value,
        bookings: []
    };
    
    // Business constraint: CNIC validation
    if (!/^\d{5}-\d{7}-\d{1}$/.test(newUser.cnic)) {
        alert('Please enter a valid CNIC in the format XXXXX-XXXXXXX-X');
        return;
    }
    
    // Business constraint: Phone number validation
    if (!/^\d{11}$/.test(newUser.phone)) {
        alert('Please enter a valid 11-digit phone number');
        return;
    }
    
    try {
        // Check if user already exists
        const response = await fetch('http://localhost:3000/users');
        const users = await response.json();
        
        if (users.some(u => u.email === newUser.email)) {
            alert('Email already registered');
            return;
        }
        
        // Register new user
        const registerResponse = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        
        const createdUser = await registerResponse.json();
        
        // Show success toast
        const toast = new bootstrap.Toast(document.createElement('div'));
        toast._element.classList.add('toast', 'align-items-center', 'text-white', 'bg-success');
        toast._element.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">Registration successful! Please login.</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        document.body.appendChild(toast._element);
        toast.show();
        
        // Close modal and clear form
        const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        modal.hide();
        document.getElementById('registerForm').reset();
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});

// Logout function
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Display user name if logged in
const userNameElement = document.getElementById('userName');
if (userNameElement) {
    const user = checkAuth();
    if (user) {
        userNameElement.textContent = user.name.split(' ')[0]; // Show first name only
    }
}