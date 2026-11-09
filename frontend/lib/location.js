// Asks the browser for the customer's position and turns it into a readable address.
export function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Your browser does not support location. Please type your address."));
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          // OpenStreetMap's free reverse-geocoding service (fine for a demo)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`
          );
          if (!res.ok) throw new Error("lookup failed");
          const data = await res.json();
          const a = data.address || {};
          resolve({
            label: a.suburb || a.neighbourhood || a.village || a.town || a.city || a.county || "Current location",
            address: data.display_name || coords,
            lat: latitude,
            lon: longitude, accuracy: pos.coords.accuracy
          });
        } catch {
          resolve({ label: "Current location", address: coords, lat: latitude, lon: longitude, accuracy: pos.coords.accuracy });
        }
      },
      err =>
        reject(new Error(
          err.code === 1
            ? "Location permission was denied. You can type your address instead."
            : "Could not get your location. You can type your address instead."
        )),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}