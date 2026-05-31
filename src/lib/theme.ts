export function getThemeBootstrapScript(): string {
  return `(function () {
  document.documentElement.setAttribute("data-theme", "dark");
})();`;
}
