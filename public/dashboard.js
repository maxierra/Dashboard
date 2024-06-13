document.addEventListener('DOMContentLoaded', function() {
  // Tu código JavaScript aquí
});

const socket = io();
const transactionList = document.getElementById('transaction-list');
const alertList = document.getElementById('alert-list');
const pendingList = document.getElementById('pending-list');
const http200CountEl = document.getElementById('http200-count');
const httpErrorsCountEl = document.getElementById('http-errors-count');
const emailSentCountEl = document.getElementById('email-sent-count');
const reprocessedCountEl = document.getElementById('reprocessed-count');
const currentDateEl = document.getElementById('current-date');
const f2fErrorCountEl = document.getElementById('f2f-error-count');
const digitalErrorCountEl = document.getElementById('digital-error-count');
const ggpxErrorCountEl = document.getElementById('ggpx-error-count');
const iframeBizlandErrorCountEl = document.getElementById('iframe-bizland-error-count');
const endpointApiBizlandErrorCountEl = document.getElementById('endpoint-api-bizland-error-count');
const httpErrorsStatusEl = document.getElementById('http-errors-status');
const incidentTable = document.getElementById('incident-table').querySelector('tbody');
const webhookErrorCountEl = document.getElementById('webhook-error-count');

let successPercentage = 0;
let http200Count = 0;
let httpErrorsCount = 0;
let emailSentCount = 0;
let reprocessedCount = 0;
let f2fErrorCount = 0;
let digitalErrorCount = 0;
let ggpxErrorCount = 0;
let iframeBizlandErrorCount = 0;
let endpointApiBizlandErrorCount = 0;
let webhookErrorCount = 0; // Agregar el contador para Webhooks
const httpStatusCodes = ['200 OK', '403 Forbidden', '400 Bad Request', '500 Internal Server Error', '503 Service Unavailable'];
const errorSources = ['F2F', 'Digital', 'GGPX', 'Iframe Bizland', 'Endpoint API Bizland', 'Webhooks'];

let incidentIdCounter = 1;
let previousAlertState = 'Normal'; // Variable para almacenar el estado anterior de alerta

const updateCurrentDate = () => {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  currentDateEl.textContent = now.toLocaleDateString(undefined, options);
};
updateCurrentDate();

const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Success', 'Failed'],
    datasets: [{
      label: 'Transactions',
      data: [0, 0],
      backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
      borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});

const pieCtx = document.getElementById('httpErrorsPieChart').getContext('2d');
const httpErrorsPieChart = new Chart(pieCtx, {
  type: 'pie',
  data: {
    labels: httpStatusCodes.slice(1), // Excluir "200 OK"
    datasets: [{
      label: 'HTTP Errors',
      data: [0, 0, 0, 0],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(54, 162, 235, 1)'
      ],
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 8 // Tamaño de fuente de la leyenda
          }
        }
      },
      title: {
        display: true,
        text: 'HTTP Error Status Codes',
        font: {
          size:16 // Tamaño de la fuente del título
        }
      }
    }
  }
});

var opts = {
  angle: 0, // The span of the gauge arc
  lineWidth: 0.2, // The line thickness
  radiusScale: 1, // Relative radius
  pointer: {
    length: 0.6, // // Relative to gauge radius
    strokeWidth: 0.03, // The thickness
    color: '#000000' // Fill color
  },
  limitMax: false,     // If false, the max value of the gauge will be updated if value surpass max
  limitMin: false,     // If true, the min value of the gauge will be fixed unless you set it manually
  colorStart: '#FF0000',   // Colors
  colorStop: '#00FF00',    // just experiment with them
  strokeColor: '#EEEEEE',  // to see which ones work best for you
  generateGradient: true,
  highDpiSupport: true,     // High resolution support
  staticZones: [
   {strokeStyle: "#FF0000", min: 0, max: 25}, // Red from 0 to 25
   {strokeStyle: "#FFA500", min: 26, max: 50}, // Orange from 26 to 50
   {strokeStyle: "#FFFF00", min: 51, max: 75}, // Yellow from 51 to 75
   {strokeStyle: "#00FF00", min: 76, max: 100}  // Green from 76 to 100
   ],
  staticLabels: {
    font: "10px sans-serif",  // Specifies font
    labels: [25, 50, 75, 100],  // Print labels at these values
    color: "#000000",  // Optional: Label text color
    fractionDigits: 0  // Optional: Numerical precision. 0=round off.
  },
};
var target = document.getElementById('foo'); // your canvas element
var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
gauge.maxValue = 100; // set max gauge value
gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
gauge.animationSpeed = 32; // set animation speed (32 is default value)
gauge.setTextField(document.getElementById("preview-textfield"));

// Actualiza el valor del medidor cada segundo
setInterval(function() {
  // Calcula el porcentaje de transacciones exitosas
  const totalTransactions = http200Count + httpErrorsCount;
  const successPercentage = totalTransactions > 0 ? ((http200Count / totalTransactions) * 100).toFixed(2) : 0;

  // Establece el valor del medidor con el porcentaje calculado
  gauge.set(successPercentage);

  // Actualiza el valor mostrado en el elemento HTML
  document.getElementById("preview-textfield").innerHTML = successPercentage + "%";
}, 1000);



const updateHttpCountDisplay = () => {
  const totalTransactions = http200Count + httpErrorsCount;
  successPercentage = totalTransactions > 0 ? ((http200Count / totalTransactions) * 100).toFixed(2) : 0;

  // Aplica estilo al valor de porcentaje
  const percentageEl = document.createElement('span');
  
  percentageEl.style.fontWeight = 'bold'; // Negrita
  percentageEl.style.fontSize = 'larger'; // Tamaño de fuente más grande
  percentageEl.style.marginLeft = 'auto'; // Alinea a la derecha

  // Reemplaza el contenido existente
  http200CountEl.textContent = `${http200Count} `;
  http200CountEl.appendChild(percentageEl);

  httpErrorsCountEl.textContent = httpErrorsCount;
};
const createIncident = (severity, resolutionTime) => {
  const incidentRow = document.createElement('tr');
  const incidentIdCell = document.createElement('td');
  const severityCell = document.createElement('td');
  const statusCell = document.createElement('td');
  const creationTimeCell = document.createElement('td'); // Nueva celda para la hora de creación
  const resolutionTimeCell = document.createElement('td');

  incidentIdCell.textContent = `INC${incidentIdCounter}`;
  severityCell.textContent = severity;
  statusCell.textContent = 'In Progress';
  creationTimeCell.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }); // Hora de creación
  resolutionTimeCell.textContent = resolutionTime;
  
  // Aplicar el estilo rojo a la celda de estado "In Progress"
  if (statusCell.textContent === 'In Progress') {
    statusCell.style.color = 'red';
    statusCell.style.fontWeight = 'bold';
  }

  incidentRow.appendChild(incidentIdCell);
  incidentRow.appendChild(severityCell);
  incidentRow.appendChild(statusCell);
  incidentRow.appendChild(creationTimeCell); // Agregar la celda de la hora de creación
  incidentRow.appendChild(resolutionTimeCell);

  // Asignar un ID único a la fila del incidente
  incidentRow.id = `incidente-${incidentIdCounter}`;

  incidentTable.appendChild(incidentRow);

  const alertItem = document.createElement('li');
  alertItem.textContent = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} - Incident ${incidentIdCounter} reported (${severity})`;
  alertList.prepend(alertItem);

  incidentIdCounter++;

  // Calcular la hora estimada de resolución
  const resolutionHours = parseInt(resolutionTime); // Convertir la hora de resolución a un número entero
  const resolutionTimestamp = new Date();
  resolutionTimestamp.setHours(resolutionTimestamp.getHours() + resolutionHours); // Agregar horas a la hora actual

  // Actualizar el tiempo restante cada segundo
  const updateResolutionTime = () => {
    const currentTime = new Date();
    const timeDifference = resolutionTimestamp - currentTime;

    // Convertir el tiempo restante a horas, minutos y segundos
    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    // Formatear el tiempo restante en una cadena de texto
    const remainingTime = `${hours}h ${minutes}m ${seconds}s`;

    // Actualizar el campo "Estimated Resolution Time" con el tiempo restante
    resolutionTimeCell.textContent = remainingTime;

    // Si el tiempo restante es menor o igual a cero, marcar el incidente como resuelto
    if (timeDifference <= 0) {
      statusCell.textContent = 'Resolved';
      statusCell.classList.add('resolved'); // Agregar la clase 'resolved'
      statusCell.style.color = 'green'; // Aplicar color verde
      httpErrorsCount = 0; // Restablecer el contador de errores HTTP
      updateHttpCountDisplay();
      clearInterval(updateInterval); // Detener la actualización del tiempo restante
    }
  };

  // Actualizar el tiempo restante cada segundo
  const updateInterval = setInterval(updateResolutionTime, 1000);

  // Mostrar el tiempo restante inicialmente
  updateResolutionTime();
};


socket.on('new_transaction', (transaction) => {
  const listItem = document.createElement('li');
  const statusCode = transaction.status === 'paymentinvoice_succeeded' ? '200 OK' : httpStatusCodes[Math.floor(Math.random() * (httpStatusCodes.length - 1)) + 1];
  listItem.innerHTML = `${transaction.timestamp} - ID: ${transaction.id} - ${transaction.message} - ${statusCode}`;
  listItem.className = transaction.status;
  transactionList.prepend(listItem);

  if (transactionList.childElementCount > 5) {
    transactionList.removeChild(transactionList.lastChild);
  }

  if (transaction.status === 'paymentinvoice_succeeded') {
    http200Count++;
  } else {
    httpErrorsCount++;
    listItem.style.color = 'red';
    listItem.style.fontWeight = 'bold';

    if (httpErrorsCount <= 10) {
      httpErrorsStatusEl.textContent = 'Normal';
      httpErrorsStatusEl.style.color = 'green';
      httpErrorsStatusEl.style.fontWeight = 'bold';
      httpErrorsStatusEl.style.fontSize = '16px';  // Tamaño de letra para el estado 'Normal'
      httpErrorsStatusEl.style.textAlign = 'center';  // Alinear a la derecha
    } else if (httpErrorsCount <= 20) {
      httpErrorsStatusEl.textContent = 'Alert';
      httpErrorsStatusEl.style.color = 'orange';
      httpErrorsStatusEl.style.fontWeight = 'bold';
      httpErrorsStatusEl.style.fontSize = '18px';  // Tamaño de letra para el estado 'Alert'
      httpErrorsStatusEl.style.textAlign = 'center';  // Alinear a la derecha
      if (previousAlertState !== 'Alert') {
        createIncident('Level 1', '4 hours');
      }
    } else {
      httpErrorsStatusEl.textContent = 'Critical';
      httpErrorsStatusEl.style.color = 'red';
      httpErrorsStatusEl.style.fontWeight = 'bold';
      httpErrorsStatusEl.style.animation = 'titilar 1s infinite';
      httpErrorsStatusEl.style.fontSize = '20px';  // Tamaño de letra para el estado 'Critical'
      httpErrorsStatusEl.style.textAlign = 'center';  // Alinear a la derecha
      if (previousAlertState !== 'Critical') {
        createIncident('Level 2', '2 hours');
      }
    }
    
    

    previousAlertState = httpErrorsStatusEl.textContent;

    const errorSource = errorSources[Math.floor(Math.random() * errorSources.length)];

    if (errorSource === 'F2F') {
      f2fErrorCount++;
      f2fErrorCountEl.textContent = f2fErrorCount;
    } else if (errorSource === 'Digital') {
      digitalErrorCount++;
      digitalErrorCountEl.textContent = digitalErrorCount;
    } else if (errorSource === 'GGPX') {
      ggpxErrorCount++;
      ggpxErrorCountEl.textContent = ggpxErrorCount;
    } else if (errorSource === 'Iframe Bizland') {
      iframeBizlandErrorCount++;
      iframeBizlandErrorCountEl.textContent = iframeBizlandErrorCount;
    } else if (errorSource === 'Endpoint API Bizland') {
      endpointApiBizlandErrorCount++;
      endpointApiBizlandErrorCountEl.textContent = endpointApiBizlandErrorCount;
    } else if (errorSource === 'Webhooks') { // Agregar bloque para Webhooks
      webhookErrorCount++;
      webhookErrorCountEl.textContent = webhookErrorCount;
    }
    

    // Actualizar datos del gráfico circular
    const statusIndex = httpStatusCodes.indexOf(statusCode) - 1; // Restar 1 para excluir "200 OK"
    if (statusIndex >= 0) {
      httpErrorsPieChart.data.datasets[0].data[statusIndex]++;
      httpErrorsPieChart.update();
    }

    // Agregar a la lista de transacciones pendientes con temporizador
    const pendingItem = document.createElement('li');
    const countdown = 60; // 60 segundos
    pendingItem.innerHTML = `${transaction.timestamp} - Pending reprocess in <span class="countdown">${countdown}</span> seconds`;
    pendingList.prepend(pendingItem);

    if (pendingList.childElementCount > 5) {
      pendingList.removeChild(pendingList.lastChild);
    }

    // Actualizar el temporizador cada segundo
    const intervalId = setInterval(() => {
      const countdownElement = pendingItem.querySelector('.countdown');
      let currentCountdown = parseInt(countdownElement.textContent, 10);
      currentCountdown--;
      if (currentCountdown <= 0) {
        clearInterval(intervalId);
        pendingList.removeChild(pendingItem);
        const successItem = document.createElement('li');
        successItem.innerHTML = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} - ID: ${transaction.id} - Donation processed successfully - 200 OK`;
        transactionList.prepend(successItem);
        http200Count++;
        httpErrorsCount--;
        reprocessedCount++;
        myChart.data.datasets[0].data[0] = http200Count;
        myChart.data.datasets[0].data[1] = httpErrorsCount;
        myChart.update();
        successItem.className = 'paymentinvoice_succeeded';
        if (transactionList.childElementCount > 5) {
          transactionList.removeChild(transactionList.lastChild);
        }
        reprocessedCountEl.textContent = reprocessedCount;
        updateHttpCountDisplay();
      } else {
        countdownElement.textContent = currentCountdown;
      }
    }, 1000);
  }

  updateHttpCountDisplay();
  myChart.data.datasets[0].data[0] = http200Count;
  myChart.data.datasets[0].data[1] = httpErrorsCount;
  myChart.update();

  // Enviar alerta de correo electrónico si falla
  if (transaction.status === 'payment_invoice_failed') {
    const alertItem = document.createElement('li');
    alertItem.textContent = `${transaction.timestamp} - Mail alert sent successfully`;
    alertList.prepend(alertItem);
    emailSentCount++;

    if (alertList.childElementCount > 5) {
      alertList.removeChild(alertList.lastChild);
    }
  }

  emailSentCountEl.textContent = emailSentCount;
});
