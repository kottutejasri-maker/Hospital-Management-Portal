import { useEffect, useMemo, useState } from "react";

import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { addItem, deleteItem, getItem, getItems, updateItem } from "./services/api.js";



const emptyDoctor = {

  name: "", specialization: "General Medicine", experience: "", phone: "", email: "", available: true

};

const emptyPatient = { name: "", age: "", gender: "Female", phone: "", email: "" };

const emptyAppointment = {

  patientId: "", doctorId: "", date: "", time: "", reason: "", status: "Booked"

};



const specializations = [

  "General Medicine", "Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics", "Dentistry"

];

const statuses = ["Booked", "Confirmed", "Completed", "Cancelled"];



function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<PortalApp />} />

        <Route path="/doctors" element={<PortalApp />} />

        <Route path="/patients" element={<PortalApp />} />

        <Route path="/appointments" element={<PortalApp />} />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

    </BrowserRouter>

  );

}



function PortalApp() {

  const navigate = useNavigate();

  const location = useLocation();

  const pageByPath = { "/": "Dashboard", "/doctors": "Doctors", "/patients": "Patients", "/appointments": "Appointments" };

  const pathByPage = { Dashboard: "/", Doctors: "/doctors", Patients: "/patients", Appointments: "/appointments" };

  const page = pageByPath[location.pathname] || "Dashboard";

  function setPage(nextPage) {

    navigate(pathByPage[nextPage] || "/");

  }

  const [doctors, setDoctors] = useState([]);

  const [patients, setPatients] = useState([]);

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("success");

  const [doctorForm, setDoctorForm] = useState(emptyDoctor);

  const [patientForm, setPatientForm] = useState(emptyPatient);

  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);

  const [editing, setEditing] = useState(null);

  const [doctorSearch, setDoctorSearch] = useState("");

  const [doctorSpecialization, setDoctorSpecialization] = useState("All");

  const [patientSearch, setPatientSearch] = useState("");

  const [filterDate, setFilterDate] = useState("");

  const [filterStatus, setFilterStatus] = useState("All");

  const [filterDoctor, setFilterDoctor] = useState("All");

  const [showDoctorForm, setShowDoctorForm] = useState(false);

  const [showPatientForm, setShowPatientForm] = useState(false);

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);



  async function refreshData() {

    try {

      const [d, p, a] = await Promise.all([

        getItems("doctors"), getItems("patients"), getItems("appointments")

      ]);

      setDoctors(d);

      setPatients(p);

      setAppointments(a);

      setMessage("");

    } catch (error) {

      setMessage(error.message);

      setMessageType("error");

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => { refreshData(); }, []);



  function notify(text, type = "success") {

    setMessage(text);

    setMessageType(type);

    window.setTimeout(() => setMessage(""), 3500);

  }



  function patientName(id) {

    return patients.find((p) => String(p.id) === String(id))?.name || "Unknown patient";

  }

  function doctorName(id) {

    return doctors.find((d) => String(d.id) === String(id))?.name || "Unknown doctor";

  }



  async function saveDoctor(event) {

    event.preventDefault();

    if (!doctorForm.name.trim() || !doctorForm.phone.trim() || !doctorForm.email.trim()) {

      return notify("Please fill in all required doctor fields.", "error");

    }

    const item = { ...doctorForm, experience: Number(doctorForm.experience || 0), available: Boolean(doctorForm.available) };

    try {

      if (editing) await updateItem("doctors", editing, item);

      else await addItem("doctors", item);

      await refreshData();

      notify(editing ? "Doctor updated successfully." : "Doctor added successfully.");

      setDoctorForm(emptyDoctor); setEditing(null); setShowDoctorForm(false);

    } catch (error) { notify(error.message, "error"); }

  }



  async function savePatient(event) {

    event.preventDefault();

    if (!patientForm.name.trim() || !patientForm.phone.trim() || !patientForm.email.trim()) {

      return notify("Please fill in all required patient fields.", "error");

    }

    const item = { ...patientForm, age: Number(patientForm.age || 0) };

    try {

      if (editing) await updateItem("patients", editing, item);

      else await addItem("patients", item);

      await refreshData();

      notify(editing ? "Patient updated successfully." : "Patient added successfully.");

      setPatientForm(emptyPatient); setEditing(null); setShowPatientForm(false);

    } catch (error) { notify(error.message, "error"); }

  }



  async function saveAppointment(event) {
    event.preventDefault();

    if (
      !appointmentForm.patientId ||
      !appointmentForm.doctorId ||
      !appointmentForm.date ||
      !appointmentForm.time ||
      !appointmentForm.reason.trim()
    ) {
      return notify("Please complete all appointment fields.", "error");
    }

    const selectedPatient = patients.find(
      (patient) => String(patient.id) === String(appointmentForm.patientId)
    );
    const selectedDoctor = doctors.find(
      (doctor) => String(doctor.id) === String(appointmentForm.doctorId)
    );

    if (!selectedPatient) {
      return notify("Please select a valid patient.", "error");
    }
    if (!selectedDoctor) {
      return notify("Please select a valid doctor.", "error");
    }
    if (!selectedDoctor.available) {
      return notify("This doctor is currently unavailable. Please choose another doctor.", "error");
    }

    const appointmentStatus = appointmentForm.status || "Booked";
    const conflict = appointments.some((appointment) =>
      String(appointment.doctorId) === String(selectedDoctor.id) &&
      appointment.date === appointmentForm.date &&
      appointment.time === appointmentForm.time &&
      appointment.status !== "Cancelled" &&
      String(appointment.id) !== String(editing)
    );

    if (conflict) {
      return notify("This doctor already has an appointment at that date and time.", "error");
    }

    // Save the selected records' IDs, not their names.
    const appointmentData = {
      patientId: String(selectedPatient.id),
      doctorId: String(selectedDoctor.id),
      date: appointmentForm.date,
      time: appointmentForm.time,
      reason: appointmentForm.reason.trim(),
      status: appointmentStatus
    };

    try {
      if (editing) {
        await updateItem("appointments", editing, appointmentData);
      } else {
        await addItem("appointments", appointmentData);
      }
      await refreshData();
      notify(editing ? "Appointment updated successfully." : "Appointment booked successfully.");
      setAppointmentForm(emptyAppointment);
      setEditing(null);
      setShowAppointmentForm(false);
    } catch (error) {
      notify(error.message || "Unable to save appointment.", "error");
    }
  }

  async function removeItem(resource, id, label) {

    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;

    try {

      await deleteItem(resource, id);

      await refreshData();

      notify(`${label[0].toUpperCase() + label.slice(1)} deleted successfully.`);

    } catch (error) { notify(error.message, "error"); }

  }



  async function editDoctor(doctor) {

    try {

      const latestDoctor = await getItem("doctors", doctor.id);

      setDoctorForm({ ...latestDoctor, experience: String(latestDoctor.experience ?? ""), available: Boolean(latestDoctor.available) });

      setEditing(latestDoctor.id);

      setShowDoctorForm(true);

    } catch (error) { notify(error.message, "error"); }

  }

  async function editPatient(patient) {

    try {

      const latestPatient = await getItem("patients", patient.id);

      setPatientForm({ ...latestPatient, age: String(latestPatient.age ?? "") });

      setEditing(latestPatient.id);

      setShowPatientForm(true);

    } catch (error) { notify(error.message, "error"); }

  }

  async function editAppointment(appointment) {

    try {

      const latestAppointment = await getItem("appointments", appointment.id);

      setAppointmentForm({ ...latestAppointment });

      setEditing(latestAppointment.id);

      setShowAppointmentForm(true);

    } catch (error) { notify(error.message, "error"); }

  }



  async function cancelAppointment(appointment) {

    if (!window.confirm("Cancel this appointment?")) return;

    try {

      await updateItem("appointments", appointment.id, { ...appointment, status: "Cancelled" });

      await refreshData();

      notify("Appointment cancelled successfully.");

    } catch (error) { notify(error.message, "error"); }

  }



  const filteredDoctors = useMemo(() => doctors.filter((d) =>

    `${d.name} ${d.specialization}`.toLowerCase().includes(doctorSearch.toLowerCase()) &&

    (doctorSpecialization === "All" || d.specialization === doctorSpecialization)

  ), [doctors, doctorSearch, doctorSpecialization]);



  const filteredPatients = useMemo(() => patients.filter((p) =>

    `${p.name} ${p.phone}`.toLowerCase().includes(patientSearch.toLowerCase())

  ), [patients, patientSearch]);



  const filteredAppointments = useMemo(() => appointments.filter((a) =>

    (!filterDate || a.date === filterDate) &&

    (filterStatus === "All" || a.status === filterStatus) &&

    (filterDoctor === "All" || String(a.doctorId) === String(filterDoctor))

  ), [appointments, filterDate, filterStatus, filterDoctor]);



  const upcomingAppointments = [...appointments]

    .filter((a) => a.status !== "Cancelled")

    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))

    .slice(0, 5);



  return (

    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand"><span className="brand-icon">✚</span><span>CarePoint<br /><small>Hospital Portal</small></span></div>

        <div className="side-label">MAIN MENU</div>

        {["Dashboard", "Doctors", "Patients", "Appointments"].map((item) => (

          <button key={item} className={`nav-link ${page === item ? "active" : ""}`} onClick={() => setPage(item)}>

            <span>{({ Dashboard: "▦", Doctors: "⚕", Patients: "♙", Appointments: "▣" })[item]}</span>{item}

          </button>

        ))}

        <div className="sidebar-note"><strong>Care made simple</strong><small>Hospital appointment management</small></div>

      </aside>



      <main className="main-area">

        <header className="topbar">

          <div><div className="eyebrow">HOSPITAL MANAGEMENT</div><h1>Hospital Appointment Portal</h1></div>

         

        </header>



        {message && <div className={`alert ${messageType}`} role="status"><span>{messageType === "error" ? "⚠" : "✓"}</span>{message}<button onClick={() => setMessage("")}>×</button></div>}

        {loading ? <div className="loading">Loading hospital data…</div> : (

          <>

            {page === "Dashboard" && <section>

              <div className="page-heading"><div><h2>Dashboard</h2><p>Here is an overview of your hospital.</p></div><span className="today-pill">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>

              <div className="stats-grid">

                <StatCard title="Total Doctors" value={doctors.length} icon="⚕" tone="blue" />

                <StatCard title="Total Patients" value={patients.length} icon="♙" tone="green" />

                <StatCard title="Total Appointments" value={appointments.length} icon="▣" tone="orange" />

                <StatCard title="Cancelled" value={appointments.filter((a) => a.status === "Cancelled").length} icon="×" tone="red" />

              </div>

              <div className="dashboard-grid">

                <div className="panel"><div className="panel-heading"><div><h3>Appointments by status</h3><p>Current appointment summary</p></div></div>

                  <div className="status-summary">{statuses.map((status) => <div className="status-line" key={status}><span className={`status-dot ${status.toLowerCase()}`}></span><span>{status}</span><strong>{appointments.filter((a) => a.status === status).length}</strong></div>)}</div>

                </div>

                <div className="panel"><div className="panel-heading"><div><h3>Recent appointments</h3><p>Latest scheduled visits</p></div><button className="text-button" onClick={() => setPage("Appointments")}>View all →</button></div>

                  {upcomingAppointments.length ? <div className="mini-list">{upcomingAppointments.map((a) => <div className="mini-row" key={a.id}><div className="date-icon">▣</div><div className="mini-info"><strong>{patientName(a.patientId)}</strong><small>{doctorName(a.doctorId)} · {a.date} {a.time}</small></div><StatusBadge status={a.status} /></div>)}</div> : <Empty text="No appointments yet. Book your first appointment." />}

                </div>

              </div>

              <div className="quick-actions"><h3>Quick actions</h3><button onClick={() => { setPage("Doctors"); setDoctorForm(emptyDoctor); setEditing(null); setShowDoctorForm(true); }}>＋ Add doctor</button><button onClick={() => { setPage("Patients"); setPatientForm(emptyPatient); setEditing(null); setShowPatientForm(true); }}>＋ Add patient</button><button onClick={() => { setPage("Appointments"); setAppointmentForm(emptyAppointment); setEditing(null); setShowAppointmentForm(true); }}>＋ Book appointment</button></div>

            </section>}



            {page === "Doctors" && <section>

              <div className="page-heading"><div><h2>Doctors</h2><p>Manage your hospital's doctors and availability.</p></div><button className="primary-button" onClick={() => { setDoctorForm(emptyDoctor); setEditing(null); setShowDoctorForm(true); }}>＋ Add Doctor</button></div>

              <div className="panel">

                <div className="toolbar"><input aria-label="Search doctors" placeholder="Search by name or specialization…" value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} /><select aria-label="Filter specialization" value={doctorSpecialization} onChange={(e) => setDoctorSpecialization(e.target.value)}><option value="All">All specializations</option>{specializations.map((s) => <option key={s}>{s}</option>)}</select></div>

                <div className="table-wrap"><table><thead><tr><th>Doctor</th><th>Specialization</th><th>Experience</th><th>Phone</th><th>Availability</th><th>Actions</th></tr></thead><tbody>

                  {filteredDoctors.map((d) => <tr key={d.id}><td><div className="person-cell"><span className="person-avatar doctor-avatar">{initials(d.name)}</span><span><strong>{d.name}</strong><small>{d.email}</small></span></div></td><td>{d.specialization}</td><td>{d.experience} years</td><td>{d.phone}</td><td><span className={`availability ${d.available ? "yes" : "no"}`}>{d.available ? "Available" : "Unavailable"}</span></td><td><div className="actions"><button className="small-button" onClick={() => editDoctor(d)}>Edit</button><button className="small-button danger" onClick={() => removeItem("doctors", d.id, "doctor")}>Delete</button></div></td></tr>)}

                </tbody></table>{filteredDoctors.length === 0 && <Empty text="No doctors found." />}</div>

              </div>

            </section>}



            {page === "Patients" && <section>

              <div className="page-heading"><div><h2>Patients</h2><p>Maintain patient contact information.</p></div><button className="primary-button" onClick={() => { setPatientForm(emptyPatient); setEditing(null); setShowPatientForm(true); }}>＋ Add Patient</button></div>

              <div className="panel"><div className="toolbar"><input aria-label="Search patients" placeholder="Search by patient name or phone…" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} /></div>

                <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Age</th><th>Gender</th><th>Phone</th><th>Email</th><th>Actions</th></tr></thead><tbody>

                  {filteredPatients.map((p) => <tr key={p.id}><td><div className="person-cell"><span className="person-avatar patient-avatar">{initials(p.name)}</span><strong>{p.name}</strong></div></td><td>{p.age}</td><td>{p.gender}</td><td>{p.phone}</td><td>{p.email}</td><td><div className="actions"><button className="small-button" onClick={() => editPatient(p)}>Edit</button><button className="small-button danger" onClick={() => removeItem("patients", p.id, "patient")}>Delete</button></div></td></tr>)}

                </tbody></table>{filteredPatients.length === 0 && <Empty text="No patients found." />}</div>

              </div>

            </section>}



            {page === "Appointments" && <section>

              <div className="page-heading"><div><h2>Appointments</h2><p>Book and track patient visits.</p></div><button className="primary-button" onClick={() => { setAppointmentForm(emptyAppointment); setEditing(null); setShowAppointmentForm(true); }}>＋ Book Appointment</button></div>

              <div className="panel"><div className="toolbar appointment-filters"><input aria-label="Filter by date" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /><select aria-label="Filter by status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="All">All statuses</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select><select aria-label="Filter by doctor" value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)}><option value="All">All doctors</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select><button className="clear-button" onClick={() => { setFilterDate(""); setFilterStatus("All"); setFilterDoctor("All"); }}>Clear filters</button></div>

                <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Doctor</th><th>Date & time</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>

                  {filteredAppointments.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{patientName(a.patientId)}</strong></td>
                      <td>{doctorName(a.doctorId)}</td>
                      <td>{a.date}<small className="cell-sub">{a.time}</small></td>
                      <td>{a.reason}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <div className="actions">
                          <button className="small-button" onClick={() => editAppointment(a)}>Edit</button>
                          {a.status !== "Cancelled" && a.status !== "Completed" && (
                            <button className="small-button danger" onClick={() => cancelAppointment(a)}>Cancel</button>
                          )}
                          <button className="small-button danger" onClick={() => removeItem("appointments", a.id, "appointment")}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody></table>{filteredAppointments.length === 0 && <Empty text="No appointments match these filters." />}</div>

              </div>

            </section>}

          </>

        )}

        <footer><span>Hospital Appointment Management</span> </footer>

      </main>



      {showDoctorForm && <Modal title={editing ? "Edit doctor" : "Add doctor"} onClose={() => { setShowDoctorForm(false); setEditing(null); setDoctorForm(emptyDoctor); }}>

        <form onSubmit={saveDoctor} className="form-grid">

          <label>Doctor name \*<input required value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} placeholder="e.g. Dr. Priya" /></label>

          <label>Specialization \*<select value={doctorForm.specialization} onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}>{specializations.map((s) => <option key={s}>{s}</option>)}</select></label>

          <label>Experience (years)<input type="number" min="0" value={doctorForm.experience} onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })} /></label>

          <label>Phone \*<input required type="tel" pattern="[0-9]{10}" title="Enter a 10-digit phone number" value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} placeholder="10-digit number" /></label>

          <label className="full-width">Email \*<input required type="email" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} placeholder="doctor@example.com" /></label>

          <label className="checkbox-label full-width"><input type="checkbox" checked={doctorForm.available} onChange={(e) => setDoctorForm({ ...doctorForm, available: e.target.checked })} /> Doctor is available</label>

          <div className="form-actions full-width"><button type="button" className="secondary-button" onClick={() => setShowDoctorForm(false)}>Cancel</button><button className="primary-button">{editing ? "Save changes" : "Add doctor"}</button></div>

        </form>

      </Modal>}



      {showPatientForm && <Modal title={editing ? "Edit patient" : "Add patient"} onClose={() => { setShowPatientForm(false); setEditing(null); setPatientForm(emptyPatient); }}>

        <form onSubmit={savePatient} className="form-grid">

          <label className="full-width">Patient name \*<input required value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} placeholder="Enter full name" /></label>

          <label>Age \*<input required type="number" min="0" max="120" value={patientForm.age} onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })} /></label>

          <label>Gender<select value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}><option>Female</option><option>Male</option><option>Other</option></select></label>

          <label>Phone \*<input required type="tel" pattern="[0-9]{10}" title="Enter a 10-digit phone number" value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} placeholder="10-digit number" /></label>

          <label>Email \*<input required type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} placeholder="patient@example.com" /></label>

          <div className="form-actions full-width"><button type="button" className="secondary-button" onClick={() => setShowPatientForm(false)}>Cancel</button><button className="primary-button">{editing ? "Save changes" : "Add patient"}</button></div>

        </form>

      </Modal>}



      {showAppointmentForm && <Modal title={editing ? "Edit appointment" : "Book appointment"} onClose={() => { setShowAppointmentForm(false); setEditing(null); setAppointmentForm(emptyAppointment); }}>

        <form onSubmit={saveAppointment} className="form-grid">

          <label>Patient \*<select required value={appointmentForm.patientId} onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>

          <label>Doctor \*<select required value={appointmentForm.doctorId} onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}><option value="">Select doctor</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name} {d.available ? "" : "(Unavailable)"}</option>)}</select></label>

          <label>Date \*<input required type="date" min={new Date().toISOString().slice(0, 10)} value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} /></label>

          <label>Time \*<input required type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} /></label>

          <label className="full-width">Reason for visit \*<textarea required rows="3" value={appointmentForm.reason} onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })} placeholder="e.g. Regular checkup" /></label>

          {editing && <label className="full-width">Status<select value={appointmentForm.status} onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></label>}

          <div className="form-actions full-width"><button type="button" className="secondary-button" onClick={() => setShowAppointmentForm(false)}>Cancel</button><button className="primary-button">{editing ? "Save changes" : "Book appointment"}</button></div>

        </form>

      </Modal>}

    </div>

  );

}



function StatCard({ title, value, icon, tone }) {

  return <div className={`stat-card ${tone}`}><div className="stat-icon">{icon}</div><div><p>{title}</p><strong>{value}</strong></div></div>;

}

function StatusBadge({ status }) { return <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>; }

function Empty({ text }) { return <div className="empty-state"><span>▧</span><p>{text}</p></div>; }

function initials(name = "") { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }

function Modal({ title, onClose, children }) {

  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-heading"><h3>{title}</h3><button className="close-button" type="button" onClick={onClose}>×</button></div>{children}</div></div>;

}



export default App;
