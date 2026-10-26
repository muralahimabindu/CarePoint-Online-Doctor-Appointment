const $ = (selector) => document.querySelector(selector);
let doctors = [];
let toastTimer;
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
$('#appointmentDate').min = localDate;

function escapeHtml(value='') { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function showToast(message) { const el = $('#toast'); el.textContent = message; el.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), 3500); }
function renderDoctors() {
  const term = $('#doctorSearch').value.trim().toLowerCase();
  const specialty = $('#specialtyFilter').value;
  const filtered = doctors.filter(d => (specialty === 'all' || d.specialty === specialty) && `${d.name} ${d.specialty}`.toLowerCase().includes(term));
  $('#doctorGrid').innerHTML = filtered.map(d => `<article class="doctor-card"><div class="doctor-photo-wrap"><img class="doctor-photo" src="${escapeHtml(d.image)}" alt="${escapeHtml(d.name)}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/500x420/e7f5ef/0c7774?text=CarePoint+Doctor'"><span class="doctor-badge">${escapeHtml(d.availability)} availability</span><span class="doctor-rating"><span>★</span>${escapeHtml(d.rating)} <small>(${d.reviews})</small></span></div><div class="doctor-info"><div class="doctor-specialty">${escapeHtml(d.specialty.toUpperCase())}</div><h3>${escapeHtml(d.name)}</h3><div class="doctor-exp">✚ &nbsp;${escapeHtml(d.experience)}</div><div class="doctor-meta"><div class="doctor-fee">₹${d.fee} <small>/ visit</small></div><button class="btn btn-primary book-doctor" data-book="${d.id}">Book visit <span>→</span></button></div></div></article>`).join('');
  $('#noDoctors').classList.toggle('hidden', filtered.length > 0);
  if (!filtered.length) $('#doctorGrid').innerHTML = '';
}
function openBooking(doctorId) {
  const doctor = doctors.find(d => d.id === Number(doctorId));
  if (!doctor) { showToast('Please choose a doctor first.'); return; }
  $('#doctorId').value = doctor.id;
  $('#selectedDoctor').innerHTML = `<span class="selected-doctor-icon">✚</span><span><strong>${escapeHtml(doctor.name)}</strong><br><small>${escapeHtml(doctor.specialty)} · ₹${doctor.fee} per visit</small></span>`;
  $('#formError').classList.add('hidden'); $('#bookingModal').classList.remove('hidden'); document.body.style.overflow = 'hidden';
}
function closeBooking() { $('#bookingModal').classList.add('hidden'); document.body.style.overflow = ''; }
async function loadAppointments() {
  const list = $('#appointmentList');
  try {
    const response = await fetch('/api/appointments');
    if (!response.ok) throw new Error('Could not load appointments');
    const appointments = await response.json();
    if (!appointments.length) { list.innerHTML = `<div class="empty-appointments"><span class="empty-calendar">▦</span><strong>No appointments yet</strong><p>When you book a visit, it will show up here.</p><a class="btn btn-primary" href="#doctors">Find a doctor</a></div>`; return; }
    list.innerHTML = appointments.map(a => `<article class="appointment-card"><div class="appointment-main"><strong>${escapeHtml(a.doctorName)}</strong><span>${escapeHtml(a.specialty)} · Patient: ${escapeHtml(a.patientName)}</span><span class="appointment-id">BOOKING ID: ${escapeHtml(a.id)}</span></div><div class="appointment-detail"><strong>${escapeHtml(formatDate(a.date))} · ${escapeHtml(a.time)}</strong><span>Consultation fee: ₹${Number(a.fee).toLocaleString('en-IN')}</span><span>${escapeHtml(a.reason)}</span></div><div class="appointment-action"><span class="appointment-status">${escapeHtml(a.status || 'Confirmed')}</span><button class="cancel-btn" data-cancel="${escapeHtml(a.id)}">Cancel appointment</button></div></article>`).join('');
  } catch { list.innerHTML = `<div class="empty-appointments"><strong>Couldn't load appointments</strong><p>Make sure the CarePoint server is running, then refresh.</p><button class="btn btn-outline" id="retryAppointments">Try again</button></div>`; }
}
function formatDate(value) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
async function init() {
  try { const response = await fetch('/api/doctors'); if (!response.ok) throw new Error(); doctors = await response.json(); renderDoctors(); }
  catch { $('#doctorGrid').innerHTML = '<div class="loading-card">Unable to load doctors. Please restart the server and refresh this page.</div>'; }
  await loadAppointments();
}
$('#doctorSearch').addEventListener('input', renderDoctors);
$('#specialtyFilter').addEventListener('change', renderDoctors);
$('#doctorGrid').addEventListener('click', e => { const button = e.target.closest('[data-book]'); if (button) openBooking(button.dataset.book); });
$('#navBook').addEventListener('click', () => { document.querySelector('#doctors').scrollIntoView({behavior:'smooth'}); });
$('#closeModal').addEventListener('click', closeBooking);
$('#bookingModal').addEventListener('click', e => { if (e.target === $('#bookingModal')) closeBooking(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBooking(); });
$('#menuToggle').addEventListener('click', () => $('#navLinks')?.classList.toggle('open'));
// Add the nav ID after the header has loaded so the mobile menu can be toggled.
document.querySelector('.nav-links').id = 'navLinks';
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => $('#navLinks').classList.remove('open')));
$('#bookingForm').addEventListener('submit', async e => {
  e.preventDefault(); const button = $('#submitBooking'); const error = $('#formError'); error.classList.add('hidden');
  const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
  if (!payload.doctorId) { error.textContent = 'Please choose a doctor.'; error.classList.remove('hidden'); return; }
  button.disabled = true; button.innerHTML = 'Saving appointment…';
  try {
    const response = await fetch('/api/appointments', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not book appointment.');
    closeBooking(); e.currentTarget.reset(); $('#appointmentDate').min = localDate; await loadAppointments(); showToast(`Appointment confirmed! Your booking ID is ${result.id}.`); document.querySelector('#appointments').scrollIntoView({behavior:'smooth'});
  } catch (err) { error.textContent = err.message || 'Something went wrong. Please try again.'; error.classList.remove('hidden'); }
  finally { button.disabled = false; button.innerHTML = 'Confirm appointment <span>→</span>'; }
});
$('#appointmentList').addEventListener('click', async e => {
  if (e.target.id === 'retryAppointments') return loadAppointments();
  const button = e.target.closest('[data-cancel]'); if (!button) return;
  if (!confirm('Cancel this appointment?')) return;
  button.disabled = true;
  try { const response = await fetch(`/api/appointments/${encodeURIComponent(button.dataset.cancel)}`,{method:'DELETE'}); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not cancel appointment.'); await loadAppointments(); showToast('Appointment cancelled.'); }
  catch (err) { showToast(err.message || 'Could not cancel appointment.'); button.disabled = false; }
});
$('#refreshAppointments').addEventListener('click', loadAppointments);
init();
