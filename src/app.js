/**
 * Day 2 Main Application - MVC Implementation
 *
 * Orchestrates semua komponen:
 * - Storage Manager
 * - Repositories
 * - Controllers
 * - Views
 * - User Authentication
 */

// Global application state
let app = {
  storage: null,
  userRepository: null,
  taskRepository: null,
  userController: null,
  taskController: null,
  taskView: null,
  currentUser: null,
};

/**
 * Initialize aplikasi
 */
function initializeApp() {
  console.log("🚀 Initializing Day 2 Task Management System...");

  try {
    // Initialize storage manager
    app.storage = new EnhancedStorageManager("taskAppDay2", "2.0");
    console.log("✅ Storage manager initialized");

    // Initialize repositories
    app.userRepository = new UserRepository(app.storage);
    app.taskRepository = new TaskRepository(app.storage);
    console.log("✅ Repositories initialized");

    // Initialize controllers
    app.userController = new UserController(app.userRepository);
    app.taskController = new TaskController(
      app.taskRepository,
      app.userRepository
    );
    console.log("✅ Controllers initialized");

    // Initialize view
    app.taskView = new TaskView(app.taskController, app.userController);
    console.log("✅ Views initialized");

    // Setup authentication event listeners
    setupAuthEventListeners();

    // Create demo user jika belum ada
    createDemoUserIfNeeded();

    // Show login section
    showLoginSection();

    console.log("✅ Day 2 Application initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);
    showMessage("Gagal menginisialisasi aplikasi: " + error.message, "error");
  }
}

/**
 * Setup authentication event listeners
 */
function setupAuthEventListeners() {
  // Login button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", handleLogin);
  }

  // Register button
  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.addEventListener("click", showRegisterModal);
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Username input (Enter key)
  const usernameInput = document.getElementById("usernameInput");
  if (usernameInput) {
    usernameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleLogin();
      }
    });
  }

  // Register form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  // Register modal close
  const closeRegisterModal = document.getElementById("closeRegisterModal");
  const cancelRegister = document.getElementById("cancelRegister");
  if (closeRegisterModal) {
    closeRegisterModal.addEventListener("click", hideRegisterModal);
  }
  if (cancelRegister) {
    cancelRegister.addEventListener("click", hideRegisterModal);
  }

  // Quick action buttons
  const showOverdueBtn = document.getElementById("showOverdueBtn");
  const showDueSoonBtn = document.getElementById("showDueSoonBtn");
  const exportDataBtn = document.getElementById("exportDataBtn");
  const refreshTasks = document.getElementById("refreshTasks");

  if (showOverdueBtn) {
    showOverdueBtn.addEventListener("click", showOverdueTasks);
  }
  if (showDueSoonBtn) {
    showDueSoonBtn.addEventListener("click", showDueSoonTasks);
  }
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", exportAppData);
  }
  if (refreshTasks) {
    refreshTasks.addEventListener("click", () => app.taskView.refresh());
  }

  // ============================================
  // UI IMPROVEMENTS - Day 4 (FIXED VERSION)
  // ============================================

  // Setup loading states untuk form submissions
  setupLoadingStates();

  // Setup category filters (if exists)
  setupCategoryFilters();

  // Setup task filters (if exists)
  setupTaskFilters();
}

/**
 * Setup loading states untuk buttons
 * IMPROVED: Hanya untuk button dengan data-loading="true"
 */
function setupLoadingStates() {
  // Handle form submissions dengan loading state
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;

        // Remove loading setelah form di-handle
        // Timeout sebagai fallback jika promise tidak di-handle
        const timeoutId = setTimeout(() => {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
        }, 3000);

        // Store timeout ID untuk clear nanti
        submitBtn.dataset.timeoutId = timeoutId;
      }
    });
  });
}

/**
 * Remove loading state dari button
 */
function removeLoadingState(button) {
  if (button) {
    button.classList.remove("loading");
    button.disabled = false;

    // Clear timeout jika ada
    if (button.dataset.timeoutId) {
      clearTimeout(button.dataset.timeoutId);
      delete button.dataset.timeoutId;
    }
  }
}

/**
 * Setup category filters
 */
function setupCategoryFilters() {
  const categoryButtons = document.querySelectorAll(".category-btn");

  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Toggle active state
      categoryButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.dataset.category;

      // Filter tasks by category
      if (app.taskView && typeof app.taskView.filterByCategory === "function") {
        app.taskView.filterByCategory(category);
      } else {
        // Fallback: manual filter
        filterTasksByCategory(category);
      }
    });
  });
}

/**
 * Setup task filters (status, priority)
 */
function setupTaskFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Toggle active state
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;

      // Apply filter
      if (app.taskView && typeof app.taskView.filterTasks === "function") {
        app.taskView.filterTasks(filter);
      } else {
        // Fallback: manual filter
        filterTasksByStatus(filter);
      }
    });
  });
}

/**
 * Filter tasks by category (fallback implementation)
 */
function filterTasksByCategory(category) {
  const taskItems = document.querySelectorAll(".task-item");

  taskItems.forEach((item) => {
    const taskCategory = item.dataset.category;

    if (category === "all" || taskCategory === category) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });
}

/**
 * Filter tasks by status (fallback implementation)
 */
function filterTasksByStatus(filter) {
  const taskItems = document.querySelectorAll(".task-item");

  taskItems.forEach((item) => {
    const isCompleted = item.classList.contains("completed");
    const priority = item.dataset.priority;

    let shouldShow = false;

    switch (filter) {
      case "all":
        shouldShow = true;
        break;
      case "pending":
        shouldShow = !isCompleted;
        break;
      case "completed":
        shouldShow = isCompleted;
        break;
      case "high":
        shouldShow = priority === "high";
        break;
      default:
        shouldShow = true;
    }

    item.style.display = shouldShow ? "" : "none";
  });
}

/**
 * Handle user login
 */
function handleLogin() {
  const usernameInput = document.getElementById("usernameInput");
  const loginBtn = document.getElementById("loginBtn");
  const username = usernameInput.value.trim();

  if (!username) {
    showMessage("Username wajib diisi", "error");
    return;
  }

  // Add loading state
  if (loginBtn) {
    loginBtn.classList.add("loading");
    loginBtn.disabled = true;
  }

  // Simulate async operation
  setTimeout(() => {
    const response = app.userController.login(username);

    if (response.success) {
      app.currentUser = response.data;

      // Set current user di task controller
      app.taskController.setCurrentUser(app.currentUser.id);

      // Show main content
      showMainContent();

      // Load user list untuk assign dropdown
      loadUserListForAssign();

      // Refresh views
      app.taskView.refresh();

      showMessage(response.message, "success");
    } else {
      showMessage(response.error, "error");
    }

    // Remove loading state
    if (loginBtn) {
      loginBtn.classList.remove("loading");
      loginBtn.disabled = false;
    }
  }, 300);
}

/**
 * Handle user logout
 */
function handleLogout() {
  const response = app.userController.logout();

  app.currentUser = null;

  // Hide main content
  hideMainContent();

  // Show login section
  showLoginSection();

  showMessage(response.message, "info");
}

/**
 * Show register modal
 */
function showRegisterModal() {
  const modal = document.getElementById("registerModal");
  if (modal) {
    modal.style.display = "flex";

    // Focus on first input
    const firstInput = modal.querySelector("input");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

/**
 * Hide register modal
 */
function hideRegisterModal() {
  const modal = document.getElementById("registerModal");
  if (modal) {
    modal.style.display = "none";
  }

  // Reset form
  const form = document.getElementById("registerForm");
  if (form) {
    form.reset();

    // Remove loading state dari submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    removeLoadingState(submitBtn);
  }
}

/**
 * Handle user registration
 */
function handleRegister(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const userData = {
    username: formData.get("username")?.trim(),
    email: formData.get("email")?.trim(),
    fullName: formData.get("fullName")?.trim(),
  };

  const submitBtn = event.target.querySelector('button[type="submit"]');

  // Simulate async operation
  setTimeout(() => {
    const response = app.userController.register(userData);

    if (response.success) {
      hideRegisterModal();
      showMessage(response.message, "success");

      // Auto-fill username untuk login
      const usernameInput = document.getElementById("usernameInput");
      if (usernameInput) {
        usernameInput.value = userData.username;
      }
    } else {
      showMessage(response.error, "error");
    }

    // Remove loading state
    removeLoadingState(submitBtn);
  }, 300);
}

/**
 * Show login section
 */
function showLoginSection() {
  const loginSection = document.getElementById("loginSection");
  const userInfo = document.getElementById("userInfo");
  const mainContent = document.getElementById("mainContent");

  if (loginSection) loginSection.style.display = "flex";
  if (userInfo) userInfo.style.display = "none";
  if (mainContent) mainContent.style.display = "none";

  // Clear username input
  const usernameInput = document.getElementById("usernameInput");
  if (usernameInput) {
    usernameInput.value = "";
    usernameInput.focus();
  }
}

/**
 * Show main content
 */
function showMainContent() {
  const loginSection = document.getElementById("loginSection");
  const userInfo = document.getElementById("userInfo");
  const mainContent = document.getElementById("mainContent");
  const welcomeMessage = document.getElementById("welcomeMessage");

  if (loginSection) loginSection.style.display = "none";
  if (userInfo) userInfo.style.display = "flex";
  if (mainContent) mainContent.style.display = "block";

  if (welcomeMessage && app.currentUser) {
    welcomeMessage.textContent = `Selamat datang, ${
      app.currentUser.fullName || app.currentUser.username
    }!`;
  }
}

/**
 * Hide main content
 */
function hideMainContent() {
  const mainContent = document.getElementById("mainContent");
  if (mainContent) {
    mainContent.style.display = "none";
  }
}

/**
 * Load user list untuk assign dropdown
 */
function loadUserListForAssign() {
  const response = app.userController.getAllUsers();

  if (response.success) {
    const assigneeSelect = document.getElementById("taskAssignee");
    if (assigneeSelect) {
      // Clear existing options except "self"
      assigneeSelect.innerHTML = '<option value="self">Diri Sendiri</option>';

      // Add other users
      response.data.forEach((user) => {
        if (user.id !== app.currentUser.id) {
          const option = document.createElement("option");
          option.value = user.id;
          option.textContent = user.fullName || user.username;
          assigneeSelect.appendChild(option);
        }
      });
    }
  }
}

/**
 * Show overdue tasks
 */
function showOverdueTasks() {
  const response = app.taskController.getOverdueTasks();

  if (response.success) {
    if (response.count === 0) {
      showMessage("Tidak ada task yang overdue", "info");
    } else {
      showMessage(`Ditemukan ${response.count} task yang overdue`, "warning");
      // Apply filter to show only overdue tasks
      if (app.taskView && typeof app.taskView.filterOverdue === "function") {
        app.taskView.filterOverdue();
      }
    }
  } else {
    showMessage(response.error, "error");
  }
}

/**
 * Show tasks due soon
 */
function showDueSoonTasks() {
  const response = app.taskController.getTasksDueSoon(3);

  if (response.success) {
    if (response.count === 0) {
      showMessage("Tidak ada task yang akan due dalam 3 hari", "info");
    } else {
      showMessage(
        `Ditemukan ${response.count} task yang akan due dalam 3 hari`,
        "warning"
      );
      // Apply filter to show only due soon tasks
      if (app.taskView && typeof app.taskView.filterDueSoon === "function") {
        app.taskView.filterDueSoon();
      }
    }
  } else {
    showMessage(response.error, "error");
  }
}

/**
 * Export app data
 */
function exportAppData() {
  const exportBtn = document.getElementById("exportDataBtn");

  if (exportBtn) {
    exportBtn.classList.add("loading");
    exportBtn.disabled = true;
  }

  setTimeout(() => {
    const exportData = app.storage.exportData();

    if (exportData) {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `task-app-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      showMessage("Data berhasil diekspor", "success");
    } else {
      showMessage("Gagal mengekspor data", "error");
    }

    if (exportBtn) {
      exportBtn.classList.remove("loading");
      exportBtn.disabled = false;
    }
  }, 500);
}

/**
 * Create demo user jika belum ada
 */
function createDemoUserIfNeeded() {
  const users = app.userRepository.findAll();

  if (users.length === 0) {
    try {
      // Buat demo user
      app.userRepository.create({
        username: "demo",
        email: "demo@example.com",
        fullName: "Demo User",
      });

      app.userRepository.create({
        username: "john",
        email: "john@example.com",
        fullName: "John Doe",
      });

      console.log("✅ Demo users created");
    } catch (error) {
      console.error("Failed to create demo users:", error);
    }
  }
}

/**
 * Show message to user
 */
function showMessage(message, type = "info") {
  if (app.taskView) {
    app.taskView.showMessage(message, type);
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

/**
 * Handle errors globally
 */
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  showMessage("Terjadi kesalahan pada aplikasi", "error");
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  showMessage("Terjadi kesalahan pada aplikasi", "error");
});

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);

// Export untuk testing (jika diperlukan)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializeApp,
    handleLogin,
    handleLogout,
    handleRegister,
    setupCategoryFilters,
    setupTaskFilters,
    app,
  };
}