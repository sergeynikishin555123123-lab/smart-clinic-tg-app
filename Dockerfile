FROM node:18-alpine

WORKDIR /app

# Копируем только package.json сначала
COPY package.json ./

# Установка зависимостей с обходом проблем
RUN echo "📦 Installing dependencies..." && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set legacy-peer-deps true && \
    npm install --no-package-lock --legacy-peer-deps --no-audit --no-fund

# Копируем остальные файлы
COPY . .

# Создаем необходимые директории
RUN mkdir -p uploads/courses uploads/podcasts uploads/streams uploads/videos \
    uploads/materials uploads/avatars uploads/documents logs backups temp webapp/assets

# Запускаем setup
RUN node setup.js --non-interactive

EXPOSE 3000

CMD ["npm", "start"]
