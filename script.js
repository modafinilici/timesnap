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

function addLap() {
  const taskInput = document.getElementById("text-input");
  if (taskInput.value.trim() === "") return;

  const now = getFormattedDateTime();
  const task = taskInput.value;
  taskInput.value = "";

  const logTableBody = document.querySelector("#log table tbody");
  const newRow = document.createElement("tr");

  // Create and append the timestamp cell
  const timestampCell = document.createElement("td");
  timestampCell.textContent = now;
  newRow.appendChild(timestampCell);

  // Create and append the task cell
  const taskCell = document.createElement("td");
  taskCell.textContent = task;
  newRow.appendChild(taskCell);

  // Create and append the actions cell
  const actionsCell = document.createElement("td");
  actionsCell.className = "actions-cell"; // Assign the class
  const deleteBtn = createButton("delete", "Delete");
  actionsCell.appendChild(deleteBtn);
  newRow.appendChild(actionsCell);

  logTableBody.appendChild(newRow);

  saveLogToLocalStorage();
  attachClickToEditTaskCell(newRow, { timestamp: now, task: task });
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

  input.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      saveEntry(entryRow, input.value, logEntry.timestamp);
    } else if (event.key === "Escape") {
      taskCell.textContent = originalContent; // Restore original content
      attachClickToEditTaskCell(entryRow, logEntry); // Re-attach click-to-edit functionality
    }
  });

  input.addEventListener("mousedown", function(event) {
    event.preventDefault();
  });

  input.addEventListener("blur", function() {
    taskCell.textContent = originalContent;
    attachClickToEditTaskCell(entryRow, logEntry);
  });
}

function attachClickToEditTaskCell(entryRow, logEntry) {
  const taskCell = entryRow.querySelector("td:nth-child(2)");
  taskCell.style.cursor = "pointer"; // Optional: Change cursor to indicate editability

  // Remove any existing click listeners to prevent duplicates
  taskCell.removeEventListener("click", taskCell.clickEventListener);

  // Define the click event listener
  taskCell.clickEventListener = function() {
    makeTaskCellEditable(entryRow, logEntry);
  };

  // Attach the click event listener
  taskCell.addEventListener("click", taskCell.clickEventListener);
}

function saveEntry(entryRow, newTask, timestamp) {
  // Input validation: Ensure newTask is not empty or only whitespace
  if (!newTask.trim()) {
    alert("Task cannot be empty.");
    return; // Exit the function without saving
  }

  const taskCell = entryRow.querySelector("td:nth-child(2)");
  taskCell.textContent = newTask; // Update the task cell with the new value

  // Re-attach click-to-edit functionality
  const logEntry = { timestamp, task: newTask };
  attachClickToEditTaskCell(entryRow, logEntry);

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
      const newRow = document.createElement("tr");

      const timestampCell = document.createElement("td");
      timestampCell.textContent = logEntry.timestamp;
      newRow.appendChild(timestampCell);

      const taskCell = document.createElement("td");
      taskCell.textContent = logEntry.task;
      newRow.appendChild(taskCell);

      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell"; // Assign the class
      const deleteBtn = createButton("delete", "Delete");
      actionsCell.appendChild(deleteBtn);
      newRow.appendChild(actionsCell);

      logTableBody.appendChild(newRow);
      attachClickToEditTaskCell(newRow, logEntry);
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