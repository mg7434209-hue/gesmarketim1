/** Tasarım token'ları — marka paleti + tutarlı radius/gölge.
    Her sayfa/bileşen BU token'ları kullanır; ham hex yazılmaz. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#36C5EC",
          green: "#6ABF89",
          lime: "#A2C864",
          amber: "#FDC722",
          red: "#F65863",
          ink: "#474948"
        },
        surface: { DEFAULT: "#fdfdfb", alt: "#f7f9f8", card: "#ffffff", line: "#e5e9e7" }
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
      borderRadius: { card: "14px", btn: "10px" },
      boxShadow: {
        card: "0 8px 24px rgba(71,73,72,.08), 0 2px 6px rgba(71,73,72,.05)",
        btn: "0 2px 8px rgba(253,199,34,.35)"
      },
      maxWidth: { wrap: "1200px" }
    }
  },
  plugins: []
};
