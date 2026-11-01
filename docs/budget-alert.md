# Yandex Cloud budget alert

The AI Studio invoice on 29.10–01.11 was 185.20 ₽ before a 185.12 ₽ discount
(0.08 ₽ payable). The grant is finite; add an alert before it expires.

## 1. Console

1. Open **Yandex Cloud → Billing → Budgets**.
2. Create a budget for the `cloud-learnkit` account:
   - amount: **500 ₽ / month** (a safe first threshold);
   - period: monthly;
   - notify at **50%**, **80%** and **100%**.
3. Add recipients: the owner email and the support Telegram chat.
4. Also enable **Forecast** alerts so a fast spike is visible before month-end.

## 2. API alternative

With a service account that has `billing.budgetEditor`:

```bash
yc billing budget create det-academy-monthly \
  --amount 500 \
  --currency RUB \
  --period monthly \
  --threshold 50 \
  --threshold 80 \
  --threshold 100
```

Store the service-account key outside the repository.

## 3. What to watch

- DeepSeek V4 Flash: **300 ₽/1M input, 500 ₽/1M output**.
- SpeechKit TTS: **0.25 ₽ per new synthesis request** (cache hits are free).
- The admin **AI** tab now separates token and TTS costs.
- A spike in TTS requests usually means the permanent cache was bypassed or
  the lesson bank changed.
