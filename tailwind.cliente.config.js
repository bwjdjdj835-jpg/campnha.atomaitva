// Tailwind do site do CLIENTE (igual ao tailwind.config.js que vai no ZIP).
// Usado para compilar o CSS embutido na prévia do Gato Negro (src/lib/cliente.css).
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/lib/ClienteSite.jsx'],
  theme: { extend: {} },
  plugins: [],
}
