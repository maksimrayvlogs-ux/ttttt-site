<?php
require __DIR__.'/_util.php';
$req = body_json();
$action = isset($req['action']) ? $req['action'] : '';
if ($action === 'countries') json_out(fixture('delivery_countries.json') ?: '{"countries":"ru"}', true);
if ($action === 'list') json_out(fixture('delivery_list_ru.json') ?: '[]', true);
json_out(new stdClass());
