const config = window.INVITATION_CONFIG;
const guestList = document.querySelector("#guest-list");
const status = document.querySelector("#status");
const search = document.querySelector("#search");
const attendanceFilter = document.querySelector("#attendance-filter");
const refreshButton = document.querySelector("#refresh-button");
let guests = [];

function formatDate(value) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderSummary() {
  document.querySelector("#total-count").textContent = guests.length;
  document.querySelector("#yes-count").textContent = guests.filter((guest) => guest.asistencia === "si").length;
  document.querySelector("#no-count").textContent = guests.filter((guest) => guest.asistencia === "no").length;
}

function renderGuests() {
  const searchTerm = search.value.trim().toLocaleLowerCase();
  const attendance = attendanceFilter.value;
  const visibleGuests = guests.filter((guest) => {
    const fullName = `${guest.nombre} ${guest.apellido}`.toLocaleLowerCase();
    return (!searchTerm || fullName.includes(searchTerm)) &&
      (attendance === "todos" || guest.asistencia === attendance);
  });

  guestList.replaceChildren();
  for (const guest of visibleGuests) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.dataset.label = "Invitado";
    nameCell.textContent = `${guest.nombre} ${guest.apellido}`;

    const attendanceCell = document.createElement("td");
    attendanceCell.dataset.label = "Asistencia";
    const badge = document.createElement("span");
    badge.className = `badge ${guest.asistencia}`;
    badge.textContent = guest.asistencia === "si" ? "Confirma" : "No asiste";
    attendanceCell.append(badge);

    const dateCell = document.createElement("td");
    dateCell.dataset.label = "Fecha";
    dateCell.textContent = formatDate(guest.creado_en);

    row.append(nameCell, attendanceCell, dateCell);
    guestList.append(row);
  }

  if (!visibleGuests.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td class="empty" colspan="3">No hay respuestas que coincidan con la búsqueda.</td>';
    guestList.append(row);
  }
}

async function loadGuests() {
  status.textContent = "Cargando confirmaciones...";
  refreshButton.disabled = true;
  try {
    const query = "?select=nombre,apellido,asistencia,creado_en&order=creado_en.desc";
    const response = await fetch(`${config.supabaseUrl}/rest/v1/confirmaciones${query}`, {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`
      }
    });
    if (!response.ok) throw new Error("No se pudo cargar la lista");
    guests = await response.json();
    renderSummary();
    renderGuests();
    status.textContent = `${guests.length} respuesta${guests.length === 1 ? "" : "s"} recibida${guests.length === 1 ? "" : "s"}.`;
  } catch (error) {
    status.textContent = "No se pudo cargar la lista. Revisá la conexión y las políticas de Supabase.";
  } finally {
    refreshButton.disabled = false;
  }
}

search.addEventListener("input", renderGuests);
attendanceFilter.addEventListener("change", renderGuests);
refreshButton.addEventListener("click", loadGuests);
loadGuests();