# 🍽️ Fridge Savvy Meals Tracker

A comprehensive food inventory and meal planning application that helps you reduce waste, save money, and make smarter food decisions with AI-powered recommendations.

## ✨ Features

### 🥗 Core Food Management
- **Smart Inventory Tracking**: Track food items with expiration dates, storage locations, and freshness status
- **Meal Planning**: Create and manage meal plans with ingredients and preparation steps
- **Recipe Management**: Save, organize, and generate recipes from your ingredients
- **Bulk Operations**: Select and manage multiple items at once
- **Action History**: Track all your food-related activities with detailed logs

### 🤖 AI-Powered Intelligence
- **Multi-Provider AI Support**: Configure OpenAI, Anthropic Claude, or Google Gemini
- **Smart Recommendations**: 
  - Shopping suggestions based on consumption patterns
  - Meal recommendations using available ingredients
  - Low stock alerts with restocking suggestions
  - Personalized insights and next actions
- **Photo Analysis**: Take photos of food items for automatic identification and data entry
- **Voice Recording**: Speak to add items or create meal plans hands-free
- **Recipe Generation**: AI creates recipes from your available ingredients

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Theme**: Automatic theme switching with system preference detection
- **Real-time Updates**: Live inventory status and freshness tracking
- **Search & Filter**: Find items quickly with advanced filtering options
- **Status Indicators**: Visual freshness status (Fresh, Use Soon, Critical, Expired)

### 🔧 Advanced Features
- **Multi-language Support**: English, Hebrew, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic
- **Unit Conversion**: Automatic conversion between different measurement units
- **Storage Location Management**: Organize items by fridge, freezer, pantry, etc.
- **Tags & Categories**: Categorize items with custom tags
- **Export & Backup**: Secure data storage with Supabase

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons

### Backend & Database
- **Supabase** for backend-as-a-service
- **PostgreSQL** database with Row Level Security
- **Supabase Edge Functions** for serverless API endpoints
- **Real-time subscriptions** for live updates

### AI & Integrations
- **OpenAI GPT-4** integration
- **Anthropic Claude** integration  
- **Google Gemini** integration
- **Image analysis** for food identification
- **Speech-to-text** for voice input

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **PostCSS** and **Autoprefixer** for CSS processing



## 🎯 Key Features in Detail

### Smart Inventory Management
- Track food items with detailed metadata (name, amount, unit, storage location)
- Automatic freshness status calculation based on expiration dates
- Bulk operations for efficient item management
- Advanced filtering by status, type, location, and tags

### AI-Powered Recommendations
- **Shopping Suggestions**: Based on consumption patterns and current inventory
- **Meal Recommendations**: Using available ingredients and preferences
- **Low Stock Alerts**: Proactive notifications for items running low
- **Consumption Insights**: Learn from your usage patterns

### Photo & Voice Analysis
- **Photo Analysis**: Upload photos to automatically identify and add food items
- **Bulk Photo Analysis**: Process multiple items at once
- **Voice Recording**: Speak to add items or create meal plans
- **Meal Plan Voice**: Create detailed meal plans through voice input

### Recipe Management
- **Recipe Generation**: AI creates recipes from your available ingredients
- **Recipe Library**: Save and organize your favorite recipes
- **Meal Planning**: Convert recipes to meal plans with shopping lists
- **Nutritional Information**: Detailed recipe information and tips

## 🌐 Multi-Language Support

The application supports multiple languages with AI-powered translations:
- English (default)
- Hebrew
- Spanish
- French
- German
- Italian
- Portuguese
- Russian
- Chinese
- Japanese
- Korean
- Arabic

## 🔧 Configuration

### AI Provider Setup
1. Navigate to Settings → AI Providers
2. Choose your preferred AI provider (OpenAI, Anthropic, or Gemini)
3. Enter your API key and any additional required fields
4. Enable AI recommendations for personalized insights

### User Preferences
- Set dietary restrictions and preferences
- Configure shopping frequency
- Set household size for better recommendations
- Customize meal type preferences

## 📱 Mobile Experience

The application is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Swipe gestures for item management
- Camera integration for photo analysis
- Voice input for hands-free operation
- Offline capability for core features

**Fridge Savvy Meals Tracker** - Never let food go to waste again! 🍽️✨
