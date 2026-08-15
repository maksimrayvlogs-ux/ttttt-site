<?php
require __DIR__.'/_util.php';

// UTF-8 lowercase без mbstring: ASCII + кириллица
function lc_utf8($s) {
  $s = strtolower($s);
  $from = array('А','Б','В','Г','Д','Е','Ж','З','И','Й','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Ъ','Ы','Ь','Э','Ю','Я','Ё');
  $to   = array('а','б','в','г','д','е','ж','з','и','й','к','л','м','н','о','п','р','с','т','у','ф','х','ц','ч','ш','щ','ъ','ы','ь','э','ю','я','ё');
  return str_replace($from, $to, $s);
}

$kind = isset($_GET['kind']) ? $_GET['kind'] : '';
$file = array('city' => 'geo_city.json', 'address' => 'geo_street.json', 'house' => 'geo_house.json');
if (!isset($file[$kind])) json_out('[]', true);
$list = json_decode(fixture($file[$kind]) ?: '[]', true);
$req = body_json();
$pattern = lc_utf8(isset($req['pattern']) ? $req['pattern'] : '');
if ($pattern !== '' && is_array($list)) {
  $filtered = array_values(array_filter($list, function ($it) use ($pattern) {
    $name = lc_utf8(isset($it['name']) ? $it['name'] : '');
    $full = lc_utf8(isset($it['fullName']) ? $it['fullName'] : '');
    return strpos($name, $pattern) === 0 || strpos($full, $pattern) !== false;
  }));
  if (count($filtered)) $list = $filtered;
}
json_out($list);
