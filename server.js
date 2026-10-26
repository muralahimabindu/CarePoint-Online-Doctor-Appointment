
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "appointments.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

const doctors = [
  { id: 1, name: "Dr. Ananya Rao", specialty: "General Physician", fee: 400 },
  { id: 2, name: "Dr. Karthik Reddy", specialty: "Cardiologist", fee: 700 },
  { id: 3, name: "Dr. Meera Sharma", specialty: "Dermatologist", fee: 500 },
  { id: 4, name: "Dr. Rahul Verma", specialty: "Pediatrician", fee: 600 },
  { id: 5, name: "Dr. Priya Nair", specialty: "Dentist", fee: 350 }
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CareConnect - Doctor Appointment</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#f0f5fb;color:#20334d}
header{background:#174c86;color:white;text-align:center;padding:24px}
header h1{margin:0 0 8px}
nav{background:white;padding:14px;text-align:center;position:sticky;top:0}
nav a{color:#174c86;text-decoration:none;margin:0 12px;font-weight:bold;font-size:14px}
main{max-width:900px;width:92%;margin:25px auto}
section{background:white;padding:22px;margin-bottom:22px;border-radius:12px;box-shadow:0 3px 12px #0001}
h2{color:#174c86;margin-top:0}
label{display:block;margin-top:13px;font-size:14px;font-weight:bold}
input,select,textarea{display:block;width:100%;margin-top:6px;padding:11px;border:1px solid #ccd6e2;border-radius:6px;font:inherit}
button{margin-top:14px;padding:11px 15px;background:#2768d9;color:white;border:0;border-radius:6px;cursor:pointer}
button:hover{background:#174caa}
.doctor,.appointment{padding:14px;margin:10px 0;border:1px solid #dce5ef;border-radius:8px}
.doctor button{margin-left:8px}
small{color:#61738a}
#message{font-weight:bold}
footer{text-align:center;padding:20px;color:#61738a}
@media(max-width:600px){main{width:95%}section{padding:15px}nav a{display:inline-block;margin:6px}}
</style>
</head>
<body>
<header>
<h1>✚ CareConnect</h1>
<p>Your Health, Our Priority</p>
<p>Online Doctor Appointment System</p>
</header>
<nav>
<a href="#doctors">Doctors</a>
<a href="#book">Book Appointment</a>
<a href="#appointments">My Appointments</a>
</nav>
<main>
<section id="doctors">
<h2>Available Doctors</h2>
<input id="search" placeholder="Search doctor or specialty...">
<select id="filter">
<option value="">All Specialties</option>
</select>
<div id="doctorList">Loading doctors...</div>
</section>

<section id="book">
<h2>Book an Appointment</h2>
<form id="bookingForm">
<label>Patient Name *</label>
<input name="patientName" required maxlength="100" placeholder="Enter your full name">

<label>Email *</label>
<input name="email" type="email" required placeholder="example@gmail.com">

<label>Phone Number *</label>
<input name="phone" type="tel" required pattern="[0-9+() -]{7,20}" placeholder="Enter phone number">

<label>Select Doctor *</label>
<select name="doctorId" id="doctorSelect" required>
<option value="">Choose a doctor</option>
</select>

<label>Appointment Date *</label>
<input name="date" id="date" type="date" required>

<label>Appointment Time *</label>
<select name="time" required>
<option value="">Choose time</option>
<option>09:00 AM</option>
<option>10:00 AM</option>
<option>11:00 AM</option>
<option>12:00 PM</option>
<option>02:00 PM</option>
<option>03:00 PM</option>
<option>04:00 PM</option>
<option>05:00 PM</option>
</select>

<label>Reason for Visit *</label>
<textarea name="reason" rows="3" maxlength="500" required placeholder="Briefly describe your reason"></textarea>

<p>Consultation Fee: <strong id="fee">Select a doctor</strong></p>
<button type="submit" id="submitBtn">Confirm Appointment</button>
</form>
<p id="message" role="status"></p>
</section>

<section id="appointments">
<h2>My Appointments</h2>
<button id="refresh">Refresh Appointments</button>
<div id="appointmentList">Loading appointments...</div>
</section>
</main>
<footer>
<p>CareConnect | Full Stack Development Student Project</p>
<small>Demo application only. Not a real medical service.</small>
</footer>

<script>
const $ = id => document.getElementById(id);
let doctors = [];

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
  }[c]));
}

async function loadDoctors() {
  doctors = await request("/api/doctors");

  $("doctorSelect").innerHTML =
    '<option value="">Choose a doctor</option>';

  $("filter").innerHTML =
    '<option value="">All Specialties</option>';

  [...new Set(doctors.map(d => d.specialty))].forEach(s => {
    $("filter").innerHTML +=
      '<option value="' + escapeText(s) + '">' + escapeText(s) + '</option>';
  });

  doctors.forEach(d => {
    $("doctorSelect").innerHTML +=
      '<option value="' + d.id + '">' +
      escapeText(d.name) + ' - Rs. ' + d.fee + '</option>';
  });

  showDoctors();
}

function showDoctors() {
  const search = $("search").value.toLowerCase();
  const filter = $("filter").value;

  const found = doctors.filter(d =>
    (d.name + " " + d.specialty).toLowerCase().includes(search) &&
    (!filter || d.specialty === filter)
  );

  $("doctorList").innerHTML = found.length ? found.map(d =>
    '<div class="doctor"><h3>' + escapeText(d.name) + '</h3>' +
    '<p>Specialty: ' + escapeText(d.specialty) + '</p>' +
    '<p>Experience: Specialist doctor</p>' +
    '<p>Consultation Fee: Rs. ' + d.fee + '</p>' +
    '<button onclick="chooseDoctor(' + d.id + ')">Book this doctor</button></div>'
  ).join("") : "No doctors found.";
}

function chooseDoctor(id) {
  $("doctorSelect").value = id;
  updateFee();
  $("book").scrollIntoView({behavior:"smooth"});
}

function updateFee() {
  const doctor = doctors.find(d => d.id === Number($("doctorSelect").value));
  $("fee").textContent = doctor ? "Rs. " + doctor.fee : "Select a doctor";
}

async function loadAppointments() {
  try {
    const items = await request("/api/appointments");
    $("appointmentList").innerHTML = items.length ? items.map(a =>
      '<div class="appointment"><h3>' + escapeText(a.patientName) + '</h3>' +
      '<p>Appointment ID: ' + escapeText(a.id) + '</p>' +
      '<p>Doctor: ' + escapeText(a.doctorName) + '</p>' +
      '<p>Date: ' + escapeText(a.date) + ' | Time: ' + escapeText(a.time) + '</p>' +
      '<p>Email: ' + escapeText(a.email) + '</p>' +
      '<p>Phone: ' + escapeText(a.phone) + '</p>' +
      '<p>Reason: ' + escapeText(a.reason) + '</p>' +
      '<p>Fee: Rs. ' + a.fee + '</p>' +
      '<p>Status: <strong>' + escapeText(a.status) + '</strong></p>' +
      (a.status === "Confirmed" ?
      '<button onclick="cancelBooking(\\'' + escapeText(a.id) + '\\')">Cancel Appointment</button>' : '') +
      '</div>'
    ).join("") : "No appointments booked yet.";
  } catch (e) {
    $("appointmentList").textContent = e.message;
  }
}

async function cancelBooking(id) {
  if (!confirm("Cancel this appointment?")) return;
  try {
    const result = await request("/api/appointments/" + encodeURIComponent(id), {
      method: "DELETE"
    });
    alert(result.message);
    await loadAppointments();
  } catch (e) {
    alert(e.message);
  }
}

$("bookingForm").addEventListener("submit", async event => {
  event.preventDefault();
  $("message").textContent = "Processing...";
  $("submitBtn").disabled = true;

  try {
    const data = Object.fromEntries(new FormData(event.target).entries());
    const result = await request("/api/appointments", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });

    $("message").textContent =
      result.message + " Your ID: " + result.appointment.id;

    event.target.reset();
    updateFee();
    await loadAppointments();
  } catch (e) {
    $("message").textContent = e.message;
  } finally {
    $("submitBtn").disabled = false;
  }
});

$("doctorSelect").addEventListener("change", updateFee);
$("search").addEventListener("input", showDoctors);
$("filter").addEventListener("change", showDoctors);
$("refresh").addEventListener("click", loadAppointments);

$("date").min = new Date().toISOString().slice(0, 10);

Promise.all([loadDoctors(), loadAppointments()]).catch(e => {
  $("doctorList").textContent = "Error loading doctors: " + e.message;
});
</script>
</body>
</html>`;

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

function getAppointments() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:" + PORT);

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  if (req.method === "GET" && url.pathname === "/api/doctors") {
    return sendJSON(res, 200, doctors);
  }

  if (req.method === "GET" && url.pathname === "/api/appointments") {
    return sendJSON(res, 200, getAppointments());
  }

  if (req.method === "POST" && url.pathname === "/api/appointments") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
      if (body.length > 100000) req.destroy();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const doctor = doctors.find(d => d.id === Number(data.doctorId));

        if (!data.patientName || !data.email || !data.phone ||
            !data.date || !data.time || !data.reason || !doctor) {
          return sendJSON(res, 400, { error: "Please fill all fields." });
        }

        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email)) {
          return sendJSON(res, 400, { error: "Enter a valid email." });
        }

        const today = new Date().toLocaleDateString("en-CA");
        if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(data.date) || data.date < today) {
          return sendJSON(res, 400, { error: "Choose a valid future date." });
        }

        const appointments = getAppointments();

        const duplicate = appointments.some(a =>
          a.doctorId === doctor.id &&
          a.date === data.date &&
          a.time === data.time &&
          a.status === "Confirmed"
        );

        if (duplicate) {
          return sendJSON(res, 409, {
            error: "This doctor already has a booking at that time."
          });
        }

        const appointment = {
          id: Date.now().toString(),
          patientName: String(data.patientName).trim().slice(0, 100),
          email: String(data.email).trim().slice(0, 150),
          phone: String(data.phone).trim().slice(0, 30),
          doctorId: doctor.id,
          doctorName: doctor.name,
          date: data.date,
          time: data.time,
          reason: String(data.reason).trim().slice(0, 500),
          fee: doctor.fee,
          status: "Confirmed"
        };

        appointments.push(appointment);
        fs.writeFileSync(DATA_FILE, JSON.stringify(appointments, null, 2));

        return sendJSON(res, 201, {
          message: "Appointment booked successfully!",
          appointment
        });
      } catch (error) {
        return sendJSON(res, 400, { error: "Invalid request data." });
      }
    });

    return;
  }

  if (req.method === "DELETE" &&
      url.pathname.startsWith("/api/appointments/")) {
    const id = url.pathname.split("/").pop();
    const appointments = getAppointments();
    const appointment = appointments.find(a => a.id === id);

    if (!appointment) {
      return sendJSON(res, 404, { error: "Appointment not found." });
    }

    appointment.status = "Cancelled";
    fs.writeFileSync(DATA_FILE, JSON.stringify(appointments, null, 2));
    return sendJSON(res, 200, { message: "Appointment cancelled." });
  }

  sendJSON(res, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log("CareConnect started!");
  console.log("Open http://localhost:" + PORT);
});
