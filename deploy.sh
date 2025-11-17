#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Установка зависимостей с повторными попытками
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Попытка 1: обычная установка
    if npm install; then
        echo "✅ Dependencies installed successfully"
        return 0
    fi
    
    echo "⚠️ First attempt failed, retrying with legacy peer deps..."
    
    # Попытка 2: с legacy peer deps
    if npm install --legacy-peer-deps; then
        echo "✅ Dependencies installed with legacy peer deps"
        return 0
    fi
    
    echo "⚠️ Second attempt failed, retrying with force..."
    
    # Попытка 3: с force
    if npm install --force; then
        echo "✅ Dependencies installed with force"
        return 0
    fi
    
    echo "❌ All installation attempts failed"
    return 1
}

# Запуск установки
if install_dependencies; then
    echo "🔧 Running setup..."
    npm run setup
    
    echo "🎉 Deployment completed successfully!"
else
    echo "💥 Deployment failed due to dependency issues"
    exit 1
fi
