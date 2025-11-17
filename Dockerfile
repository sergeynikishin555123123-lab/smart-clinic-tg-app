FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем исходный код
COPY . .

# Создаем необходимые директории
RUN mkdir -p uploads/courses uploads/podcasts uploads/streams uploads/videos uploads/materials uploads/events uploads/promotions webapp/assets logs temp

# Запускаем настройку
RUN npm run setup

EXPOSE 3000

CMD ["npm", "start"]
