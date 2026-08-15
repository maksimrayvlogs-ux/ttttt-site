<?php
declare(strict_types=1);

require __DIR__ . '/telegram-config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_value($value): string
{
    if (is_bool($value)) {
        return $value ? 'Да' : 'Нет';
    }
    if (!is_scalar($value)) {
        return '';
    }
    $value = trim(preg_replace('/\s+/u', ' ', (string)$value) ?? '');
    if ($value === '' || strtolower($value) === 'undefined' || strtolower($value) === 'null') {
        return '';
    }
    return $value;
}

function tg_escape($value): string
{
    return htmlspecialchars(clean_value($value), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function first_value(array $data, array $keys): string
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $data)) {
            $value = clean_value($data[$key]);
            if ($value !== '') {
                return $value;
            }
        }
    }
    return '';
}

function money($value, string $currency = 'RUB'): string
{
    if (!is_numeric($value)) {
        return clean_value($value);
    }
    $number = (float)$value;
    $formatted = number_format($number, floor($number) == $number ? 0 : 2, ',', ' ');
    return $formatted . ($currency === 'RUB' ? ' ₽' : ' ' . $currency);
}

function telegram_api(string $method, array $params): array
{
    $url = 'https://api.telegram.org/bot' . ODEYALKO_TELEGRAM_BOT_TOKEN . '/' . $method;
    $body = http_build_query($params, '', '&');
    $response = false;
    $httpCode = 0;

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, array(
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            CURLOPT_HTTPHEADER => array('Content-Type: application/x-www-form-urlencoded'),
        ));
        $response = curl_exec($curl);
        $httpCode = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);
        if ($response === false) {
            return array('ok' => false, 'description' => 'Ошибка соединения: ' . $curlError);
        }
    } else {
        $context = stream_context_create(array('http' => array(
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $body,
            'timeout' => 15,
            'ignore_errors' => true,
        )));
        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            return array('ok' => false, 'description' => 'Сервер не смог подключиться к Telegram API.');
        }
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $match)) {
            $httpCode = (int)$match[1];
        }
    }

    $decoded = json_decode((string)$response, true);
    if (!is_array($decoded)) {
        return array('ok' => false, 'description' => 'Некорректный ответ Telegram, HTTP ' . $httpCode);
    }
    return $decoded;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(array('error' => 'Method not allowed'), 405);
}

$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 524288) {
    respond(array('error' => 'Заказ слишком большой.'), 413);
}

$rawBody = file_get_contents('php://input') ?: '';
$contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
$data = $_POST;
if (strpos($contentType, 'application/json') !== false || strpos($contentType, 'text/plain') !== false) {
    $decodedBody = json_decode($rawBody, true);
    if (is_array($decodedBody)) {
        $data = $decodedBody;
    }
} elseif (!$data && $rawBody !== '') {
    parse_str($rawBody, $data);
}

$payment = array();
if (isset($data['tildapayment'])) {
    if (is_array($data['tildapayment'])) {
        $payment = $data['tildapayment'];
    } else {
        $decodedPayment = json_decode((string)$data['tildapayment'], true);
        if (is_array($decodedPayment)) {
            $payment = $decodedPayment;
        }
    }
}

$products = isset($payment['products']) && is_array($payment['products']) ? $payment['products'] : array();
if (!$products) {
    respond(array('error' => 'Корзина пуста или данные товаров не получены.'), 422);
}

$chatId = is_file(ODEYALKO_TELEGRAM_CHAT_FILE) ? trim((string)@file_get_contents(ODEYALKO_TELEGRAM_CHAT_FILE)) : '';
if (!preg_match('/^-?\d+$/', $chatId)) {
    respond(array('error' => 'Telegram ещё не настроен. Сначала запустите telegram-setup.php.'), 503);
}

// Защита от случайного двойного клика по кнопке заказа.
$clientIp = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'odeyalko-order-' . hash('sha256', $clientIp) . '.lock';
$rateHandle = @fopen($rateFile, 'c+');
if ($rateHandle && @flock($rateHandle, LOCK_EX)) {
    $last = (float)trim((string)stream_get_contents($rateHandle));
    if ($last > 0 && microtime(true) - $last < 2.0) {
        @flock($rateHandle, LOCK_UN);
        @fclose($rateHandle);
        respond(array('error' => 'Заказ уже отправляется. Подождите несколько секунд.'), 429);
    }
    ftruncate($rateHandle, 0);
    rewind($rateHandle);
    fwrite($rateHandle, (string)microtime(true));
    fflush($rateHandle);
    @flock($rateHandle, LOCK_UN);
    @fclose($rateHandle);
}

date_default_timezone_set('Europe/Moscow');
$orderNumber = date('ymd-His') . '-' . substr(hash('sha256', $rawBody . microtime(true)), 0, 5);
$currency = clean_value($payment['currency'] ?? 'RUB') ?: 'RUB';

$name = first_value($data, array('Name', 'name', 'Имя', 'ФИО', 'Как вас зовут'));
$phone = first_value($data, array('Phone', 'phone', 'Телефон', 'Номер телефона'));
$email = first_value($data, array('Email', 'email', 'E-mail'));
$messenger = first_value($data, array('Messenger', 'messenger', 'Контакт в мессенджере', 'Мессенджер', 'Telegram'));
$address = first_value($data, array('Address', 'address', 'Адрес', 'Адрес доставки'));

$delivery = isset($payment['delivery']) && is_array($payment['delivery']) ? $payment['delivery'] : array();
if ($address === '') {
    $addressParts = array();
    foreach (array('onelineaddress', 'city', 'street', 'house', 'aptoffice', 'floor', 'entrance') as $key) {
        if (isset($delivery[$key])) {
            $part = clean_value($delivery[$key]);
            if ($part !== '') {
                $addressParts[] = $part;
            }
        }
    }
    $address = implode(', ', array_unique($addressParts));
}

$lines = array();
$lines[] = '🛍 <b>Новый заказ с одеялко.shop</b>';
$lines[] = '<b>Номер:</b> ' . tg_escape($orderNumber);
$lines[] = '<b>Время:</b> ' . tg_escape(date('d.m.Y H:i'));
$lines[] = '';
if ($name !== '') {
    $lines[] = '👤 <b>Клиент:</b> ' . tg_escape($name);
}
if ($phone !== '') {
    $lines[] = '📞 <b>Телефон:</b> ' . tg_escape($phone);
}
if ($email !== '') {
    $lines[] = '✉️ <b>Email:</b> ' . tg_escape($email);
}
if ($messenger !== '') {
    $lines[] = '💬 <b>Мессенджер:</b> ' . tg_escape($messenger);
}
if ($address !== '') {
    $lines[] = '📍 <b>Адрес:</b> ' . tg_escape($address);
}
if ($delivery) {
    $deliveryName = clean_value($delivery['name'] ?? '');
    $deliveryPrice = $delivery['price'] ?? null;
    if ($deliveryName !== '') {
        $deliveryText = tg_escape($deliveryName);
        if ($deliveryPrice !== null && clean_value($deliveryPrice) !== '') {
            $deliveryText .= ' — ' . tg_escape(money($deliveryPrice, $currency));
        }
        $lines[] = '🚚 <b>Доставка:</b> ' . $deliveryText;
    }
}

$usedKeys = array_flip(array(
    'Name', 'name', 'Имя', 'ФИО', 'Как вас зовут',
    'Phone', 'phone', 'Телефон', 'Номер телефона',
    'Email', 'email', 'E-mail',
    'Messenger', 'messenger', 'Контакт в мессенджере', 'Мессенджер', 'Telegram',
    'Address', 'address', 'Адрес', 'Адрес доставки',
    'tildapayment', 'tildaspec-formname', 'formservices',
));
$extraLines = array();
foreach ($data as $key => $value) {
    if (isset($usedKeys[$key]) || strpos((string)$key, 'tilda') === 0 || !is_scalar($value)) {
        continue;
    }
    $clean = clean_value($value);
    if ($clean !== '') {
        $extraLines[] = '<b>' . tg_escape($key) . ':</b> ' . tg_escape($clean);
    }
}
if ($extraLines) {
    $lines[] = '';
    $lines[] = '📋 <b>Данные покупателя</b>';
    foreach ($extraLines as $extraLine) {
        $lines[] = $extraLine;
    }
}

$lines[] = '';
$lines[] = '🛏 <b>Состав заказа</b>';
foreach ($products as $index => $product) {
    if (!is_array($product)) {
        continue;
    }
    $productName = clean_value($product['name'] ?? ($product['title'] ?? 'Товар')) ?: 'Товар';
    $quantity = clean_value($product['quantity'] ?? '1') ?: '1';
    $price = $product['price'] ?? null;
    $amount = $product['amount'] ?? null;
    $line = '<b>' . ((int)$index + 1) . '.</b> ' . tg_escape($productName) . ' × ' . tg_escape($quantity);
    if ($amount !== null && clean_value($amount) !== '') {
        $line .= ' — ' . tg_escape(money($amount, $currency));
    } elseif ($price !== null && clean_value($price) !== '') {
        $line .= ' — ' . tg_escape(money($price, $currency)) . '/шт.';
    }
    $lines[] = $line;

    if (!empty($product['options']) && is_array($product['options'])) {
        foreach ($product['options'] as $option) {
            if (!is_array($option)) {
                continue;
            }
            $optionName = clean_value($option['option'] ?? '');
            $variant = clean_value($option['variant'] ?? '');
            if ($optionName !== '' || $variant !== '') {
                $lines[] = '   • ' . tg_escape($optionName) . ($optionName !== '' && $variant !== '' ? ': ' : '') . tg_escape($variant);
            }
        }
    }
    $sku = clean_value($product['sku'] ?? '');
    if ($sku !== '') {
        $lines[] = '   <i>Артикул: ' . tg_escape($sku) . '</i>';
    }
}

$promocode = clean_value($payment['promocode'] ?? first_value($data, array('Промокод', 'Промокод на скидку')));
$discount = $payment['discount'] ?? null;
if ($promocode !== '') {
    $lines[] = '';
    $lines[] = '🏷 <b>Промокод:</b> ' . tg_escape($promocode);
}
if ($discount !== null && clean_value($discount) !== '') {
    $lines[] = '💸 <b>Скидка:</b> ' . tg_escape(money($discount, $currency));
}
if (isset($payment['amount'])) {
    $lines[] = '💰 <b>Итого:</b> ' . tg_escape(money($payment['amount'], $currency));
}

$message = implode("\n", $lines);
if (function_exists('mb_strcut')) {
    $message = mb_strcut($message, 0, 3900, 'UTF-8');
} elseif (strlen($message) > 3900) {
    $message = substr($message, 0, 3900);
}

$sent = telegram_api('sendMessage', array(
    'chat_id' => $chatId,
    'text' => $message,
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => 'true',
));

if (empty($sent['ok'])) {
    $description = isset($sent['description']) ? (string)$sent['description'] : 'Неизвестная ошибка Telegram';
    error_log('Odeyalko Telegram order error: ' . $description);
    respond(array('error' => 'Не удалось передать заказ в Telegram. Корзина сохранена — попробуйте ещё раз.'), 502);
}

respond(array(
    'results' => array('tg:' . time() . ':' . $orderNumber),
    'message' => 'OK',
));
