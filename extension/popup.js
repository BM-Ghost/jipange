// Enhanced popup with better voice processing and validation feedback
class JipangePopup {
  constructor() {
    this.currentView = "dashboard"
    this.tasks = []
    this.isRecording = false
    this.mediaRecorder = null
    this.audioChunks = []
    this.recordingStartTime = null
    this.recordingTimer = null
    this.lastProcessingResult = null

    this.init()
  }

  async init() {
    await this.loadTasks()
    this.render()
    this.setupEventListeners()
  }

  async loadTasks() {
    try {
      const response = await fetch("http://localhost:8000/api/tasks/user123")
      this.tasks = await response.json()
    } catch (error) {
      console.error("Failed to load tasks:", error)
      this.tasks = []
    }
  }

  render() {
    const root = document.getElementById("root")
    root.innerHTML = this.getHTML()
  }

  getHTML() {
    return `
            <div class="flex flex-col h-full">
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-sm">J</span>
                        </div>
                        <h1 class="text-lg font-bold text-white">Jipange</h1>
                        <div class="ml-auto">
                            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <!-- Navigation -->
                <div class="flex bg-slate-800 border-b border-slate-700">
                    <button class="nav-btn ${this.currentView === "dashboard" ? "active" : ""}" data-view="dashboard">
                        📊 Dashboard
                    </button>
                    <button class="nav-btn ${this.currentView === "quick-add" ? "active" : ""}" data-view="quick-add">
                        ➕ Quick Add
                    </button>
                    <button class="nav-btn ${this.currentView === "calendar" ? "active" : ""}" data-view="calendar">
                        📅 Calendar
                    </button>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `
  }

  renderCurrentView() {
    switch (this.currentView) {
      case "dashboard":
        return this.renderDashboard()
      case "quick-add":
        return this.renderQuickAdd()
      case "calendar":
        return this.renderCalendar()
      default:
        return this.renderDashboard()
    }
  }

  renderDashboard() {
    const todayTasks = this.tasks.filter((task) => {
      const today = new Date().toISOString().split("T")[0]
      return task.due_date === today
    })

    return `
            <div class="p-4 space-y-4">
                <!-- Quick Stats -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-slate-800 rounded-lg p-3">
                        <div class="text-2xl font-bold text-blue-400">${this.tasks.length}</div>
                        <div class="text-xs text-slate-400">Total Tasks</div>
                    </div>
                    <div class="bg-slate-800 rounded-lg p-3">
                        <div class="text-2xl font-bold text-green-400">${todayTasks.length}</div>
                        <div class="text-xs text-slate-400">Due Today</div>
                    </div>
                </div>

                <!-- Today's Tasks -->
                <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-slate-300">Today's Tasks</h3>
                    ${
                      todayTasks.length > 0
                        ? todayTasks
                            .map(
                              (task) => `
                            <div class="bg-slate-800 rounded-lg p-3 border-l-4 border-purple-500">
                                <div class="font-medium text-white text-sm">${task.title}</div>
                                <div class="text-xs text-slate-400 mt-1">${task.description || "No description"}</div>
                                <div class="flex items-center justify-between mt-2">
                                    <span class="text-xs px-2 py-1 rounded ${this.getPriorityClass(task.priority)}">${task.priority}</span>
                                    <button class="text-xs text-purple-400 hover:text-purple-300" onclick="popup.markComplete('${task.id}')">
                                        Mark Complete
                                    </button>
                                </div>
                            </div>
                        `,
                            )
                            .join("")
                        : '<div class="text-center text-slate-400 py-8">No tasks due today! 🎉</div>'
                    }
                </div>

                <!-- Quick Actions -->
                <div class="grid grid-cols-2 gap-2">
                    <button class="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg text-sm font-medium transition-colors" onclick="popup.switchView('quick-add')">
                        ➕ Add Task
                    </button>
                    <button class="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg text-sm font-medium transition-colors" onclick="popup.openFullApp()">
                        🚀 Open App
                    </button>
                </div>
            </div>
        `
  }

  renderQuickAdd() {
    return `
            <div class="p-4 space-y-4">
                <!-- Quick Add Form -->
                <form id="quick-add-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-2">Task Title</label>
                        <input type="text" id="task-title" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none" placeholder="What needs to be done?">
                        <div id="title-validation" class="text-xs mt-1 hidden"></div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea id="task-description" rows="3" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none" placeholder="Add details..."></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                            <select id="task-priority" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">Category</label>
                            <select id="task-category" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none">
                                <option value="work">Work</option>
                                <option value="personal">Personal</option>
                                <option value="health">Health</option>
                                <option value="learning">Learning</option>
                                <option value="finance">Finance</option>
                                <option value="social">Social</option>
                                <option value="household">Household</option>
                                <option value="creative">Creative</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                            <input type="date" id="task-due-date" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">Due Time</label>
                            <input type="time" id="task-due-time" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-2">Estimated Duration (minutes)</label>
                        <input type="number" id="task-duration" min="1" max="480" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none" placeholder="e.g., 30">
                    </div>

                    <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        Create Task
                    </button>
                </form>

                <!-- Enhanced Voice Input -->
                <div class="border-t border-slate-700 pt-4">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-medium text-slate-300">Enhanced Voice Input</span>
                        <span class="text-xs text-slate-400">AI-Powered with Validation</span>
                    </div>
                    <button id="voice-btn" class="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2" onclick="popup.toggleVoiceRecording()">
                        <span id="voice-icon">🎤</span>
                        <span id="voice-text">${this.isRecording ? "Stop Recording" : "Start Voice Input"}</span>
                    </button>
                    <div id="voice-status" class="text-xs text-slate-400 mt-2 text-center"></div>
                    
                    <!-- Voice Processing Results -->
                    <div id="voice-results" class="mt-4 hidden">
                        <div class="bg-slate-800 rounded-lg p-3 space-y-3">
                            <div id="transcript-display" class="text-sm"></div>
                            <div id="confidence-display" class="text-xs"></div>
                            <div id="suggestions-display" class="text-xs"></div>
                            <div id="warnings-display" class="text-xs"></div>
                        </div>
                    </div>
                </div>

                <!-- Current Page Context -->
                <div class="border-t border-slate-700 pt-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-slate-300">Current Page</span>
                        <button class="text-xs text-purple-400 hover:text-purple-300" onclick="popup.addPageContext()">
                            Add Context
                        </button>
                    </div>
                    <div id="page-context" class="text-xs text-slate-400 bg-slate-800 rounded p-2">
                        Loading page info...
                    </div>
                </div>
            </div>
        `
  }

  renderCalendar() {
    const today = new Date()

    return `
            <div class="p-4 space-y-4">
                <!-- Date Header -->
                <div class="text-center">
                    <h2 class="text-lg font-bold text-white">${today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2>
                    <p class="text-sm text-slate-400">Today's Schedule</p>
                </div>

                <!-- Day Summary -->
                <div class="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-3">
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="text-sm font-medium text-purple-300">🧠 AI Insights</span>
                    </div>
                    <p class="text-sm text-slate-300">You have 3 tasks due today and 2 meetings scheduled. Consider blocking 2 hours for focused work.</p>
                </div>

                <!-- Schedule -->
                <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-slate-300">Schedule</h3>
                    
                    <!-- Mock calendar events -->
                    <div class="space-y-2">
                        <div class="bg-slate-800 rounded-lg p-3 border-l-4 border-blue-500">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="font-medium text-white text-sm">Team Standup</div>
                                    <div class="text-xs text-slate-400">9:00 AM - 9:30 AM</div>
                                </div>
                                <span class="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">Meeting</span>
                            </div>
                        </div>

                        <div class="bg-slate-800 rounded-lg p-3 border-l-4 border-purple-500">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="font-medium text-white text-sm">Deep Work: Design Review</div>
                                    <div class="text-xs text-slate-400">10:00 AM - 12:00 PM</div>
                                </div>
                                <span class="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">Focus</span>
                            </div>
                        </div>

                        <div class="bg-slate-800 rounded-lg p-3 border-l-4 border-green-500">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="font-medium text-white text-sm">Client Presentation</div>
                                    <div class="text-xs text-slate-400">2:00 PM - 3:00 PM</div>
                                </div>
                                <span class="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300">Important</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Schedule -->
                <div class="grid grid-cols-2 gap-2">
                    <button class="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg text-xs font-medium transition-colors">
                        📅 Schedule Focus
                    </button>
                    <button class="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg text-xs font-medium transition-colors">
                        🔍 Find Time
                    </button>
                </div>
            </div>
        `
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchView(e.target.dataset.view)
      })
    })

    // Quick add form
    const form = document.getElementById("quick-add-form")
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault()
        this.createTask()
      })
    }

    // Real-time validation
    this.setupFormValidation()

    // Load page context
    this.loadPageContext()
  }

  setupFormValidation() {
    const titleInput = document.getElementById("task-title")
    if (titleInput) {
      titleInput.addEventListener("input", (e) => {
        this.validateTitle(e.target.value)
      })
    }
  }

  validateTitle(title) {
    const validationEl = document.getElementById("title-validation")
    if (!validationEl) return

    if (title.length < 3) {
      validationEl.className = "text-xs mt-1 text-red-400"
      validationEl.textContent = "Title should be at least 3 characters"
      validationEl.classList.remove("hidden")
    } else if (title.length > 100) {
      validationEl.className = "text-xs mt-1 text-yellow-400"
      validationEl.textContent = "Consider shortening the title for better readability"
      validationEl.classList.remove("hidden")
    } else {
      validationEl.classList.add("hidden")
    }
  }

  switchView(view) {
    this.currentView = view
    this.render()
  }

  async createTask() {
    const title = document.getElementById("task-title").value
    const description = document.getElementById("task-description").value
    const priority = document.getElementById("task-priority").value
    const category = document.getElementById("task-category").value
    const dueDate = document.getElementById("task-due-date").value
    const dueTime = document.getElementById("task-due-time").value
    const duration = document.getElementById("task-duration").value

    if (!title.trim()) {
      this.showValidationError("Please enter a task title")
      return
    }

    const task = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      due_date: dueDate || null,
      due_time: dueTime || null,
      estimated_duration: duration ? Number.parseInt(duration) : null,
      user_id: "user123",
      tags: [],
    }

    try {
      const response = await fetch("http://localhost:8000/api/tasks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      })

      if (response.ok) {
        await this.loadTasks()
        this.switchView("dashboard")
        this.showNotification("Task created successfully! 🎉", "success")
      } else {
        throw new Error("Failed to create task")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      this.showValidationError("Failed to create task. Please try again.")
    }
  }

  async toggleVoiceRecording() {
    if (this.isRecording) {
      this.stopRecording()
    } else {
      this.startRecording()
    }
  }

  async startRecording() {
    try {
      const permissionStatus = await navigator.permissions.query({ name: "microphone" })
      if (permissionStatus.state === "denied") {
        throw new Error("Microphone permission denied. Please enable microphone access in browser settings.")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      })

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
      })

      this.audioChunks = []
      this.recordingStartTime = Date.now()

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.processVoiceInput()
      }

      this.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error)
        this.handleVoiceError("Recording failed: " + event.error.message)
      }

      this.mediaRecorder.start(1000)
      this.isRecording = true

      // Update UI with enhanced feedback
      document.getElementById("voice-icon").textContent = "⏹️"
      document.getElementById("voice-text").textContent = "Stop Recording"
      document.getElementById("voice-status").innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>Recording... Speak clearly and naturally!</span>
        </div>
      `

      // Add recording timer with tips
      this.recordingTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000)
        const tips = [
          "Try: 'Create a task to review the budget by Friday'",
          "Try: 'Remind me to call the client tomorrow at 2 PM'",
          "Try: 'Schedule a 30-minute meeting with the team'",
          "Try: 'Add a high priority task to finish the presentation'",
        ]
        const tip = tips[Math.floor(elapsed / 3) % tips.length]

        document.getElementById("voice-status").innerHTML = `
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording... ${elapsed}s</span>
            </div>
            <div class="text-xs text-slate-500">${tip}</div>
          </div>
        `
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      this.handleVoiceError(error.message)
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop())
      this.isRecording = false

      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }

      document.getElementById("voice-icon").textContent = "🎤"
      document.getElementById("voice-text").textContent = "Processing..."
      document.getElementById("voice-status").innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Processing with enhanced AI...</span>
        </div>
      `
    }
  }

  async processVoiceInput() {
    try {
      if (this.audioChunks.length === 0) {
        throw new Error("No audio data recorded")
      }

      const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" })

      if (audioBlob.size < 1000) {
        throw new Error("Recording too short. Please speak for at least 1 second.")
      }

      console.log("Audio blob size:", audioBlob.size, "bytes")

      const reader = new FileReader()

      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result.split(",")[1]

          // Get current page context for enhanced processing
          const pageContext = await this.getCurrentPageContext()

          const isTestMode = await this.checkTestMode()

          if (isTestMode) {
            this.handleMockVoiceResponse()
            return
          }

          const response = await fetch("http://localhost:8000/api/ai/voice-to-task", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              audio_data: base64Audio,
              user_id: "user123",
              context: {
                page_context: pageContext,
                user_context: "Chrome extension user",
                timestamp: new Date().toISOString(),
              },
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
          }

          const result = await response.json()
          console.log("Enhanced voice processing result:", result)

          this.lastProcessingResult = result
          this.displayVoiceResults(result)
          this.populateTaskFromVoice(result)
        } catch (error) {
          console.error("Error processing voice input:", error)
          this.handleVoiceError("Voice processing failed: " + error.message)
        }
      }

      reader.onerror = () => {
        this.handleVoiceError("Failed to read audio data")
      }

      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error("Error in processVoiceInput:", error)
      this.handleVoiceError(error.message)
    } finally {
      setTimeout(() => {
        if (document.getElementById("voice-text")) {
          document.getElementById("voice-text").textContent = "Start Voice Input"
        }
      }, 5000)
    }
  }

  async getCurrentPageContext() {
    try {
      const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })
      return `${tab.title} - ${tab.url}`
    } catch (error) {
      return "Chrome extension context"
    }
  }

  displayVoiceResults(result) {
    const resultsEl = document.getElementById("voice-results")
    const transcriptEl = document.getElementById("transcript-display")
    const confidenceEl = document.getElementById("confidence-display")
    const suggestionsEl = document.getElementById("suggestions-display")
    const warningsEl = document.getElementById("warnings-display")

    if (!resultsEl) return

    resultsEl.classList.remove("hidden")

    // Display transcript
    transcriptEl.innerHTML = `
      <div class="flex items-center space-x-2 mb-2">
        <span class="text-blue-400">📝</span>
        <span class="font-medium text-slate-300">Transcript:</span>
      </div>
      <div class="text-slate-400 italic">"${result.transcript}"</div>
    `

    // Display confidence score
    const confidenceColor =
      result.confidence_score >= 0.8
        ? "text-green-400"
        : result.confidence_score >= 0.6
          ? "text-yellow-400"
          : "text-red-400"
    confidenceEl.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-slate-400">Confidence Score:</span>
        <span class="${confidenceColor} font-medium">${Math.round(result.confidence_score * 100)}%</span>
      </div>
      <div class="text-xs text-slate-500">Processing time: ${result.processing_time_ms}ms</div>
    `

    // Display suggestions
    if (result.suggestions && result.suggestions.length > 0) {
      suggestionsEl.innerHTML = `
        <div class="flex items-center space-x-2 mb-1">
          <span class="text-blue-400">💡</span>
          <span class="font-medium text-slate-300">Suggestions:</span>
        </div>
        <ul class="text-slate-400 space-y-1">
          ${result.suggestions.map((suggestion) => `<li class="text-xs">• ${suggestion}</li>`).join("")}
        </ul>
      `
    } else {
      suggestionsEl.innerHTML = ""
    }

    // Display warnings
    if (result.warnings && result.warnings.length > 0) {
      warningsEl.innerHTML = `
        <div class="flex items-center space-x-2 mb-1">
          <span class="text-yellow-400">⚠️</span>
          <span class="font-medium text-slate-300">Warnings:</span>
        </div>
        <ul class="text-yellow-400 space-y-1">
          ${result.warnings.map((warning) => `<li class="text-xs">• ${warning}</li>`).join("")}
        </ul>
      `
    } else {
      warningsEl.innerHTML = ""
    }
  }

  async checkTestMode() {
    try {
      const response = await fetch("http://localhost:8000/health", {
        method: "GET",
        timeout: 2000,
      })
      return !response.ok
    } catch (error) {
      console.log("Backend not available, using test mode")
      return true
    }
  }

  handleMockVoiceResponse() {
    setTimeout(() => {
      const mockResult = {
        transcript: "Create a high priority task to review the quarterly budget report by Friday",
        extracted_task: {
          title: "Review quarterly budget report",
          description: "Analyze Q4 budget performance and prepare summary for leadership team",
          priority: "high",
          category: "work",
          estimated_duration: 120,
          due_date: this.getNextFriday(),
          tags: ["budget", "quarterly", "review", "finance"],
          confidence_score: 0.85,
        },
        confidence_score: 0.85,
        processing_time_ms: 1500,
        suggestions: ["Consider setting a specific time for the deadline", "Add reminder 1 day before due date"],
        warnings: [],
      }

      this.displayVoiceResults(mockResult)
      this.populateTaskFromVoice(mockResult)

      document.getElementById("voice-status").innerHTML = `
        <div class="flex items-center space-x-2 text-green-400">
          <span>✅</span>
          <span>Mock processing completed! (Backend offline)</span>
        </div>
      `
    }, 2000)
  }

  getNextFriday() {
    const today = new Date()
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)
    return nextFriday.toISOString().split("T")[0]
  }

  handleVoiceError(errorMessage) {
    console.error("Voice error:", errorMessage)

    document.getElementById("voice-icon").textContent = "🎤"
    document.getElementById("voice-text").textContent = "Start Voice Input"
    document.getElementById("voice-status").innerHTML = `
      <div class="flex items-center space-x-2 text-red-400">
        <span>❌</span>
        <span>${errorMessage}</span>
      </div>
    `

    setTimeout(() => {
      if (document.getElementById("voice-status")) {
        document.getElementById("voice-status").textContent = ""
      }
    }, 5000)
  }

  populateTaskFromVoice(result) {
    try {
      console.log("Populating task from enhanced voice result:", result)

      const taskData = result.extracted_task

      // Populate form fields with enhanced animation
      const fields = [
        { id: "task-title", value: taskData.title },
        { id: "task-description", value: taskData.description },
        { id: "task-priority", value: taskData.priority },
        { id: "task-category", value: taskData.category },
        { id: "task-due-date", value: taskData.due_date ? taskData.due_date.split("T")[0] : "" },
        { id: "task-due-time", value: taskData.due_time || "" },
        { id: "task-duration", value: taskData.estimated_duration || "" },
      ]

      fields.forEach((field, index) => {
        setTimeout(() => {
          const element = document.getElementById(field.id)
          if (element && field.value) {
            element.value = field.value
            element.style.backgroundColor = "#22c55e20"
            element.style.borderColor = "#22c55e"
            setTimeout(() => {
              element.style.backgroundColor = ""
              element.style.borderColor = ""
            }, 1000)
          }
        }, index * 200)
      })

      // Show enhanced success message
      setTimeout(() => {
        document.getElementById("voice-status").innerHTML = `
          <div class="space-y-2">
            <div class="flex items-center space-x-2 text-green-400">
              <span>✅</span>
              <span>Task extracted successfully!</span>
            </div>
            <div class="text-xs text-slate-400 space-y-1">
              <div><strong>Confidence:</strong> ${Math.round(result.confidence_score * 100)}%</div>
              <div><strong>Processing:</strong> ${result.processing_time_ms}ms</div>
              ${taskData.tags ? `<div><strong>Tags:</strong> ${taskData.tags.join(", ")}</div>` : ""}
            </div>
          </div>
        `
      }, 1000)
    } catch (error) {
      console.error("Error parsing voice result:", error)
      this.handleVoiceError("Could not extract task from voice input: " + error.message)
    }
  }

  async loadPageContext() {
    try {
      const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })
      const pageContext = document.getElementById("page-context")

      if (pageContext) {
        pageContext.textContent = `${tab.title} - ${tab.url}`
      }
    } catch (error) {
      console.error("Error loading page context:", error)
    }
  }

  async addPageContext() {
    try {
      const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })
      const description = document.getElementById("task-description")

      if (description) {
        const currentValue = description.value
        const pageInfo = `\n\nPage: ${tab.title}\nURL: ${tab.url}`
        description.value = currentValue + pageInfo
      }
    } catch (error) {
      console.error("Error adding page context:", error)
    }
  }

  async markComplete(taskId) {
    try {
      const response = await fetch(`http://localhost:8000/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      })

      if (response.ok) {
        await this.loadTasks()
        this.render()
        this.showNotification("Task completed! 🎉", "success")
      }
    } catch (error) {
      console.error("Error marking task complete:", error)
    }
  }

  openFullApp() {
    window.chrome.tabs.create({ url: "http://localhost:3000" })
  }

  getPriorityClass(priority) {
    switch (priority) {
      case "urgent":
        return "bg-red-600/20 text-red-300"
      case "high":
        return "bg-orange-500/20 text-orange-300"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300"
      case "low":
        return "bg-green-500/20 text-green-300"
      default:
        return "bg-slate-500/20 text-slate-300"
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    const bgColor = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600"
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  showValidationError(message) {
    this.showNotification(message, "error")
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.popup = new JipangePopup()
})
