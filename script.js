window.onload = function () {
  loadLogEntries();
  bindEnterKeyToAddLap();
  updateCurrentTime();
  document.getElementById('task-form').addEventListener('submit', function(event) {
    event.preventDefault();
    addLap();
  });
};

setInterval(updateCurrentTime, 1000); // Update current time every second

function updateCurrentTime() {
  const currentTimeDisplay = document.getElementById("current-time");
  if (currentTimeDisplay) {
    currentTimeDisplay.textContent = new Date().toLocaleTimeString();
  }
}

function createButton(buttonType, text) {
  const btn = document.createElement("button");
  let buttonText = '';
  switch (buttonType) {
    case 'edit':
      buttonText = 'Edit';
      break;
    case 'delete':
      buttonText = 'Delete';
      break;
    default:
      console.error('Unknown button type:', buttonType);
      return;
  }
  btn.className = `${buttonType}-btn`; // Use buttonType-btn class for styling
  btn.setAttribute("title", text); // Use title attribute for tooltip
  btn.setAttribute("data-action", buttonType);
  btn.textContent = buttonText; // Set button text
  return btn;
}

function getFormattedDateTime() {
  return new Date().toLocaleString('en-US', {
    year: '2-digit',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', ''); // Remove the comma after the date
}

function addLap() {
  const taskInput = document.getElementById("text-input");
  if (taskInput.value.trim() === "") return;

  const now = getFormattedDateTime(); // Use the new formatting function
  const task = taskInput.value;
  taskInput.value = "";

  const log = document.getElementById("log");
  const newEntry = document.createElement("div");
  const logEntry = { timestamp: now, task: task };
  newEntry.textContent = `${logEntry.timestamp} - ${logEntry.task}`;

  const editBtn = createButton("edit", "Edit");
  const deleteBtn = createButton("delete", "Delete");

  newEntry.appendChild(editBtn);
  newEntry.appendChild(deleteBtn);
  log.appendChild(newEntry);

  saveLogToLocalStorage();
}


function editEntry(entryDiv, logEntry) {
  const buttons = entryDiv.querySelectorAll(".edit-btn, .delete-btn");
  entryDiv.innerHTML = "";
  buttons.forEach((button) => entryDiv.appendChild(button));

  const input = document.createElement("input");
  input.type = "text";
  input.value = logEntry.task;
  input.classList.add("edit-input");

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.classList.add("save-btn");
  saveBtn.onclick = () =>
    saveEntry(entryDiv, input.value, logEntry.timestamp);

  // Bind Enter key to save action for the edit input field
  input.onkeyup = function (e) {
    if (e.keyCode === 13) {
      // Enter key
      saveEntry(entryDiv, input.value, logEntry.timestamp);
    }
  };

  entryDiv.insertBefore(input, buttons[0]);
  entryDiv.replaceChild(saveBtn, buttons[0]);
  input.focus();
}

function saveEntry(entryDiv, newTask, timestamp) {
  // Ensure timestamp includes both date and time if modifying it
  const logEntry = { timestamp: timestamp, task: newTask };
  entryDiv.innerHTML = `${logEntry.timestamp} - ${logEntry.task}`;

  const editBtn = createButton("edit", "Edit");
  const deleteBtn = createButton("delete", "Delete");

  entryDiv.appendChild(editBtn);
  entryDiv.appendChild(deleteBtn);

  saveLogToLocalStorage();
}

function deleteEntry(entryDiv) {
  entryDiv.remove();
  saveLogToLocalStorage();
}

function saveLogToLocalStorage() {
  const logEntries = [];
  document.querySelectorAll("#log > div").forEach((entryDiv) => {
    // Use extractLogEntry to get the log entry details
    const { timestamp, task } = extractLogEntry(entryDiv);
    logEntries.push({ timestamp, task });
  });
  localStorage.setItem("timeTrackerLog", JSON.stringify(logEntries));
}

function loadLogEntries() {
  const savedLog = JSON.parse(localStorage.getItem("timeTrackerLog"));
  if (savedLog) {
    const log = document.getElementById("log");
    log.innerHTML = "";
    savedLog.forEach((logEntry) => {
      const entryDiv = document.createElement("div");
      entryDiv.textContent = `${logEntry.timestamp} - ${logEntry.task}`;

      const editBtn = createButton("edit", "Edit");
      const deleteBtn = createButton("delete", "Delete");

      entryDiv.appendChild(editBtn);
      entryDiv.appendChild(deleteBtn);
      log.appendChild(entryDiv);
    });
  }
}

document.getElementById("log").addEventListener("click", function (event) {
  const target = event.target;
  const action = target.getAttribute("data-action");
  const entryDiv = target.closest("div");
  const logEntry = extractLogEntry(entryDiv);
  const actions = {
    edit: () => editEntry(entryDiv, logEntry),
    delete: () => {
      if (confirm("Are you sure you want to delete this entry?")) {
        deleteEntry(entryDiv);
      }
    }
  };
  const actionFunction = actions[action];
  if (actionFunction) {
    actionFunction();
  }
});

function extractLogEntry(entryDiv) {
  const textContent = entryDiv.childNodes[0].nodeValue.trim();
  const splitIndex = textContent.lastIndexOf(" - ");
  const timestamp = textContent.substring(0, splitIndex);
  const task = textContent.substring(splitIndex + 3);
  return { timestamp, task };
}

function bindEnterKeyToAddLap() {
  const taskInput = document.getElementById("text-input");
  taskInput.onkeyup = function (e) {
    if (e.keyCode === 13) {
      addLap();
    }
  };
}

function exportLogsToCSV() {
  const logEntries = JSON.parse(localStorage.getItem("timeTrackerLog"));
  if (!logEntries || logEntries.length === 0) {
    alert("No log entries to export.");
    return;
  }

  // UTF-8 Byte Order Mark (BOM)
  let csvContent = "\uFEFF"; // Add BOM to the start of the CSV
  csvContent += "Date,Time,Entry\n"; // CSV header

  logEntries.forEach(entry => {
    const dateTime = new Date(entry.timestamp);
    const date = dateTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const time = dateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const task = entry.task.replace(/"/g, '""'); // Escape double quotes
    csvContent += `"${date}","${time}","${task}"\n`;
  });

  // Create a blob with the CSV content and trigger a download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "time_tracker_logs.csv");
  document.body.appendChild(link); // Required for Firefox
  link.click();
  document.body.removeChild(link);
}