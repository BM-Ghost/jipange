// Background service worker for Jipange extension

// Declare chrome variable
const chrome = window.chrome

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Jipange extension installed")

  // Set up context menu
  chrome.contextMenus.create({
    id: "jipange-quick-task",
    title: "Create task from selection",
    contexts: ["selection"],
  })

  chrome.contextMenus.create({
    id: "jipange-page-task",
    title: "Create task from this page",
    contexts: ["page"],
  })
})

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "jipange-quick-task") {
    handleQuickTaskFromSelection(info, tab)
  } else if (info.menuItemId === "jipange-page-task") {
    handleTaskFromPage(info, tab)
  }
})

// Handle task creation from selected text
async function handleQuickTaskFromSelection(info, tab) {
  const selectedText = info.selectionText

  try {
    // Use AI to extract task from selected text
    const response = await fetch("http://localhost:8000/api/ai/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Extract a task from this text: "${selectedText}". Create a clear task title and description.`,
        user_id: "user123",
        context: `Page: ${tab.title}\nURL: ${tab.url}`,
      }),
    })

    if (response.ok) {
      const result = await response.json()

      // Show notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Jipange - Task Created",
        message: "Task extracted from selection and added to your list!",
      })
    }
  } catch (error) {
    console.error("Error creating task from selection:", error)
  }
}

// Handle task creation from current page
async function handleTaskFromPage(info, tab) {
  try {
    // Extract page content
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageContent,
    })

    const pageContent = result.result

    // Use AI to suggest task from page content
    const response = await fetch("http://localhost:8000/api/ai/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Based on this webpage content, suggest a relevant task: ${pageContent.substring(0, 1000)}`,
        user_id: "user123",
        context: `Page: ${tab.title}\nURL: ${tab.url}`,
      }),
    })

    if (response.ok) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Jipange - Task Suggested",
        message: "Task suggestion created from this page!",
      })
    }
  } catch (error) {
    console.error("Error creating task from page:", error)
  }
}

// Function to extract page content (runs in page context)
function extractPageContent() {
  const title = document.title
  const metaDescription = document.querySelector('meta[name="description"]')?.content || ""
  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((h) => h.textContent)
    .join(" ")
  const firstParagraph = document.querySelector("p")?.textContent || ""

  return `${title} ${metaDescription} ${headings} ${firstParagraph}`.substring(0, 2000)
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "syncTasks") {
    syncTasksWithServer()
  } else if (request.action === "getPageInfo") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({
        title: tabs[0].title,
        url: tabs[0].url,
      })
    })
    return true // Keep message channel open for async response
  }
})

// Sync tasks with server
async function syncTasksWithServer() {
  try {
    const response = await fetch("http://localhost:8000/api/tasks/user123")
    const tasks = await response.json()

    // Store in local storage for offline access
    chrome.storage.local.set({ tasks: tasks })

    console.log("Tasks synced:", tasks.length)
  } catch (error) {
    console.error("Error syncing tasks:", error)
  }
}

// Periodic sync (every 5 minutes)
chrome.alarms.create("syncTasks", { periodInMinutes: 5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncTasks") {
    syncTasksWithServer()
  }
})

// Badge update based on pending tasks
async function updateBadge() {
  try {
    const response = await fetch("http://localhost:8000/api/tasks/user123")
    const tasks = await response.json()
    const pendingTasks = tasks.filter((task) => task.status !== "completed")

    chrome.action.setBadgeText({
      text: pendingTasks.length > 0 ? pendingTasks.length.toString() : "",
    })
    chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" })
  } catch (error) {
    console.error("Error updating badge:", error)
  }
}

// Update badge on startup and periodically
updateBadge()
setInterval(updateBadge, 60000) // Every minute
