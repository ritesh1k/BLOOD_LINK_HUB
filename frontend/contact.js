// scripts.js
document.getElementById('contactForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (name === '' || email === '' || subject === '' || message === '') {
        alert('Please fill out all fields.');
    } else {
        try {
            await submitContactMessage({
                user_id: currentUser?.id || null,
                name,
                email,
                subject,
                message
            });
            alert('Thank you for your message! We will get back to you soon.');
            document.getElementById('contactForm').reset();
        } catch (error) {
            alert(error.message || 'Unable to send message. Please try again.');
        }
    }
});

const mapFrame = document.getElementById('nearbyMap');
const locationStatus = document.getElementById('locationStatus');
const locationFilters = document.querySelectorAll('.location-filter');

let userPosition = null;
let selectedPlaceType = 'blood donation center';

function buildMapQuery(placeType, position) {
    if (!position) {
        return 'India';
    }

    const { latitude, longitude } = position;
    return `${placeType} near ${latitude},${longitude}`;
}

function updateMap(placeType) {
    if (!mapFrame) {
        return;
    }

    const query = encodeURIComponent(buildMapQuery(placeType, userPosition));
    mapFrame.src = `https://www.google.com/maps?q=${query}&output=embed`;
}

function setActiveFilter(button) {
    locationFilters.forEach((filterButton) => {
        filterButton.classList.toggle('active', filterButton === button);
    });
}

locationFilters.forEach((button) => {
    button.addEventListener('click', () => {
        selectedPlaceType = button.dataset.place || 'blood donation center';
        setActiveFilter(button);
        updateMap(selectedPlaceType);
    });
});

function setLocationStatus(message, isError = false) {
    if (!locationStatus) {
        return;
    }

    locationStatus.textContent = message;
    locationStatus.classList.toggle('error', isError);
}

function initializeNearbyLocation() {
    if (!navigator.geolocation) {
        setLocationStatus('Geolocation is not supported by your browser. Showing default map.', true);
        updateMap(selectedPlaceType);
        return;
    }

    setLocationStatus('Detecting your current location...');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userPosition = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            setLocationStatus('Showing places near your current location. Use the buttons to switch categories.');
            updateMap(selectedPlaceType);
        },
        () => {
            setLocationStatus('Location access denied or unavailable. Showing default map.', true);
            updateMap(selectedPlaceType);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

initializeNearbyLocation();