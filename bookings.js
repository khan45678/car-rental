document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadBookings();
    
    // Apply filters
    document.getElementById('applyBookingFilters').addEventListener('click', loadBookings);
    
    // Confirm cancel booking
    document.getElementById('confirmCancel').addEventListener('click', cancelBooking);
});

let currentBookingId = null;

async function loadBookings() {
    const user = checkAuth();
    if (!user) return;
    
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    try {
        // Get user with bookings
        const userResponse = await fetch(`http://localhost:3000/users/${user.id}?_embed=bookings`);
        const currentUser = await userResponse.json();
        
        let bookings = currentUser.bookings || [];
        
        // Apply filters
        if (statusFilter) {
            bookings = bookings.filter(b => b.status === statusFilter);
        }
        
        if (dateFilter === 'this_month') {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            
            bookings = bookings.filter(b => 
                (b.pickupDate >= firstDay && b.pickupDate <= lastDay) ||
                (b.returnDate >= firstDay && b.returnDate <= lastDay)
            );
        } else if (dateFilter === 'next_month') {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];
            
            bookings = bookings.filter(b => 
                (b.pickupDate >= firstDay && b.pickupDate <= lastDay) ||
                (b.returnDate >= firstDay && b.returnDate <= lastDay)
            );
        }
        
        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        alert('Failed to load bookings. Please try again.');
    }
}

function displayBookings(bookings) {
    const tableBody = document.getElementById('bookingsTable');
    tableBody.innerHTML = '';
    
    if (bookings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No bookings found</td></tr>';
        return;
    }
    
    bookings.forEach(booking => {
        const row = document.createElement('tr');
        
        // Format dates
        const pickupDate = new Date(booking.pickupDate).toLocaleDateString();
        const returnDate = new Date(booking.returnDate).toLocaleDateString();
        
        // Determine status badge color
        let statusBadgeClass = 'bg-secondary';
        if (booking.status === 'upcoming') statusBadgeClass = 'bg-primary';
        if (booking.status === 'active') statusBadgeClass = 'bg-success';
        if (booking.status === 'cancelled') statusBadgeClass = 'bg-danger';
        
        row.innerHTML = `
            <td>${booking.carMake} ${booking.carModel}</td>
            <td>${pickupDate} to ${returnDate}</td>
            <td>${booking.pickupLocation}</td>
            <td>PKR ${booking.totalPrice}</td>
            <td><span class="badge ${statusBadgeClass}">${booking.status}</span></td>
            <td>
                <button class="btn btn-sm btn-info view-btn" data-booking-id="${booking.id}">View</button>
                ${booking.status === 'upcoming' ? 
                    `<button class="btn btn-sm btn-danger cancel-btn" data-booking-id="${booking.id}">Cancel</button>` : 
                    ''
                }
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            viewBookingDetails(bookingId);
        });
    });
    
    // Add event listeners to cancel buttons
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            showCancelConfirmation(bookingId);
        });
    });
}

async function viewBookingDetails(bookingId) {
    try {
        const response = await fetch(`http://localhost:3000/bookings/${bookingId}`);
        const booking = await response.json();
        
        // Format dates
        const pickupDate = new Date(booking.pickupDate).toLocaleDateString();
        const returnDate = new Date(booking.returnDate).toLocaleDateString();
        const createdDate = new Date(booking.createdAt).toLocaleString();
        
        // Calculate duration
        const pickup = new Date(booking.pickupDate);
        const returnD = new Date(booking.returnDate);
        const diffTime = Math.abs(returnD - pickup);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Prepare content
        const content = document.getElementById('bookingDetailsContent');
        content.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <img src="${booking.carImage || 'https://via.placeholder.com/300x200?text=Car+Image'}" 
                         class="img-fluid rounded" alt="${booking.carMake} ${booking.carModel}">
                </div>
                <div class="col-md-8">
                    <h4>${booking.carMake} ${booking.carModel}</h4>
                    <p><strong>Booking ID:</strong> ${booking.id}</p>
                    <p><strong>Status:</strong> <span class="badge bg-primary">${booking.status}</span></p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <h5>Rental Details</h5>
                    <p><strong>Pickup Date:</strong> ${pickupDate}</p>
                    <p><strong>Return Date:</strong> ${returnDate}</p>
                    <p><strong>Duration:</strong> ${diffDays} days</p>
                    <p><strong>Pickup Location:</strong> ${booking.pickupLocation}</p>
                    <p><strong>Driver Option:</strong> ${booking.driverOption === 'self' ? 'Self Drive' : 'With Driver'}</p>
                </div>
                <div class="col-md-6">
                    <h5>Payment Details</h5>
                    <p><strong>Daily Rate:</strong> PKR ${(booking.totalPrice / diffDays).toFixed(2)}</p>
                    <p><strong>Total Price:</strong> PKR ${booking.totalPrice}</p>
                    <p><strong>Booking Created:</strong> ${createdDate}</p>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
        modal.show();
    } catch (error) {
        console.error('Error viewing booking details:', error);
        alert('Failed to load booking details. Please try again.');
    }
}

function showCancelConfirmation(bookingId) {
    currentBookingId = bookingId;
    const modal = new bootstrap.Modal(document.getElementById('cancelBookingModal'));
    modal.show();
}

async function cancelBooking() {
    if (!currentBookingId) return;
    
    try {
        // Get booking
        const bookingResponse = await fetch(`http://localhost:3000/bookings/${currentBookingId}`);
        const booking = await bookingResponse.json();
        
        // Business constraint: Check if cancellation is within 24 hours of pickup
        const pickupDate = new Date(booking.pickupDate);
        const now = new Date();
        const hoursToPickup = (pickupDate - now) / (1000 * 60 * 60);
        
        if (hoursToPickup < 24) {
            // Apply cancellation fee (50% of total price)
            booking.cancellationFee = booking.totalPrice * 0.5;
        }
        
        // Update booking status
        booking.status = 'cancelled';
        
        await fetch(`http://localhost:3000/bookings/${currentBookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(booking)
        });
        
        // Show success message
        const toast = new bootstrap.Toast(document.createElement('div'));
        toast._element.classList.add('toast', 'align-items-center', 'text-white', 'bg-success');
        toast._element.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">Booking cancelled successfully${booking.cancellationFee ? ' (Cancellation fee applied)' : ''}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        document.body.appendChild(toast._element);
        toast.show();
        
        // Close modal and reload bookings
        const modal = bootstrap.Modal.getInstance(document.getElementById('cancelBookingModal'));
        modal.hide();
        loadBookings();
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
    }
}