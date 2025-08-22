// Загружаем переменные окружения из .env
import dotenv from "dotenv";
dotenv.config();

// Импортируем классы из mailersend
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

// Инициализируем MailerSend
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Адрес отправителя (должен быть с подтверждённого домена)
const sentFrom = new Sender(
  "info@test-eqvygm0ko3dl0p7w.mlsender.net", // ← временный домен MailerSend
  "NeuroCheck Team"
);

// Адрес получателя (во время триала — только e-mail администратора)
const recipients = [
  new Recipient("goniponene92978@gmail.com", "Тестовый пользователь")
];

// Параметры письма
const emailParams = new EmailParams()
  .setFrom(sentFrom)
  .setTo(recipients)
  .setReplyTo(sentFrom)
  .setSubject("Ваш тест NeuroCheck завершён!")
  .setText("Поздравляем! Вы прошли тест. Ваши результаты готовы.")
  .setHtml("<p>Поздравляем! Вы прошли тест. <b>Ваши результаты готовы.</b></p>");

// Отправляем письмо
mailerSend.email.send(emailParams)
  .then((response) => {
    console.log("✅ Письмо успешно отправлено!");
    console.log(response);
  })
  .catch((error) => {
    console.error("❌ Ошибка при отправке письма:");
    console.error(error);
  });