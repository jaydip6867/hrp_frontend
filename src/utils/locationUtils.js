/**
 * Geolocation permission and coordinates retriever
 * Enforces location access before allowing Clock In or Clock Out
 */
export const requestLocationPermission = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser. Please use a modern browser with GPS/location support.'));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => {
        let msg = 'Location permission is required for Clock In / Clock Out. Please enable location access in your browser.';
        if (err.code === 1) { // PERMISSION_DENIED
          msg = 'Location permission was denied. You must allow location access to Clock In or Clock Out.';
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          msg = 'Location information is unavailable. Please check your device location settings.';
        } else if (err.code === 3) { // TIMEOUT
          msg = 'Location request timed out. Please try again.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};
