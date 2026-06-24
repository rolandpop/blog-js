;(function () {
  const storageKey = 'theme'
  const root = document.documentElement
  const toggle = document.querySelector('.theme-toggle')

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme)
    localStorage.setItem(storageKey, theme)
  }

  const saved = localStorage.getItem(storageKey)
  applyTheme(saved === 'light' ? 'light' : 'dark')

  if (toggle) {
    toggle.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
      applyTheme(next)
    })
  }
})()
