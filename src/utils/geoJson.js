export const isValidGeoJsonPoint = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [longitude, latitude] = coordinates;

  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    return false;
  }

  if (longitude < -180 || longitude > 180) {
    return false;
  }

  if (latitude < -90 || latitude > 90) {
    return false;
  }

  return true;
};

export const toGeoJsonPoint = (coordinates) => ({
  type: 'Point',
  coordinates,
});
