// Paint the right theme before React loads to avoid a color flash.
try {
  document.documentElement.dataset.theme = localStorage.getItem('budget:theme') || 'dark'
} catch {
  document.documentElement.dataset.theme = 'dark'
}
