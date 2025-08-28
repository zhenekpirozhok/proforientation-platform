# Database & Migrations (PostgreSQL)

## 📌 Описание
В проекте используется **PostgreSQL** в Docker.  
Все изменения схемы базы данных хранятся в виде **миграций** в папке [`db/migration`](./db/migration).  
Формат имени файлов соответствует правилам **Flyway**:

```

V<номер>\_\_<описание>.sql

````

Примеры:
- `V1__init_schema.sql` — первая версия схемы
- `V2__add_index_users_email.sql` — добавлен индекс
- `V3__add_professions_table.sql` — новая таблица

⚠️ Важно: миграции нельзя переписывать задним числом.  
Новые изменения = новый файл `V<next_number>__description.sql`.

---

## 🚀 Запуск базы локально

### 1. Поднять PostgreSQL
```bash
docker compose up -d
````

После первого запуска база создастся и применит все SQL из `db/migration/`.

### 2. Подключение к базе

```bash
docker exec -it postgres_db psql -U myuser -d mydb
```

Полезные команды внутри `psql`:

```sql
\dt           -- список таблиц
\d table_name -- описание таблицы
```

---

## 🛠 Добавление новой миграции

1. Создай новый файл в `db/migration/` с правильным именем:

   ```
   V2__add_tests_table.sql
   ```
2. Напиши SQL с изменением (новая таблица, индекс, поле и т.д.)
3. Применение:

   * Для новой базы: просто пересоздать volume (`docker volume rm project_postgres_data`) и запустить `docker compose up -d`
   * В будущем (с Flyway): миграции будут применяться автоматически при старте backend-приложения.

---

## 👨‍💻 Работа Java-разработчика (будущее)

Когда подключится Java-разработчик:

* Миграции из [`db/migration`](./db/migration) будут перенесены в
  `backend/src/main/resources/db/migration`
* Подключается **Flyway** в Spring Boot
* Flyway сам накатывает новые миграции при старте приложения

