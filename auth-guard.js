// auth-guard.js
// Include this script on any page that requires the student to be logged in
// (e.g. booking.html). It redirects to login.html if no valid token is found.

(function () {
  const token = localStorage.getItem('hostelhub_token');

  if (!token) {
    window.location.href = 'login.html';
  }
})();

/* ── Helper: attach this to any fetch() that needs auth ──
   Example usage in booking.js:

   const token = localStorage.getItem('hostelhub_token');

   fetch('http://localhost:3000/api/bookings', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({ hostelId, checkIn, checkOut })
   });
*/

/* ── Helper: logout function — call this from a logout button ── */
function logout() {
  localStorage.removeItem('hostelhub_token');
  localStorage.removeItem('hostelhub_user');
  window.location.href = 'login.html';
}
