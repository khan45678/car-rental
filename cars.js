document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadCars();
    
    // Apply filters
    document.getElementById('applyFilters').addEventListener('click', loadCars);
    
    // Booking form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
});

async function loadCars() {
    const carTypeFilter = document.getElementById('carTypeFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    try {
        const response = await fetch('http://localhost:3000/cars');
        let cars = await response.json();
        
        // Apply filters
        if (carTypeFilter) {
            cars = cars.filter(car => car.type === carTypeFilter);
        }
        
        if (priceFilter) {
            cars = cars.filter(car => car.pricePerDay <= parseInt(priceFilter));
        }
        
        displayCars(cars);
    } catch (error) {
        console.error('Error loading cars:', error);
        alert('Failed to load cars. Please try again.');
    }
}

function displayCars(cars) {
    const container = document.getElementById('carsContainer');
    container.innerHTML = '';
    
    if (cars.length === 0) {
        container.innerHTML = '<div class="col-12"><p>No cars found matching your criteria.</p></div>';
        return;
    }
    
    cars.forEach(car => {
        const carCard = document.createElement('div');
        carCard.className = 'col-md-4 mb-4';
        carCard.innerHTML = `
            <div class="card h-100">
                <img src="${car.image || 'https://via.placeholder.com/300x200?text=Car+Image'}" class="card-img-top" alt="${car.make} ${car.model}">
                <div class="card-body">
                    <h5 class="card-title">${car.make} ${car.model}</h5>
                    <p class="card-text">
                        <strong>Type:</strong> ${car.type}<br>
                        <strong>Year:</strong> ${car.year}<br>
                        <strong>Price:</strong> PKR ${car.pricePerDay}/day
                    </p>
                    <button class="btn btn-primary book-btn" data-car-id="${car.id}">Book Now</button>
                </div>
            </div>
        `;
        container.appendChild(carCard);
    });
    
    // Add event listeners to book buttons
    document.querySelectorAll('.book-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const carId = this.getAttribute('data-car-id');
            openBookingModal(carId);
        });
    });
}

function openBookingModal(carId) {
    document.getElementById('carId').value = carId;
    
    // Set minimum date to tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    document.getElementById('pickupDate').min = minDate;
    document.getElementById('returnDate').min = minDate;
    
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

async function handleBooking(e) {
    e.preventDefault();
    
    const user = checkAuth();
    if (!user) return;
    
    const carId = document.getElementById('carId').value;
    const pickupDate = document.getElementById('pickupDate').value;
    const returnDate = document.getElementById('returnDate').value;
    const driverOption = document.getElementById('driverOption').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    
    // Business constraint: Minimum rental duration of 1 day
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const diffTime = Math.abs(returnD - pickup);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
        alert('Minimum rental duration is 1 day');
        return;
    }
    
    // Business constraint: Maximum rental duration of 30 days
    if (diffDays > 30) {
        alert('Maximum rental duration is 30 days');
        return;
    }
    
    try {
        // Get car details
        const carResponse = await fetch(`http://localhost:3000/cars/${carId}`);
        const car = await carResponse.json();
        
        // Calculate total price
        let totalPrice = car.pricePerDay * diffDays;
        if (driverOption === 'with_driver') {
            totalPrice += 2000 * diffDays;
        }
        
        // Create booking
        const booking = {
            userId: user.id,
            carId: car.id,
            carMake: car.make,
            carModel: car.model,
            carImage: car.image,
            pickupDate,
            returnDate,
            driverOption,
            pickupLocation,
            totalPrice,
            status: 'upcoming',
            createdAt: new Date().toISOString()
        };
        
        // Save booking
        const bookingResponse = await fetch('http://localhost:3000/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(booking)
        });
        
        const createdBooking = await bookingResponse.json();
        
        // Add booking to user's bookings
        const userResponse = await fetch(`http://localhost:3000/users/${user.id}`);
        const currentUser = await userResponse.json();
        
        currentUser.bookings.push(createdBooking.id);
        
        await fetch(`http://localhost:3000/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentUser)
        });
        
        // Show success message
        const toast = new bootstrap.Toast(document.createElement('div'));
        toast._element.classList.add('toast', 'align-items-center', 'text-white', 'bg-success');
        toast._element.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">Booking successful!</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        document.body.appendChild(toast._element);
        toast.show();
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        modal.hide();
        document.getElementById('bookingForm').reset();
        
        // Redirect to bookings page
        setTimeout(() => {
            window.location.href = 'bookings.html';
        }, 1000);
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('Booking failed. Please try again.');
    }
}