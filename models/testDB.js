const { initDB, User } = require("./index");

console.log("🚀 Запуск теста подключения к базе...");

const testDB = async () => {
  try {
    await initDB();
    console.log("✅ Подключение к БД успешно!");

    const user = await User.create({
      email: "admin@example.com",
      password: "securepassword",
      role: "admin",
    });

    console.log("✅ Создан пользователь:", user.toJSON());
  } catch (error) {
    console.error("❌ Ошибка:", error);
  }
};

testDB();
