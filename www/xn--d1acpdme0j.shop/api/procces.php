<?php
// Демонстрационное оформление заказа: данные никуда не отправляются и не сохраняются.
require __DIR__.'/_util.php';
json_out(array('results' => array('demo:' . time() . ':0')));
