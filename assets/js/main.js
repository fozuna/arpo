const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const mobileMenu = document.getElementById("mobile-menu");
const year = document.getElementById("year");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function onScroll() {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 10);
}

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

function closeMenu() {
  document.body.classList.remove("nav-open");
  if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  if (mobileMenu) mobileMenu.setAttribute("inert", "");
}

function openMenu() {
  document.body.classList.add("nav-open");
  if (navToggle) navToggle.setAttribute("aria-expanded", "true");
  if (mobileMenu) {
    mobileMenu.removeAttribute("inert");
    const firstLink = mobileMenu.querySelector("a");
    if (firstLink) firstLink.focus();
  }
}

if (navToggle && mobileMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.contains("nav-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  mobileMenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      navToggle.focus();
    }
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href").slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    const headerOffset = header ? header.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 16;
    window.scrollTo({ top, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
    closeMenu();
  });
});

if (year) year.textContent = String(new Date().getFullYear());

// Indicador de página ativa: compara o caminho do link com a URL atual.
// Funciona em qualquer página sem precisar hardcodar a página corrente no HTML.
(function markActiveNav() {
  const here = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a, .mobile-menu a, .nav-dropdown-panel a").forEach((link) => {
    const linkPath = link.getAttribute("href").split("/").pop().split("#")[0] || "index.html";
    if (linkPath === here) {
      link.setAttribute("aria-current", "page");
    }
  });
})();

// Dropdown "Serviços" (<details>): funciona nativamente sem JS; aqui só
// adicionamos fechar ao clicar fora e ao pressionar Escape, e evitar mais
// de um aberto ao mesmo tempo.
const navDropdowns = document.querySelectorAll(".nav-dropdown");
if (navDropdowns.length) {
  document.addEventListener("click", (event) => {
    navDropdowns.forEach((dd) => {
      if (dd.hasAttribute("open") && !dd.contains(event.target)) dd.removeAttribute("open");
    });
  });
  navDropdowns.forEach((dd) => {
    dd.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dd.hasAttribute("open")) {
        dd.removeAttribute("open");
        const summary = dd.querySelector("summary");
        if (summary) summary.focus();
      }
    });
    dd.addEventListener("toggle", () => {
      if (dd.open) {
        navDropdowns.forEach((other) => {
          if (other !== dd) other.removeAttribute("open");
        });
      }
    });
  });
}

// Barra de progresso de leitura (página de artigo) — opcional, só roda se existir.
const progressBar = document.querySelector(".reading-progress-bar");
const articleBody = document.querySelector(".article-body");
if (progressBar && articleBody) {
  const updateProgress = () => {
    const rect = articleBody.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.5;
    const scrolled = -rect.top;
    const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
    progressBar.style.width = pct + "%";
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

// Formulário de diagnóstico: valida no cliente, envia de fato para
// enviar-diagnostico.php e mostra a resposta real do servidor — nunca uma
// mensagem de sucesso simulada. Em caso de erro, os dados digitados
// permanecem no formulário.
const diagnosticForm = document.getElementById("diagnostic-form");
if (diagnosticForm) {
  const status = diagnosticForm.querySelector(".form-status");
  const submitButton = diagnosticForm.querySelector('button[type="submit"]');
  const csrfField = diagnosticForm.querySelector("#f-csrf-token");

  if (csrfField) {
    fetch("csrf-token.php", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.token) csrfField.value = data.token;
      })
      .catch(() => {});
  }

  function showStatus(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("form-status--error", isError);
    status.classList.add("is-visible");
    status.setAttribute("tabindex", "-1");
    status.focus();
  }

  diagnosticForm.addEventListener("submit", (event) => {
    event.preventDefault();
    let firstInvalid = null;
    diagnosticForm.querySelectorAll("[required]").forEach((field) => {
      const wrapper = field.closest(".field");
      const invalid = !field.checkValidity();
      if (wrapper) wrapper.classList.toggle("has-error", invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      showStatus("Revise os campos destacados antes de enviar.", true);
      return;
    }

    if (submitButton) submitButton.disabled = true;
    showStatus("Enviando...", false);

    fetch(diagnosticForm.action, {
      method: "POST",
      body: new FormData(diagnosticForm),
      credentials: "same-origin",
    })
      .then((res) => res.json().catch(() => ({ success: false, message: "Não foi possível interpretar a resposta do servidor." })))
      .then((data) => {
        showStatus(
          data.message || (data.success ? "Solicitação enviada com sucesso." : "Não foi possível enviar. Tente novamente."),
          !data.success
        );
        if (data.success) diagnosticForm.reset();
      })
      .catch(() => {
        showStatus(
          "Não foi possível enviar agora. Nenhum dado foi perdido — copie as informações acima e envie para contato@grupoarpo.com.br.",
          true
        );
      })
      .finally(() => {
        if (submitButton) submitButton.disabled = false;
      });
  });
}
