# Dockerfile
FROM node:22-slim

# Установка рабочей директории
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY setup.js ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Создаем необходимые директории
RUN mkdir -p uploads logs temp webapp

# Сборка приложения
RUN npm run build

# Открываем порт
EXPOSE 3000

# Команда запуска
CMD ["npm", "start"]

# Или для продакшена с PM2:
# CMD ["pm2-runtime", "start", "ecosystem.config.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1
