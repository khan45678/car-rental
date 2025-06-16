// Common functions used across multiple pages

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Check authentication on pages that require it
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
    }
    return user;
}

// Logout button functionality
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Display user name in dashboard
const userNameElement = document.getElementById('userName');
if (userNameElement) {
    const user = checkAuth();
    if (user) {
        userNameElement.textContent = user.name.split(' ')[0]; // Show first name only
    }
}