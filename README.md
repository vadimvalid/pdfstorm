## Структура проекта

```
pdfstorm/
├── index.html          # Главная страница (источник для разработки и сборки)
├── resources/
│   ├── views/          # Шаблоны компонентов (опционально, для справки)
│   │   ├── components/ # Компоненты (header, footer, cards)
│   │   ├── base.html   # Базовый шаблон (опционально)
│   │   └── index.html  # Шаблон (не используется, оставлен для справки)
│   ├── css/            # Стили (Tailwind, PostCSS)
│   │   └── main.css
│   ├── js/             # JavaScript
│   │   └── main.js
│   └── images/         # Изображения и иконки
├── dist/               # Собранные файлы (после build)
├── vite.config.js      # Конфигурация Vite
├── package.json        # Зависимости проекта
└── build.js           # Скрипт обработки HTML и обновления путей к ресурсам
```

## Установка

```bash
npm install
```

## Разработка

Запуск dev-сервера:

```bash
npm run dev
```

Проект будет доступен по адресу `http://localhost:5173`

## Сборка

Сборка проекта:

```bash
npm run build
```