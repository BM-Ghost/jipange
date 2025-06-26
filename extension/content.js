// Content script for Jipange extension

// Inject floating action button
function injectFloatingButton() {
  // Check if button already exists
  if (document.getElementById("jipange-fab")) return

  const fab = document.createElement("div")
  fab.id = "jipange-fab"
  fab.innerHTML = `
        <div class="jipange-fab-container">
            <button class="jipange-fab-button" title="Quick add task with Jipange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    `

  // Add styles
  const style = document.createElement("style")
  style.textContent = `
        .jipange-fab-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
        }
        
        .jipange-fab-button {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #7c3aed, #ec4899);
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .jipange-fab-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6);
        }
        
        .jipange-fab-button:active {
            transform: scale(0.95);
        }
        
        .jipange-quick-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .jipange-modal-content {
            background: #1e293b;
            border-radius: 12px;
            padding: 24px;
            width: 90%;
            max-width: 400px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .jipange-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .jipange-modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #a855f7;
        }
        
        .jipange-close-btn {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 24px;
        }
        
        .jipange-form-group {
            margin-bottom: 16px;
        }
        
        .jipange-label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #e2e8f0;
        }
        
        .jipange-input, .jipange-textarea, .jipange-select {
            width: 100%;
            padding: 10px 12px;
            background: #374151;
            border: 1px solid #4b5563;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            box-sizing: border-box;
        }
        
        .jipange-input:focus, .jipange-textarea:focus, .jipange-select:focus {
            outline: none;
            border-color: #a855f7;
            box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }
        
        .jipange-textarea {
            resize: vertical;
            min-height: 80px;
        }
        
        .jipange-submit-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #7c3aed, #ec4899);
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .jipange-submit-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        
        .jipange-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
    `
  document.head.appendChild(style)

  // Add click handler
  fab.querySelector(".jipange-fab-button").addEventListener("click", showQuickAddModal)

  document.body.appendChild(fab)
}

// Show quick add modal
function showQuickAddModal() {
  // Remove existing modal if any
  const existingModal = document.getElementById("jipange-quick-modal")
  if (existingModal) {
    existingModal.remove()
  }

  const modal = document.createElement("div")
  modal.id = "jipange-quick-modal"
  modal.className = "jipange-quick-modal"
  modal.innerHTML = `
        <div class="jipange-modal-content">
            <div class="jipange-modal-header">
                <h3 class="jipange-modal-title">Quick Add Task</h3>
                <button class="jipange-close-btn" onclick="this.closest('.jipange-quick-modal').remove()">&times;</button>
            </div>
            
            <form id="jipange-quick-form">
                <div class="jipange-form-group">
                    <label class="jipange-label">Task Title</label>
                    <input type="text" class="jipange-input" id="jipange-task-title" placeholder="What needs to be done?" required>
                </div>
                
                <div class="jipange-form-group">
                    <label class="jipange-label">Description</label>
                    <textarea class="jipange-textarea" id="jipange-task-description" placeholder="Add details..."></textarea>
                </div>
                
                <div class="jipange-form-group">
                    <label class="jipange-label">Priority</label>
                    <select class="jipange-select" id="jipange-task-priority">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                
                <button type="submit" class="jipange-submit-btn" id="jipange-submit-btn">
                    Create Task
                </button>
            </form>
        </div>
    `

  // Add form handler
  modal.querySelector("#jipange-quick-form").addEventListener("submit", handleQuickTaskSubmit)

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })

  // Auto-fill with page context
  const titleInput = modal.querySelector("#jipange-task-title")
  const descriptionInput = modal.querySelector("#jipange-task-description")

  // Try to extract meaningful content from page
  const pageTitle = document.title
  const selectedText = window.getSelection().toString().trim()

  if (selectedText) {
    titleInput.value = `Review: ${selectedText.substring(0, 50)}${selectedText.length > 50 ? "..." : ""}`
    descriptionInput.value = `Selected from: ${pageTitle}\nURL: ${window.location.href}\n\nContent: ${selectedText}`
  } else {
    titleInput.value = `Review: ${pageTitle}`
    descriptionInput.value = `Page: ${pageTitle}\nURL: ${window.location.href}`
  }

  document.body.appendChild(modal)
  titleInput.focus()
  titleInput.select()
}

// Handle quick task form submission
async function handleQuickTaskSubmit(e) {
  e.preventDefault()

  const submitBtn = document.getElementById("jipange-submit-btn")
  const originalText = submitBtn.textContent

  submitBtn.disabled = true
  submitBtn.textContent = "Creating..."

  try {
    const task = {
      title: document.getElementById("jipange-task-title").value.trim(),
      description: document.getElementById("jipange-task-description").value.trim(),
      priority: document.getElementById("jipange-task-priority").value,
      user_id: "user123", // Replace with actual user ID
      tags: [extractDomainFromUrl(window.location.href)],
    }

    const response = await fetch("http://localhost:8000/api/tasks/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    })

    if (response.ok) {
      showNotification("Task created successfully! 🎉", "success")
      document.getElementById("jipange-quick-modal").remove()
    } else {
      throw new Error("Failed to create task")
    }
  } catch (error) {
    console.error("Error creating task:", error)
    showNotification("Failed to create task. Please try again.", "error")
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  }
}

// Show notification
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".jipange-notification")
  existingNotifications.forEach((n) => n.remove())

  const notification = document.createElement("div")
  notification.className = "jipange-notification"
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10002;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${
          type === "success"
            ? "background: linear-gradient(135deg, #10b981, #059669);"
            : type === "error"
              ? "background: linear-gradient(135deg, #ef4444, #dc2626);"
              : "background: linear-gradient(135deg, #3b82f6, #2563eb);"
        }
    `
  notification.textContent = message

  document.body.appendChild(notification)

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// Extract domain from URL for tagging
function extractDomainFromUrl(url) {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return "web"
  }
}

// Listen for keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Shift + J to open quick add
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
    e.preventDefault()
    showQuickAddModal()
  }
})

// Initialize when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectFloatingButton)
} else {
  injectFloatingButton()
}

// Handle page navigation (for SPAs)
let currentUrl = location.href
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href
    // Re-inject button if it doesn't exist
    setTimeout(() => {
      if (!document.getElementById("jipange-fab")) {
        injectFloatingButton()
      }
    }, 1000)
  }
}).observe(document, { subtree: true, childList: true })
