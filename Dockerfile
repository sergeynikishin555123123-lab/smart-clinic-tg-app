# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем только необходимые файлы для установки зависимостей
COPY package*.json ./
COPY *.js ./
COPY webapp/ ./webapp/

# Устанавливаем зависимости с явными флагами
RUN echo "🔧 Установка зависимостей Академии АНБ..." && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set strict-ssl false && \
    npm config set legacy-peer-deps true && \
    npm install --production --no-optional --no-audit --no-fund

# Создаем необходимые директории
RUN mkdir -p uploads logs

# Запускаем настройку
RUN node setup.js

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "server.js"]
