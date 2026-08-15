<?php
/**
 * одеялко — приём заказов и вопросов, отправка в Telegram владельца.
 * Секреты берутся ТОЛЬКО из окружения или закрытого конфига ВЫШЕ document root.
 * Никаких токенов в этом файле и во frontend быть не должно.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function jout($arr, $code = 200) {
  http_response_code($code);
  echo json_encode($arr, JSON_UNESCAPED_UNICODE);
  exit;
}

/* ---------- только POST + JSON + лимит размера ---------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') jout(['ok' => false, 'error' => 'method_not_allowed'], 405);
$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ctype, 'application/json') === false) jout(['ok' => false, 'error' => 'bad_content_type'], 415);
$raw = file_get_contents('php://input', false, null, 0, 65536);
if ($raw === false || strlen($raw) < 2) jout(['ok' => false, 'error' => 'empty_body'], 400);
if (strlen($raw) >= 65536) jout(['ok' => false, 'error' => 'too_large'], 413);
$in = json_decode($raw, true);
if (!is_array($in)) jout(['ok' => false, 'error' => 'bad_json'], 400);

/* ---------- honeypot ---------- */
if (!empty($in['website'])) jout(['ok' => true, 'order' => 'OK']); /* бот: тихо игнорируем */

/* ---------- rate limit: 10 запросов / 10 минут на IP ---------- */
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$rl = sys_get_temp_dir() . '/odk_rl_' . md5($ip);
$hits = [];
if (is_file($rl)) $hits = array_filter(array_map('intval', file($rl, FILE_IGNORE_NEW_LINES)), fn($t) => $t > time() - 600);
if (count($hits) >= 10) jout(['ok' => false, 'error' => 'rate_limited'], 429);
$hits[] = time();
@file_put_contents($rl, implode("\n", $hits));

/* ---------- idempotency: не отправлять один заказ дважды ---------- */
$idem = preg_replace('/[^a-zA-Z0-9_.-]/', '', (string)($in['idempotency'] ?? ''));
if ($idem !== '') {
  $idf = sys_get_temp_dir() . '/odk_idem_' . md5($idem);
  if (is_file($idf) && filemtime($idf) > time() - 900) {
    $prev = @file_get_contents($idf);
    jout(['ok' => true, 'order' => $prev ?: 'DUP', 'duplicate' => true]);
  }
}

/* ---------- очистка данных ---------- */
function clean($v, $max = 300) {
  $v = trim((string)$v);
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $v);
  if (function_exists('mb_substr')) return mb_substr($v, 0, $max, 'UTF-8');
  return substr($v, 0, $max * 4);
}

$type = clean($in['type'] ?? 'order', 20);
$page = clean($in['page'] ?? '', 300);
$host = parse_url($page, PHP_URL_HOST) ?: ($_SERVER['HTTP_HOST'] ?? '');

/* ---------- конфиг Telegram ---------- */
function odk_tg_config() {
  $token = getenv('TELEGRAM_BOT_TOKEN') ?: '';
  $chat  = getenv('TELEGRAM_CHAT_ID') ?: '';
  $api   = '';

  /* Сначала используем уже подключённый конфиг текущего сайта. */
  $legacyConfig = __DIR__ . '/telegram-config.php';
  if (is_file($legacyConfig)) {
    include_once $legacyConfig;
    if (defined('ODEYALKO_TELEGRAM_BOT_TOKEN')) $token = $token ?: (string)ODEYALKO_TELEGRAM_BOT_TOKEN;
    if ($chat === '' && defined('ODEYALKO_TELEGRAM_CHAT_FILE') && is_file(ODEYALKO_TELEGRAM_CHAT_FILE)) {
      $chat = trim((string)@file_get_contents(ODEYALKO_TELEGRAM_CHAT_FILE));
    }
  }
  if ($chat === '' && is_file(__DIR__ . '/.telegram-chat-id')) {
    $chat = trim((string)@file_get_contents(__DIR__ . '/.telegram-chat-id'));
  }

  /* Дополнительно поддерживаем закрытый конфиг рядом с публичной папкой. */
  $paths = [
    dirname(__DIR__) . '/odeyalko-private/telegram-config.php',
    dirname($_SERVER['DOCUMENT_ROOT'] ?: dirname(__DIR__)) . '/odeyalko-private/telegram-config.php',
    dirname(dirname(__DIR__)) . '/odeyalko-private/telegram-config.php',
  ];
  foreach ($paths as $p) {
    if (is_file($p)) {
      $cfg = include $p;
      if (is_array($cfg)) {
        $token = $token ?: (string)($cfg['TELEGRAM_BOT_TOKEN'] ?? '');
        $chat  = $chat  ?: (string)($cfg['TELEGRAM_CHAT_ID'] ?? '');
        $api   = (string)($cfg['TELEGRAM_API_BASE'] ?? ''); /* только для локальных тестов */
      }
      break;
    }
  }
  return ['token' => $token, 'chat' => $chat, 'api' => $api ?: 'https://api.telegram.org'];
}

function odk_tg_send($text) {
  $c = odk_tg_config();
  if ($c['token'] === '' || $c['chat'] === '') return ['ok' => false, 'error' => 'telegram_not_configured'];
  $url = rtrim($c['api'], '/') . '/bot' . $c['token'] . '/sendMessage';
  $body = http_build_query(['chat_id' => $c['chat'], 'text' => $text, 'disable_web_page_preview' => 'true']);

  /* На REG.RU соединение с Telegram стабильно проходит по IPv4. */
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => $body,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CONNECTTIMEOUT => 8,
      CURLOPT_TIMEOUT => 15,
      CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
      CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    ]);
    $resp = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($resp === false || $httpCode < 200 || $httpCode >= 300) {
      return ['ok' => false, 'error' => 'telegram_unreachable'];
    }
    $d = json_decode((string)$resp, true);
    if (!is_array($d) || empty($d['ok'])) return ['ok' => false, 'error' => 'telegram_api_error'];
    return ['ok' => true];
  }

  $ctx = stream_context_create(['http' => [
    'method' => 'POST',
    'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
    'content' => $body,
    'timeout' => 10,
    'ignore_errors' => true,
  ]]);
  $resp = @file_get_contents($url, false, $ctx);
  if ($resp === false) return ['ok' => false, 'error' => 'telegram_unreachable'];
  $d = json_decode($resp, true);
  if (!is_array($d) || empty($d['ok'])) return ['ok' => false, 'error' => 'telegram_api_error'];
  return ['ok' => true];
}

/* =================== ВОПРОС =================== */
if ($type === 'question') {
  $name = clean($in['name'] ?? '', 100);
  $contact = clean($in['contact'] ?? '', 150);
  $msg = clean($in['message'] ?? '', 1500);
  if ($name === '' || $contact === '' || $msg === '') jout(['ok' => false, 'error' => 'validation'], 422);
  $text = "💬 НОВЫЙ ВОПРОС С САЙТА\n\n" .
    "👤 Имя: {$name}\n" .
    "💬 Контакт: {$contact}\n" .
    "📝 Вопрос: {$msg}\n" .
    "🌐 Страница: {$page}\n" .
    "🕐 Время: " . date('d.m.Y H:i');
  $r = odk_tg_send($text);
  if (!$r['ok']) jout(['ok' => false, 'error' => $r['error']], 503);
  jout(['ok' => true]);
}

/* =================== ЗАКАЗ =================== */
$name = clean($in['name'] ?? '', 100);
$method = clean($in['contactMethod'] ?? '', 30);
$contact = clean($in['contact'] ?? '', 150);
$address = clean($in['address'] ?? '', 500);
$promocode = strtoupper(clean($in['promocode'] ?? '', 30));
$items = is_array($in['items'] ?? null) ? array_slice($in['items'], 0, 40) : [];

if ($name === '' || $contact === '' || $address === '' || !count($items)) {
  jout(['ok' => false, 'error' => 'validation'], 422);
}
if ($method === 'телефон' && !preg_match('/^\+7\d{10}$/', $contact)) {
  jout(['ok' => false, 'error' => 'bad_phone'], 422);
}

/* ---------- серверная проверка цен ---------- */
$PRICES = is_file(__DIR__ . '/prices.php') ? (include __DIR__ . '/prices.php') : [];
$subtotal = 0;
$rows = [];
$unverified = [];
$n = 0;
foreach ($items as $it) {
  $n++;
  $iname = clean($it['name'] ?? ('Позиция ' . $n), 150);
  $sku = clean($it['sku'] ?? '', 60);
  $qty = max(1, min(99, intval($it['qty'] ?? 1)));
  $clientPrice = max(0, intval($it['price'] ?? 0));
  $price = $clientPrice;
  if ($sku !== '' && isset($PRICES[$sku])) {
    $price = intval($PRICES[$sku]); /* цена из серверной матрицы, браузеру не доверяем */
    if ($clientPrice !== $price) $unverified[] = $iname . ' (цена скорректирована сервером)';
  } elseif ($sku !== '') {
    $unverified[] = $iname . ' (SKU вне серверной матрицы)';
  }
  $sum = $price * $qty;
  $subtotal += $sum;
  $rows[] = ['name' => $iname, 'sku' => $sku, 'qty' => $qty, 'price' => $price, 'sum' => $sum];
}
$discount = 0;
if ($promocode === 'ODEYALKO10') $discount = (int)round($subtotal * 0.10);
elseif ($promocode !== '') { $promocode = ''; }
$total = $subtotal - $discount;

$orderNo = 'ODK-' . date('ymd') . '-' . strtoupper(substr(md5(($idem ?: uniqid('', true)) . '|odk'), 0, 5));

$fmt = fn($v) => number_format($v, 0, ',', ' ');
$lines = "🛏 НОВЫЙ ЗАКАЗ «ОДЕЯЛКО»\n\n";
$lines .= "🆔 Заказ №{$orderNo}\n";
$lines .= "🕐 Дата и время: " . date('d.m.Y H:i') . "\n\n";
$lines .= "👤 Клиент: {$name}\n";
$lines .= "📞 Способ связи: {$method}\n";
$lines .= "💬 Контакт: {$contact}\n";
$lines .= "🚚 Адрес доставки: {$address}\n\n";
$lines .= "🛒 СОСТАВ ЗАКАЗА\n\n";
$i = 0;
foreach ($rows as $r) {
  $i++;
  $lines .= "{$i}. {$r['name']}\n";
  $lines .= "Количество: {$r['qty']}\n";
  $lines .= "Цена за единицу: " . $fmt($r['price']) . " ₽\n";
  $lines .= "Сумма: " . $fmt($r['sum']) . " ₽\n";
  if ($r['sku'] !== '') $lines .= "Арт. (внутр.): {$r['sku']}\n";
  $lines .= "\n";
}
$lines .= "🎟 Промокод: " . ($promocode !== '' ? $promocode : 'не применён') . "\n";
$lines .= "💸 Скидка: " . $fmt($discount) . " ₽\n";
$lines .= "💰 ИТОГО: " . $fmt($total) . " ₽\n\n";
if (count($unverified)) $lines .= "⚠ Проверить: " . implode('; ', array_slice($unverified, 0, 5)) . "\n";
$lines .= "🌐 Страница оформления: {$page}\n";
$lines .= "🔖 Внутренний номер: " . ($idem ?: '—');

$r = odk_tg_send($lines);
if (!$r['ok']) {
  /* НЕ подтверждаем успех и НЕ даём фронту чистить корзину */
  jout(['ok' => false, 'error' => $r['error']], 503);
}
if ($idem !== '') @file_put_contents(sys_get_temp_dir() . '/odk_idem_' . md5($idem), $orderNo);
jout(['ok' => true, 'order' => $orderNo, 'total' => $total]);
