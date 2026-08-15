<?php
// одеялко — общие функции mock-API (демо-режим, реальные заказы не создаются)
function json_out($data, $raw=false) {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-cache');
  echo $raw ? $data : json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}
function fixture($name) {
  $p = __DIR__ . '/fixtures/' . basename($name);
  return file_exists($p) ? file_get_contents($p) : null;
}
function body_json() {
  $b = file_get_contents('php://input');
  $d = json_decode($b, true);
  return is_array($d) ? $d : array();
}
