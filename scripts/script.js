// Configuração e variáveis globais
const API_URL = "https://cloud-discord-rh-bot.onrender.com"
const UPDATE_INTERVAL = 10000 // 10 segundos

// Estado da aplicação
let botData = null
let updateTimer = null

// Elementos DOM
const elements = {
  // Theme
  themeToggle: document.getElementById("theme-toggle"),
  themeToggleMobile: document.getElementById("theme-toggle-mobile"),

  // Mobile menu
  mobileMenuBtn: document.getElementById("mobile-menu-btn"),
  mobileMenu: document.getElementById("mobile-menu"),
  mobileMenuClose: document.getElementById("mobile-menu-close"),

  // Status elements
  botStatus: document.getElementById("bot-status"),
  guildCount: document.getElementById("guild-count"),
  userCount: document.getElementById("user-count"),
  commandsCount: document.getElementById("commands-count"),

  // Commands elements
  commandsBadge: document.getElementById("commands-badge"),
  commandsLoading: document.getElementById("commands-loading"),
  commandsList: document.getElementById("commands-list"),
  commandsEmpty: document.getElementById("commands-empty"),
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme()
  initializeEventListeners()
  initializeAnimations()
  fetchBotStatus()
  startAutoUpdate()

  // Carregar avatar imediatamente
  setTimeout(loadBotAvatar, 1000)
})

// ===== THEME MANAGEMENT =====
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark"
  applyTheme(savedTheme)
}

function applyTheme(theme) {
  document.body.classList.toggle("dark-theme", theme === "dark")
  localStorage.setItem("theme", theme)
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark-theme")
  const newTheme = isDark ? "light" : "dark"
  applyTheme(newTheme)
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
  // Theme toggles
  elements.themeToggle?.addEventListener("click", toggleTheme)
  elements.themeToggleMobile?.addEventListener("click", toggleTheme)

  // Mobile menu
  elements.mobileMenuBtn?.addEventListener("click", openMobileMenu)
  elements.mobileMenuClose?.addEventListener("click", closeMobileMenu)
  elements.mobileMenu?.addEventListener("click", (e) => {
    if (e.target === elements.mobileMenu) {
      closeMobileMenu()
    }
  })

  // Navigation links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const targetId = link.getAttribute("href").substring(1)
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
        closeMobileMenu()
      }
    })
  })

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileMenu()
    }
    if (e.ctrlKey && e.key === "k") {
      e.preventDefault()
      // Implementar busca se necessário
    }
  })
}

// ===== MOBILE MENU =====
function openMobileMenu() {
  elements.mobileMenu?.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closeMobileMenu() {
  elements.mobileMenu?.classList.remove("active")
  document.body.style.overflow = ""
}

// ===== ANIMATIONS =====
function initializeAnimations() {
  // Intersection Observer para animações
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = "running"
      }
    })
  }, observerOptions)

  // Observar elementos com animação
  document.querySelectorAll(".animate-fade-up, .animate-slide-up").forEach((el) => {
    observer.observe(el)
  })
}

// ===== API FUNCTIONS =====
async function fetchBotStatus() {
  try {
    showLoadingState()

    const response = await fetch(`${API_URL}/status`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    botData = data

    updateStatusDisplay(data)
    updateCommandsDisplay(data.commands || [])

    console.log("✅ Status do bot atualizado:", data)
  } catch (error) {
    console.error("❌ Erro ao buscar status do bot:", error)
    handleApiError()
  }
}

function showLoadingState() {
  // Mostrar loading nos cards de status
  if (elements.botStatus) {
    elements.botStatus.innerHTML = `
      <div class="status-dot"></div>
      <span class="status-text">Carregando...</span>
    `
    elements.botStatus.className = "status"
  }

  // Mostrar loading na lista de comandos
  if (elements.commandsLoading) {
    elements.commandsLoading.style.display = "flex"
  }
  if (elements.commandsList) {
    elements.commandsList.style.display = "none"
  }
  if (elements.commandsEmpty) {
    elements.commandsEmpty.style.display = "none"
  }
}

// ===== BOT AVATAR LOADING =====
async function loadBotAvatar() {
  try {
    // Se já temos dados do bot no cache, usar eles
    if (botData && botData.bot && botData.bot.avatar) {
      const avatarElement = document.getElementById("bot-avatar")
      if (avatarElement) {
        avatarElement.src = botData.bot.avatar
        avatarElement.alt = `${botData.bot.username || "Bot"} Avatar`
        avatarElement.onerror = function () {
          // Fallback para placeholder se a imagem não carregar
          this.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%2364748b'%3EBot Avatar%3C/text%3E%3C/svg%3E"
        }
        console.log("✅ Avatar carregado:", botData.bot.avatar)
        return
      }
    }

    // Se não tiver no cache, buscar do endpoint /bot
    const response = await fetch(`${API_URL}/bot`)
    if (response.ok) {
      const botInfo = await response.json()
      const avatarElement = document.getElementById("bot-avatar")

      if (avatarElement && botInfo.avatar) {
        avatarElement.src = botInfo.avatar
        avatarElement.alt = `${botInfo.username || "Bot"} Avatar`
        avatarElement.onerror = function () {
          // Fallback para placeholder se a imagem não carregar
          this.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%2364748b'%3EBot Avatar%3C/text%3E%3C/svg%3E"
        }
        console.log("✅ Avatar carregado da API:", botInfo.avatar)
      }
    }
  } catch (error) {
    console.log("⚠️ Avatar do bot não disponível, usando placeholder:", error.message)
    const avatarElement = document.getElementById("bot-avatar")
    if (avatarElement) {
      avatarElement.src =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%2364748b'%3EBot Avatar%3C/text%3E%3C/svg%3E"
      avatarElement.alt = "Bot Avatar"
    }
  }
}

function updateStatusDisplay(data) {
  // Atualizar status do bot
  if (elements.botStatus) {
    const isOnline = data.online
    elements.botStatus.innerHTML = `
      <div class="status-dot"></div>
      <span class="status-text">${isOnline ? "Online" : "Offline"}</span>
    `
    elements.botStatus.className = `status ${isOnline ? "online" : "offline"}`
  }

  // Atualizar contadores com animação
  animateCounter(elements.guildCount, data.guilds || 0)
  animateCounter(elements.userCount, data.users || 0, "--")
  animateCounter(elements.commandsCount, (data.commands || []).length)
  animateCounter(elements.commandsBadge, (data.commands || []).length)

  // Carregar avatar se disponível
  if (data.bot && data.bot.avatar) {
    loadBotAvatar()
  }

  // Atualizar lista de comandos
  updateCommandsDisplay(data.commands || [])
}

function updateCommandsDisplay(commands) {
  // Esconder loading
  if (elements.commandsLoading) {
    elements.commandsLoading.style.display = "none"
  }

  if (!commands || commands.length === 0) {
    // Mostrar estado vazio
    if (elements.commandsEmpty) {
      elements.commandsEmpty.style.display = "flex"
    }
    if (elements.commandsList) {
      elements.commandsList.style.display = "none"
    }
    return
  }

  // Mostrar lista de comandos
  if (elements.commandsEmpty) {
    elements.commandsEmpty.style.display = "none"
  }
  if (elements.commandsList) {
    elements.commandsList.style.display = "block"
    elements.commandsList.innerHTML = ""

    commands.forEach((command, index) => {
      const commandElement = createCommandElement(command, index)
      elements.commandsList.appendChild(commandElement)
    })
  }
}

function createCommandElement(command, index) {
  const div = document.createElement("div")
  div.className = "command-item"
  div.style.animationDelay = `${index * 0.05}s`

  div.innerHTML = `
    <div class="command-icon">
      /
    </div>
    <div class="command-content">
      <div class="command-name">/${command.name}</div>
      <div class="command-description">${command.description || "Sem descrição disponível"}</div>
    </div>
  `

  return div
}

function animateCounter(element, targetValue, fallback = "0") {
  if (!element) return

  const currentValue = Number.parseInt(element.textContent.replace(/[^\d]/g, "")) || 0
  const target = typeof targetValue === "number" ? targetValue : 0

  if (target === 0 && fallback !== "0") {
    element.textContent = fallback
    return
  }

  const duration = 1000 // 1 segundo
  const steps = 30
  const stepValue = (target - currentValue) / steps
  const stepDuration = duration / steps

  let current = currentValue
  let step = 0

  const timer = setInterval(() => {
    step++
    current += stepValue

    if (step >= steps) {
      current = target
      clearInterval(timer)
    }

    element.textContent = Math.round(current).toLocaleString()
  }, stepDuration)
}

function handleApiError() {
  // Atualizar status para offline
  if (elements.botStatus) {
    elements.botStatus.innerHTML = `
      <div class="status-dot"></div>
      <span class="status-text">Offline</span>
    `
    elements.botStatus.className = "status offline"
  }

  // Resetar contadores
  if (elements.guildCount) elements.guildCount.textContent = "0"
  if (elements.userCount) elements.userCount.textContent = "--"
  if (elements.commandsCount) elements.commandsCount.textContent = "0"
  if (elements.commandsBadge) elements.commandsBadge.textContent = "0"

  // Mostrar estado de erro nos comandos
  if (elements.commandsLoading) {
    elements.commandsLoading.style.display = "none"
  }
  if (elements.commandsList) {
    elements.commandsList.style.display = "none"
  }
  if (elements.commandsEmpty) {
    elements.commandsEmpty.style.display = "flex"
    elements.commandsEmpty.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Erro ao carregar comandos</h3>
      <p>Não foi possível conectar com o bot. Tentando novamente...</p>
    `
  }
}

// ===== AUTO UPDATE =====
function startAutoUpdate() {
  updateTimer = setInterval(fetchBotStatus, UPDATE_INTERVAL)
}

function stopAutoUpdate() {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
}

// ===== UTILITY FUNCTIONS =====
function formatNumber(num) {
  if (typeof num !== "number") return "--"

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }

  return num.toLocaleString()
}

function formatUptime(seconds) {
  if (typeof seconds !== "number") return "--"

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// ===== CLEANUP =====
window.addEventListener("beforeunload", () => {
  stopAutoUpdate()
})

// ===== DEBUG =====
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  window.botDebug = {
    fetchStatus: fetchBotStatus,
    botData: () => botData,
    toggleTheme,
    elements,
  }
  console.log("🔧 Debug mode ativo. Use window.botDebug para acessar funções de debug.")
}
