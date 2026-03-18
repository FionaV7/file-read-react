/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    colors: {
      'dark-bg': '#000000',
      'card-bg': '#1A1A1A',
      'card-hover': '#2A2A2A',
      'primary-red': '#DC2626',
      'accent-red': '#EF4444',
      'red-hover': '#B91C1C',
      'secondary': '#991B1B',
      'success': '#10B981',
      'danger': '#DC2626',
      'white': '#FFFFFF',
      'gray-100': '#F3F4F6',
      'gray-200': '#E5E7EB',
      'gray-300': '#D1D5DB',
      'gray-400': '#9CA3AF',
      'gray-500': '#6B7280',
      'gray-600': '#4B5563',
      'gray-700': '#374151',
      'gray-800': '#1F2937',
      'gray-900': '#111827',
      'black': '#000000',
      'red-400': '#F87171',
      'red-500': '#EF4444',
      'red-600': '#DC2626',
      'red-700': '#B91C1C',
      'red-800': '#991B1B',
      'green-400': '#4ADE80',
      'green-500': '#22C55E',
      'green-600': '#16A34A',
      'yellow-400': '#FACC15'
    },
    extend: {}
  },
  plugins: []
}
