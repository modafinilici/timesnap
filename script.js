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
    case 'delete':
      buttonText = 'Delete';
      btn.className = "delete-btn"; // Ensure this matches your CSS class
      break;
    case 'save':
      buttonText = 'Save';
      btn.className = "save-btn"; // Ensure this matches your CSS class
      break;
    default:
      console.error('Unknown button type:', buttonType);
      return;
  }
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

// New function to create and append log row
function createAndAppendLogRow(timestamp, task, parentElement = document.querySelector("#log table tbody")) {
  const newRow = document.createElement("tr");

  // Timestamp cell
  const timestampCell = document.createElement("td");
  timestampCell.textContent = timestamp;
  newRow.appendChild(timestampCell);

  // Task cell
  const taskCell = document.createElement("td");
  taskCell.textContent = task;
  newRow.appendChild(taskCell);

  // Actions cell
  const actionsCell = document.createElement("td");
  actionsCell.className = "actions-cell";
  const deleteBtn = createButton("delete", "Delete");
  actionsCell.appendChild(deleteBtn);
  newRow.appendChild(actionsCell);

  parentElement.appendChild(newRow);
}

function addLap() {
  const taskInput = document.getElementById("text-input");
  if (taskInput.value.trim() === "") return;

  const now = getFormattedDateTime();
  const task = taskInput.value;
  taskInput.value = "";

  createAndAppendLogRow(now, task); // Use the new function

  saveLogToLocalStorage();
}

function makeTaskCellEditable(entryRow, logEntry) {
  const taskCell = entryRow.querySelector("td:nth-child(2)");
  const originalContent = taskCell.textContent;
  taskCell.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.value = logEntry.task;
  input.classList.add("edit-input");
  taskCell.appendChild(input);
  input.focus();

  input.addEventListener("click", function(event) {
    event.stopPropagation();
  });

  input.addEventListener("keyup", function(event) {
    event.stopPropagation(); // Prevent event from propagating when key is pressed
    if (event.key === "Enter") {
      saveEntry(entryRow, input.value, logEntry.timestamp);
    } else if (event.key === "Escape") {
      taskCell.textContent = originalContent; // Restore original content
    }
  });

  input.addEventListener("mousedown", function(event) {
    event.stopPropagation(); // Prevent event from propagating when mouse is down
  });

  input.addEventListener("blur", function() {
    taskCell.textContent = originalContent;
  });
}

// Attach event listener to the parent table body for editability
document.querySelector("#log table tbody").addEventListener("click", function(event) {
  // Check if the clicked element is a task cell
  const taskCell = event.target.closest("td:nth-child(2)");
  if (taskCell) {
    const entryRow = taskCell.closest("tr");
    const logEntry = extractLogEntry(entryRow);
    makeTaskCellEditable(entryRow, logEntry);
  }
});

function saveEntry(entryRow, newTask, timestamp) {
  // Input validation: Ensure newTask is not empty or only whitespace
  if (!newTask.trim()) {
    alert("Task cannot be empty.");
    return; // Exit the function without saving
  }

  const taskCell = entryRow.querySelector("td:nth-child(2)");
  taskCell.textContent = newTask; // Update the task cell with the new value

  saveLogToLocalStorage();
}

function deleteEntry(entryRow) {
  entryRow.remove(); // Remove the row from the table
  saveLogToLocalStorage();
}

function saveLogToLocalStorage() {
  const logEntries = [];
  document.querySelectorAll("#log table tbody tr").forEach((row) => {
    const timestamp = row.cells[0].textContent;
    const task = row.cells[1].textContent;
    logEntries.push({ timestamp, task });
  });
  localStorage.setItem("timeTrackerLog", JSON.stringify(logEntries));
}

function loadLogEntries() {
  const savedLog = JSON.parse(localStorage.getItem("timeTrackerLog"));
  if (savedLog) {
    const logTableBody = document.querySelector("#log table tbody");
    logTableBody.innerHTML = ""; // Clear existing entries

    savedLog.forEach((logEntry) => {
      createAndAppendLogRow(logEntry.timestamp, logEntry.task, logTableBody); // Use the new function
    });
  }
}

document.getElementById("log").addEventListener("click", function (event) {
  const target = event.target;
  const action = target.getAttribute("data-action");
  const entryRow = target.closest("tr");
  if (!entryRow) return;
  const logEntry = extractLogEntry(entryRow);
  const actions = {
    delete: () => {
      if (confirm("Are you sure you want to delete this entry?")) {
        deleteEntry(entryRow);
      }
    },
    save: () => saveEntry(entryRow, document.querySelector(".edit-input").value, logEntry.timestamp)
  };
  const actionFunction = actions[action];
  if (actionFunction) {
    actionFunction();
  }
});

function extractLogEntry(entryRow) {
  const timestamp = entryRow.cells[0].textContent;
  const task = entryRow.cells[1].textContent;
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