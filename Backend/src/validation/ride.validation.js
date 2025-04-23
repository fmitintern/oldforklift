export function validateRideBooking(rideDetails) {
  const requiredFields = [
    'userId', 
    'fromLocation', 
    'toLocation', 
    'vehicleType', 
    'rideType'
  ];
  
  const validationErrors = {};
  let isValid = true;

  requiredFields.forEach(field => {
    if (!rideDetails[field]) {
      validationErrors[field] = "This field is required";
      isValid = false;
    }
  });

  // Additional validations can be added here
  if (rideDetails.userId && isNaN(Number(rideDetails.userId))) {
    validationErrors.userId = "Must be a valid number";
    isValid = false;
  }

  return { isValid, validationErrors };
}