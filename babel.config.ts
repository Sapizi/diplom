module.exports = {
  presets: ['next/babel', '@babel/preset-react'], // Добавляем preset-react
  plugins: [
    ['styled-components', { ssr: true }]
  ],
};