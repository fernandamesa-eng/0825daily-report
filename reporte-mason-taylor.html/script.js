const webhookURL = "/.netlify/functions/enviarReporte";

function agregarEmpleado() {
  const empleadosLista = [
    "Angel Valdivia", "Boris Ramirez", "Camilo Rodriguez", "Carlos Boror", "Edilberto Duarte",
    "Ernesto Orozco", "Esdra Zuniga", "Francisco Meza", "Gabriel Castillo", "Gabriel Mejia",
    "Genaro Nogales", "Gerardo Guillen", "Hugo Duarte", "Jorge Caballero", "Jorge Cardona",
    "Jorge Pena", "Jose Lopez", "Julio Duarte", "Lorenzo Mateo", "Luis Lopez",
    "Manuel Rojas", "Mateo Mateo", "Raul Ordonez", "Ricardo Martinez", "Rodolfo Lopez",
    "Virbes Mateo", "New Guy"
  ];

  const div = document.createElement("div");
  div.classList.add("empleado-row");
  div.style.display = "grid";
  div.style.gridTemplateColumns = "repeat(6, 1fr)";
  div.style.gap = "10px";
  div.style.alignItems = "center";
  div.style.marginBottom = "15px";

  let selectHTML = '<select name="empleado[]" required><option value="">Selecciona empleado</option>';
  empleadosLista.forEach(empleado => {
    selectHTML += `<option value="${empleado}">${empleado}</option>`;
  });
  selectHTML += '</select>';

  div.innerHTML = `
    ${selectHTML}
    <input type="time" name="clockIn[]" required>
    <input type="time" name="startBreak[]">
    <input type="time" name="endBreak[]">
    <input type="time" name="clockOut[]" required>
    <button type="button" class="btn-eliminar" onclick="eliminarEmpleado(this)" title="Eliminar">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;

  document.getElementById("empleados").appendChild(div);
}

function eliminarEmpleado(button) {
  const row = button.parentElement;
  row.remove();
}

document.getElementById("dailyReportForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const data = new FormData(form);

  const empleados = data.getAll("empleado[]");
  const clockIns = data.getAll("clockIn[]");
  const startBreaks = data.getAll("startBreak[]");
  const endBreaks = data.getAll("endBreak[]");
  const clockOuts = data.getAll("clockOut[]");

  const empleadosData = empleados.map((nombre, i) => ({
    nombre,
    clockIn: clockIns[i],
    startBreak: startBreaks[i],
    endBreak: endBreaks[i],
    clockOut: clockOuts[i]
  }));

  const payload = {
    nombre: data.get("nombre"),
    fecha: data.get("fecha"),
    ubicacion: data.get("ubicacion"),
    trade: data.get("trade"),
    equipo: data.get("equipo"),
    inspeccion: data.get("inspeccion"),
    material: data.get("material"),
    alcance: data.get("alcance"),
    cambios: data.get("cambios"),
    empleados: empleadosData
  };

  // 📄 Generar PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("MASON-TAYLOR CONSTRUCTION", 105, 15, { align: "center" });
  doc.setFontSize(14);
  doc.text("Foreman Daily Report", 105, 25, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Nombre: ${payload.nombre}`, 14, 40);
  doc.text(`Fecha: ${payload.fecha}`, 105, 40);
  doc.text(`Ubicación: ${payload.ubicacion}`, 14, 50);
  doc.text(`Trade: ${payload.trade}`, 105, 50);

  doc.autoTable({
    startY: 60,
    head: [['Empleado', 'Clock In', 'Start Break', 'End Break', 'Clock Out']],
    body: empleadosData.map(e => [
      e.nombre, e.clockIn, e.startBreak, e.endBreak, e.clockOut
    ]),
    styles: { fontSize: 10, font: 'helvetica' }
  });

  let finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Alquiler de equipo: ${payload.equipo}`, 14, finalY);
  doc.text(`Inspecciones: ${payload.inspeccion}`, 14, finalY + 10);
  doc.text(`Compra de materiales: ${payload.material}`, 14, finalY + 20);
  finalY += 35;

  doc.setFont("helvetica", "bold");
  doc.text("Alcance del trabajo:", 14, finalY);
  doc.setFont("helvetica", "normal");
  const alcanceText = doc.splitTextToSize(payload.alcance || "-", 180);
  doc.text(alcanceText, 14, finalY + 6);
  finalY += 10 + alcanceText.length * 5;

  doc.setFont("helvetica", "bold");
  doc.text("Cambios solicitados por el cliente:", 14, finalY);
  doc.setFont("helvetica", "normal");
  const cambiosText = doc.splitTextToSize(payload.cambios || "-", 180);
  doc.text(cambiosText, 14, finalY + 6);

  // 📎 Convertir PDF a base64
  try {
    const pdfBase64 = doc.output("datauristring").split(',')[1];
    payload.pdfBase64 = pdfBase64;
  } catch (err) {
    alert("❌ Error generando el PDF.");
    return;
  }

  // 📤 Enviar al webhook
  try {
    const response = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    alert("✅ Enviado a Google Sheets y por correo.");
    form.reset();
    document.getElementById("empleados").innerHTML = ""; // Limpia empleados
    agregarEmpleado(); // Agrega una fila vacía
  } catch (err) {
    console.error("Error al enviar:", err);
    alert("❌ No se pudo enviar el reporte. Revisa la consola para más detalles.");
  }
});

