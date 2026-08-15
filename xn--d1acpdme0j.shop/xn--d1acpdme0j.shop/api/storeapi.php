<?php
require __DIR__.'/_util.php';
$fn = isset($_GET['fn']) ? $_GET['fn'] : '';

if ($fn === 'filters') {
  $raw = fixture('filters_' . preg_replace('/\D/', '', $_GET['storepartuid'] ?? '') . '.json');
  json_out($raw !== null ? $raw : '{"sort":false,"search":false,"filters":[]}', true);
}
if ($fn === 'list') {
  $raw = fixture('list_' . preg_replace('/\D/', '', $_GET['storepartuid'] ?? '') . '.json');
  if ($raw === null) json_out(array('total' => 0, 'products' => array()));
  $d = json_decode($raw, true);
  $size = max(0, intval($_GET['size'] ?? 0));
  $slice = max(1, intval($_GET['slice'] ?? 1));
  if ($size > 0) $d['products'] = array_slice($d['products'], ($slice - 1) * $size, $size);
  json_out($d);
}
if ($fn === 'byuid') {
  $all = json_decode(fixture('byuid_all.json') ?: '{"products":[],"options":[]}', true);
  $req = body_json();
  $uids = array_map('strval', isset($req['productsuid']) ? $req['productsuid'] : array());
  $by = array();
  foreach ($all['products'] as $p) $by[strval($p['uid'])] = $p;
  $products = array();
  foreach ($uids as $u) if (isset($by[$u])) $products[] = $by[$u];
  json_out(array('products' => $products, 'options' => $all['options'], 'ts' => time()));
}
if ($fn === 'discounts') json_out('[]', true);
json_out(new stdClass());
