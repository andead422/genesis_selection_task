# genesis_selection_task

Для отримання курсу біткоіна до гривні використано API [nomics.com](nomics.com), код доступу можно отримати за [посиланням](https://p.nomics.com/cryptocurrency-bitcoin-api). Його необхідно вставити у файл config.js функцію return_key замість api.key.

Надсилання листів реалізовано за допомогою модуля nodemailer. Оскільки для роботи з поштою gmail необхідно проходити аутентифікацію OAuth2.0(у тому числі й під час використання Docker), я використав функцію, що створює аккаунт на тестовому поштовому сервері.
