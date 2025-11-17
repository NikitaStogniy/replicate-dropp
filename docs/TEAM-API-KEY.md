# Team Replicate API Key - Implementation Guide

## Что реализовано

Каждая команда теперь использует свой собственный Replicate API ключ для генерации изображений. Общего ключа больше нет.

## Изменения

### 1. База данных
✅ Добавлено поле `replicate_api_key` в таблицу `teams`

### 2. API Endpoints
✅ **GET `/api/admin/api-key`** - получить статус и замаскированный ключ
✅ **PATCH `/api/admin/api-key`** - обновить ключ команды

### 3. Генерация
✅ `/api/generate` теперь использует ключ команды
✅ Если ключа нет - возвращается ошибка

### 4. Admin UI
✅ Новая секция "Replicate API Key" в admin dashboard
✅ Показывает статус: configured/not configured
✅ При наличии ключа - показывает замаскированную версию (r8_***...***1234)
✅ Кнопка для установки/обновления ключа

## Как использовать

### Для существующих команд

1. **Зайдите в админ панель:**
   - http://localhost:3000/signin
   - Войдите как админ

2. **Откройте Admin Dashboard:**
   - Перейдите на http://localhost:3000/admin
   - Найдите секцию "Replicate API Key"

3. **Установите ключ:**
   - Нажмите "Set API Key"
   - Введите ваш Replicate API ключ (начинается с `r8_`)
   - Получить ключ можно тут: https://replicate.com/account/api-tokens

### Для новых команд

**Способ 1 - без ключа (установить позже в админке):**
```bash
node scripts/setup-team.js "Team Name" "admin@email.com" "Admin Name" "password123"
```

**Способ 2 - с ключом сразу:**
```bash
node scripts/setup-team.js "Team Name" "admin@email.com" "Admin Name" "password123" "r8_your_api_key_here"
```

## Поведение системы

### ✅ Когда у команды есть ключ:
- Генерация работает нормально
- Используется ключ команды
- Биллинг идет на аккаунт команды

### ❌ Когда у команды НЕТ ключа:
- Генерация возвращает ошибку:
  ```
  "Replicate API key not configured for your team.
   Please contact your administrator to set up the API key in team settings."
  ```
- Пользователи не могут генерировать изображения
- В админ панели показывается предупреждение

## Безопасность

- ✅ Ключ виден только админам команды
- ✅ В UI показывается замаскированная версия
- ✅ Валидация формата ключа (должен начинаться с `r8_`)
- ✅ Полная изоляция ключей между командами

## API Key Management

### GET /api/admin/api-key
Получить информацию о ключе:
```json
{
  "configured": true,
  "maskedKey": "r8_Abcd***...***XYZ9"
}
```

### PATCH /api/admin/api-key
Обновить ключ:
```json
{
  "apiKey": "r8_your_full_api_key_here"
}
```

**Ответ при успехе:**
```json
{
  "success": true,
  "message": "API key updated successfully"
}
```

**Ошибки:**
- `400` - Неверный формат ключа
- `401` - Не авторизован
- `403` - Не админ
- `500` - Ошибка сервера

## Миграция существующих команд

Если у вас уже есть команды в БД:

1. Миграция уже применена ко всем командам
2. Поле `replicate_api_key` добавлено со значением `NULL`
3. Админы должны установить ключ через админ панель
4. До установки ключа - генерация не работает

## Troubleshooting

**Ошибка: "API key not configured"**
- Решение: Админ должен установить ключ в `/admin`

**Ошибка: "Invalid API key format"**
- Решение: Ключ должен начинаться с `r8_`
- Проверьте, что скопировали ключ полностью

**Ключ не сохраняется**
- Проверьте права админа
- Проверьте формат ключа
- Посмотрите логи сервера

## Файлы

**Backend:**
- `migrations/002_add_team_api_key.sql` - миграция БД
- `app/api/admin/api-key/route.ts` - API endpoint
- `app/api/generate/route.ts` - обновленная генерация

**Frontend:**
- `app/admin/page.tsx` - UI для управления ключом

**Scripts:**
- `scripts/setup-team.js` - обновленный скрипт setup

## Примеры использования

### Создание команды с ключом:
```bash
node scripts/setup-team.js \
  "My Awesome Team" \
  "admin@myteam.com" \
  "John Admin" \
  "securepass123" \
  "r8_AbCdEfGhIjKlMnOpQrStUvWxYz123456789"
```

### Обновление ключа через curl:
```bash
curl -X PATCH http://localhost:3000/api/admin/api-key \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"apiKey": "r8_new_key_here"}'
```

---

**Дата реализации:** 2025-01-17
**Статус:** ✅ Полностью реализовано и протестировано
